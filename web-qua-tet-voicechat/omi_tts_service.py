"""
OmniVoice TTS Service for Pipecat Integration
Calls OmniVoice-TTS REST API at localhost:8500
"""

import aiohttp
import io
import re
import wave
from typing import AsyncGenerator
from loguru import logger

from pipecat.frames.frames import (
    ErrorFrame,
    Frame,
    TTSAudioRawFrame,
    TTSStartedFrame,
    TTSStoppedFrame,
)
from pipecat.services.tts_service import TTSService
from pipecat.utils.tracing.service_decorators import traced_tts
# Giả sử các module utils vẫn tồn tại trong project của bạn
try:
    from utils.tts_rules import process_tts_text, end_of_sentence
    from utils.vi_nomalize import normalize_vietnamese_text
except ImportError:
    def normalize_vietnamese_text(text): return text
    def end_of_sentence(text): return text + "." if text and text[-1] not in ".!?" else text

    def process_tts_text(text, min_words=3):
        """Vietnamese-aware sentence splitter for TTS.

        Splits on punctuation but avoids breaking abbreviations (TP.HCM),
        numbered lists (1. 2.), and numbers with decimals/commas (1.5, 1,000).
        Merges short fragments (< min_words) into the next sentence.
        """
        # Split by:
        # 1. Comma + Vietnamese conjunctions: , và | , nhưng | , mà | , thì | , nên | , để
        # 2. Safe dot: NOT after uppercase letter or digit, followed by space or end
        # 3. Sentence terminators: ? ! newline (NOT ; or : — they rarely end sentences in Vietnamese)
        # NOTE: no IGNORECASE — [A-Z] lookbehind must be case-sensitive to work correctly
        pattern = r'([,]\s*(?:[Vv]à|[Nn]hưng|[Mm]à|[Tt]hì|[Nn]ên|[Đđ]ể)\b|(?<![A-Z\d])[.](?=\s|$)|[?!\n]+)'

        parts = re.split(pattern, text)

        sentences = []
        current_sentence = ""

        for part in parts:
            if not part:
                continue
            if re.match(pattern, part):
                current_sentence += part
                word_count = len(current_sentence.strip().split())
                if word_count > min_words:
                    sentences.append(current_sentence.strip())
                    current_sentence = ""
            else:
                current_sentence += part

        if current_sentence.strip():
            sentences.append(current_sentence.strip())

        return sentences


# Available voices from OmniVoice TTS
OMNIVOICE_VOICES = {
    "nam1": "Giọng Nam 1 (Miền Nam)",
    "nam2": "Giọng Nam 2",
    "nam3": "Giọng Nam 3",
    "nam4": "Giọng Nam 4",
    "nam oto": "Giọng Nam Oto",
    "numiennam": "Giọng Nữ miền Nam",
    "nu 3": "Giọng Nữ 3 (Điện Máy Xanh)",
    "nu thanh giang": "Giọng Nữ Thanh Giang",
    "hue": "Giọng Huế 1",
    "hue2": "Giọng Huế 2",
    "tnh": "Thầy Thích Nhất Hạnh",
    "custom": "Giọng nữ 1 (Nón Lá AI)",
    "default": "Default Voice (English)",
}


def extract_pcm_from_wav(wav_bytes: bytes) -> tuple[bytes, int, int]:
    """Extract raw PCM data from WAV file bytes.
    
    Returns:
        tuple: (pcm_data, sample_rate, num_channels)
    """
    with io.BytesIO(wav_bytes) as wav_io:
        with wave.open(wav_io, 'rb') as wav_file:
            sample_rate = wav_file.getframerate()
            num_channels = wav_file.getnchannels()
            pcm_data = wav_file.readframes(wav_file.getnframes())
            return pcm_data, sample_rate, num_channels


class OmniVoiceTTSService(TTSService):
    """OmniVoice TTS service for Pipecat.
    
    Calls OmniVoice-TTS REST API (F5-TTS) for Vietnamese text-to-speech.
    """

    def __init__(
        self,
        *,
        aiohttp_session: aiohttp.ClientSession,
        base_url: str = "http://localhost:8500",
        voice_id: str = "nam2",
        sample_rate: int = 24000,
        **kwargs,
    ):
        """Initialize OmniVoice TTS service.

        Args:
            aiohttp_session: aiohttp ClientSession for HTTP requests.
            base_url: Base URL for OmniVoice TTS API (default: http://localhost:8500).
            voice_id: Voice ID to use (e.g., nam1, nam2, numiennam).
            sample_rate: Audio sample rate (default: 24000).
            **kwargs: Additional arguments passed to parent service.
        """
        super().__init__(
            sample_rate=sample_rate,
            **kwargs,
        )

        self._base_url = base_url.rstrip("/")
        self._voice_id = voice_id
        self._session = aiohttp_session
        self._model_name = "omnivoice-tts"  # For tracing gen_ai.request.model

    @property
    def voice_id(self) -> str:
        return self._voice_id

    @voice_id.setter
    def voice_id(self, value: str):
        if value not in OMNIVOICE_VOICES:
            logger.warning(f"Unknown voice_id: {value}. Available: {list(OMNIVOICE_VOICES.keys())}")
        self._voice_id = value

    @traced_tts
    async def run_tts(self, text: str, context_id: str = "") -> AsyncGenerator[Frame, None]:
        """Generate speech from text using OmniVoice TTS API.

        Args:
            text: Text to convert to speech (Vietnamese).

        Yields:
            Frame: Audio and control frames containing the synthesized speech.
        """
        # Skip emotion-only frames - don't read them aloud
        if re.match(r'^\[EMO:\w+\]$', text.strip()):
            return

        # Strip inline emotion tags
        text = re.sub(r'\[EMO:\w+\]\s*', '', text)
        if not text.strip():
            return

        # Split text into sentences
        sentences = process_tts_text(text)
        
        if not sentences:
            return

        url = f"{self._base_url}/tts"

        try:
            yield TTSStartedFrame()

            # Process each sentence
            for i, sentence in enumerate(sentences):
                if not sentence or not sentence.strip():
                    continue

                sentence = end_of_sentence(sentence)

                logger.info(f"OmniVoiceTTS: Generating speech {i+1}/{len(sentences)} with voice [{self._voice_id}]: {sentence[:50]}...")
                payload = {
                    "text": sentence,
                    "voice_id": self._voice_id,
                    "speed": 1.0,
                }

                async with self._session.post(
                    url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=120)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"OmniVoiceTTS error ({response.status}): {error_text}")
                        yield ErrorFrame(error=f"OmniVoice TTS API error: {error_text}")
                        continue

                    # Read WAV file content
                    wav_data = await response.read()

                    if not wav_data or len(wav_data) < 44:  # WAV header is 44 bytes
                        logger.warning(f"OmniVoiceTTS: Received empty or invalid audio data")
                        continue

                    # Extract PCM from WAV
                    try:
                        pcm_data, wav_sample_rate, num_channels = extract_pcm_from_wav(wav_data)

                        logger.debug(f"OmniVoiceTTS: Audio received - {len(pcm_data)} bytes, {wav_sample_rate}Hz, {num_channels}ch")

                        yield TTSAudioRawFrame(
                            audio=pcm_data,
                            sample_rate=wav_sample_rate,
                            num_channels=num_channels,
                        )
                    except Exception as e:
                        logger.error(f"OmniVoiceTTS: Failed to parse WAV: {e}")
                        yield ErrorFrame(error=f"Failed to parse audio: {e}")

            yield TTSStoppedFrame()

        except aiohttp.ClientError as e:
            logger.error(f"OmniVoiceTTS connection error: {e}")
            yield ErrorFrame(error=f"OmniVoice TTS connection error: {e}")
            yield TTSStoppedFrame()
        except Exception as e:
            logger.error(f"OmniVoiceTTS exception: {e}")
            yield ErrorFrame(error=f"OmniVoice TTS error: {e}")
            yield TTSStoppedFrame()

    async def set_voice(self, voice_id: str):
        """Change the voice for TTS."""
        self.voice_id = voice_id

    async def list_voices(self) -> dict:
        """Fetch available voices from the API."""
        url = f"{self._base_url}/voices"
        try:
            async with self._session.get(url) as response:
                if response.status == 200:
                    return await response.json()
        except Exception as e:
            logger.error(f"Failed to list voices: {e}")
        return OMNIVOICE_VOICES

    def can_generate_metrics(self) -> bool:
        return True
