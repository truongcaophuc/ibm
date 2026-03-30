#
# Copyright (c) 2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#
import os
import sys
import aiohttp
from typing import Any, Dict, Optional
from dotenv import load_dotenv
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.processors.frameworks.rtvi import RTVIConfig, RTVIObserver, RTVIProcessor
from pipecat.serializers.protobuf import ProtobufFrameSerializer
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService, ElevenLabsHttpTTSService
from pipecat.services.elevenlabs.stt import ElevenLabsRealtimeSTTService, ElevenLabsSTTService
from pipecat.services.openai.llm import OpenAILLMService

from whisperx_api_client import WhisperXAPISTTService
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.serializers.twilio import TwilioFrameSerializer

load_dotenv(override=True)

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")


async def run_bot(websocket_client, transport_type: Optional[str] = 'websocket'):
    session = aiohttp.ClientSession()
    try:
        ws_transport = None
        init_welcome = False
        
        if transport_type == 'twilio':
            init_welcome = True
            ws_transport = FastAPIWebsocketTransport(
                websocket=websocket_client,
                params=FastAPIWebsocketParams(
                    audio_in_enabled=True,
                    audio_out_enabled=True,
                    add_wav_header=False,
                    vad_analyzer=SileroVADAnalyzer(),
                    serializer=TwilioFrameSerializer(
                        stream_sid="session_id",
                        call_sid="call_id",
                        account_sid="account_sid",
                        auth_token="auth_token"
                    ),
                ),
            )
        else:
            init_welcome = True
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
        
        print("Start bot", transport_type, init_welcome, os.getenv("STT_BASE_URL", ""))

 
        stt_fallback = ElevenLabsSTTService(
            api_key=os.getenv("ELEVENLABS_API_KEY", ""),
            aiohttp_session=session,
            language_code="vi",
            model="scribe_v2",
        )

        stt = WhisperXAPISTTService(
            api_url=os.getenv("STT_BASE_URL", ""),
            aiohttp_session=session,
            fallback_stt_service=stt_fallback,
        )

        
       
        # Create context with initial messages
        messages = []
      
        # Create context (messages only)
        #context = OpenAILLMContext(messages)

        #context_aggregator = LLMContextAggregatorPair(context)

        # RTVI events for Pipecat client UI
        rtvi = RTVIProcessor(config=RTVIConfig(config=[]))

        pipeline = Pipeline(
            [
                ws_transport.input(),
                rtvi,
                stt,
                #context_aggregator.user(),
                #llm,  # LLM
                #tts,
                ws_transport.output(),
                #context_aggregator.assistant(),
            ]
        )

        task = PipelineTask(
            pipeline,
            params=PipelineParams(
                enable_metrics=True,
                enable_usage_metrics=True,
            ),
            observers=[RTVIObserver(rtvi)],
        )

        @rtvi.event_handler("on_client_ready")
        async def on_client_ready(rtvi):
            logger.info("Pipecat client ready.")
            await rtvi.set_bot_ready()
            # Kick off the conversation.
            await task.queue_frames([LLMRunFrame()])

        @ws_transport.event_handler("on_client_connected")
        async def on_client_connected(transport, client):
            logger.info("Pipecat Client connected")

        @ws_transport.event_handler("on_client_disconnected")
        async def on_client_disconnected(transport, client):
            logger.info("Pipecat Client disconnected")
            await task.cancel()

        runner = PipelineRunner(handle_sigint=False)

        await runner.run(task)
    finally:
        # Cleanup: close aiohttp session
        await session.close()
        logger.info("Cleaned up aiohttp session")
