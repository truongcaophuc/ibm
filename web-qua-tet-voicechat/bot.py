import asyncio
import sys
import os
import signal
from loguru import logger

# Check if running in the right environment
try:
    import pipecat
except ImportError:
    print("Pipecat not found. Make sure you are running in the 'pipecat-whisperx' conda environment.")
    sys.exit(1)

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
from pipecat.frames.frames import EndFrame, TextFrame, TranscriptionFrame
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.transports.local.audio import LocalAudioTransport
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.processors.frameworks.rtvi import RTVIConfig, RTVIObserver, RTVIProcessor
from pipecat.serializers.protobuf import ProtobufFrameSerializer
from pipecat.services.google.gemini_live.llm import GeminiLiveLLMService
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService, ElevenLabsHttpTTSService
from pipecat.services.elevenlabs.stt import ElevenLabsRealtimeSTTService, ElevenLabsSTTService
from pipecat.services.openai.llm import OpenAILLMService
load_dotenv(override=True)

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")

from whisperx_service import WhisperXSTTService


async def main():
    # 1. Transport
    # Use LocalAudioTransport for microphone/speaker
    async with aiohttp.ClientSession() as session:
        ws_transport = FastAPIWebsocketTransport(
            websocket=websocket_client,
            params=FastAPIWebsocketParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
                add_wav_header=False,
                vad_analyzer=SileroVADAnalyzer(),
                serializer=ProtobufFrameSerializer(),
            ),
        )

        # 2. Services
        stt = WhisperXSTTService(device="cuda", model="base")
        vad = SileroVADAnalyzer()
        
        # 3. Pipeline
        # Transport Input -> VAD -> STT -> Print
        pipeline = Pipeline([
            transport.input(),
            vad,
            stt,
            # Simple processor to print transcriptions
            lambda frame, _: print(f"TRANSCRIPTION: {frame.text}") if isinstance(frame, TranscriptionFrame) else None
        ])
        
        task = PipelineTask(pipeline)
        runner = PipelineRunner()
        
        logger.info("Starting bot... Speak into your microphone.")
        
        try:
            await runner.run(task)
        except KeyboardInterrupt:
            await runner.stop()

if __name__ == "__main__":
    asyncio.run(main())
