"""
WhisperX API STT Service - Pipecat client for remote WhisperX API.

Drop-in replacement for WhisperXSTTService that calls remote API instead of local model.
"""

from typing import AsyncGenerator, Optional

import aiohttp
from loguru import logger

from pipecat.frames.frames import ErrorFrame, Frame, TranscriptionFrame
from pipecat.services.stt_service import SegmentedSTTService, STTService
from pipecat.transcriptions.language import Language
from pipecat.utils.time import time_now_iso8601
from pipecat.utils.tracing.service_decorators import traced_stt


class WhisperHallucinationFilter():

    def __init__(self, blacklist_phrases: list[str], accept_langs: list[str]=["vi","en"]):
        self.blacklist = [p.lower() for p in blacklist_phrases]
        self.accept_langs = accept_langs
    
    async def process_frame(self, text, language):
        if not text:
            return True

        text_lower = text.lower()
        # Kiểm tra nếu chứa phrase không mong muốn
        if any(phrase in text_lower for phrase in self.blacklist):
            print("ignore text frame", text_lower)
            return True

        if self.accept_langs and language not in self.accept_langs:
            print("ignore text frame not in accept_langs", text_lower)
            return True


class WhisperXAPISTTService(SegmentedSTTService):
    """
    WhisperX API-based Speech-to-Text service for Pipecat.

    Calls a remote WhisperX API server instead of running model locally.
    Compatible with WhisperX-Docker-API with bytes endpoint.

    Args:
        api_url: Base URL of WhisperX API server (e.g., "http://localhost:5772")
        api_key: Optional API key for authentication
        language: Language code for transcription (e.g., 'vi', 'en')
        timeout: HTTP request timeout in seconds
        aiohttp_session: Optional shared aiohttp session
        **kwargs: Additional arguments passed to SegmentedSTTService.
    """

    def __init__(
        self,
        *,
        api_url: str = "http://localhost:5772",
        api_key: Optional[str] = None,
        language: str = "vi",
        timeout: float = 30.0,
        score: float = 0.55,
        fallback_stt_service: Optional[STTService] = None,
        aiohttp_session: Optional[aiohttp.ClientSession] = None,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self._api_url = api_url.rstrip('/')
        self._api_key = api_key
        self._language = language
        self._timeout = timeout
        self._aiohttp_session = aiohttp_session
        self._owned_session = False
        self._score = score
        self._fallback_stt_service = fallback_stt_service
        self.fallback_count = 0
        self.all_count = 0

        self._settings = {
            "language": language,
        }
        self.hallucination_filter = WhisperHallucinationFilter(
            blacklist_phrases=[
                "hãy subscribe cho kênh la la school",
                "để không bỏ lỡ những video hấp dẫn",
                "Cảm ơn các bạn đã theo dõi",
                "Hẹn gặp lại các bạn trong những video tiếp theo",
                "Hẹn gặp lại các bạn trong những video tiếp theo",
                "Hãy subscribe cho kênh La La School Để không bỏ lỡ những video hấp dẫn",
                "Các bạn hãy đăng ký kênh để ủng hộ kênh của mình nhé."
            ]
        )

    def can_generate_metrics(self) -> bool:
        """Indicates whether this service can generate metrics."""
        return True

    async def set_language(self, language: Language):
        """Set the language for transcription."""
        lang_code = str(language.value) if hasattr(language, 'value') else str(language)
        logger.info(f"Switching STT language to: [{lang_code}]")
        self._settings["language"] = lang_code
        self._language = lang_code

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self._aiohttp_session is None:
            self._aiohttp_session = aiohttp.ClientSession()
            self._owned_session = True
        return self._aiohttp_session

    async def _close_session(self):
        """Close owned session if any."""
        if self._owned_session and self._aiohttp_session:
            await self._aiohttp_session.close()
            self._aiohttp_session = None
            self._owned_session = False

    @traced_stt
    async def _handle_transcription(
        self, transcript: str, is_final: bool, language: Optional[str] = None
    ):
        """Handle a transcription result with tracing."""
        pass

    async def run_stt(self, audio: bytes) -> AsyncGenerator[Frame, None]:
        """
        Transcribe audio data by calling WhisperX API.

        Args:
            audio: Raw audio bytes in WAV format (provided by SegmentedSTTService).

        Yields:
            Frame: Either a TranscriptionFrame containing the transcribed text
                  or an ErrorFrame if transcription fails.
        """
        await self.start_processing_metrics()
        await self.start_ttfb_metrics()

        try:
            session = await self._get_session()

            # Use binary transfer (more efficient than base64)
            url = f"{self._api_url}/v1/media/transcribe/bytes"
            headers = {
                "Content-Type": "application/octet-stream",
            }

            if self._api_key:
                headers["X-API-Key"] = self._api_key

            # Pass language via query params for binary mode
            params = {}
            # Make API call with raw binary data
            async with session.post(
                url,
                data=audio,  # Raw bytes, no base64 encoding
                headers=headers,
                params=params,
                timeout=aiohttp.ClientTimeout(total=self._timeout)
            ) as response:
                await self.stop_ttfb_metrics()

                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"WhisperX API error: {response.status} - {error_text}")
                    yield ErrorFrame(error=f"WhisperX API error: {response.status}")
                    return

                result = await response.json()

                # Handle error response
                if result.get("code") != 200:
                    error_msg = result.get("message", "Unknown error")
                    logger.error(f"WhisperX API error: {error_msg}")
                    yield ErrorFrame(error=f"WhisperX API error: {error_msg}")
                    return

                # Extract from response wrapper
                response_data = result.get("response", {})
                text = response_data.get("text", "").strip()
                detected_language = response_data.get("detected_language", self._language)
                score = response_data.get("score", 0)
                logger.info(f"WhisperX API response: {response_data} {self.all_count}/{self.fallback_count} = {self.fallback_count / self.all_count if self.all_count > 0 else 0}")
                await self.stop_processing_metrics()
               
                if text:
                    words = text.split()
                    self.all_count += 1
                    #await self._handle_transcription(text, True, detected_language)
                    logger.debug(f"Transcription: [{text}]")                    
                    ishaclu = await self.hallucination_filter.process_frame(text, detected_language)
                    if not ishaclu:
                        if score < self._score and self._fallback_stt_service and len(words) > 2:
                            logger.info(f"WhisperX API score is too low, using fallback STT service: {self.fallback_count}")
                            self.fallback_count += 1
                            async for frame in self._fallback_stt_service.run_stt(audio):
                                yield frame
                            return 
                        else:
                            yield TranscriptionFrame(
                                text,
                                self._user_id,
                                time_now_iso8601(),
                                detected_language,
                            )
                  
                           

        except aiohttp.ClientError as e:
            logger.error(f"WhisperX API connection error: {e}")
            yield ErrorFrame(error=f"WhisperX API connection error: {e}")

        except Exception as e:
            logger.error(f"WhisperX API exception: {e}")
            yield ErrorFrame(error=f"WhisperX API error: {e}")
