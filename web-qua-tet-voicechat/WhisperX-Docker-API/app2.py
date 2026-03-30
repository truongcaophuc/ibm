import os
import io
import time
import wave
import traceback
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel

from config import Config

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Global model
faster_whisper_model = None


def load_model():
    """Load Faster-Whisper model once at startup"""
    global faster_whisper_model
    if faster_whisper_model is None:
        print(f"Loading Faster-Whisper model: {Config.DEFAULT_MODEL}")
        faster_whisper_model = WhisperModel(
            Config.DEFAULT_MODEL,
            device=Config.DEFAULT_DEVICE,
            compute_type=Config.DEFAULT_COMPUTE_TYPE
        )
        print("Faster-Whisper model loaded successfully")
    return faster_whisper_model


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "engine": "faster-whisper"
    })


@app.route(f'/{Config.API_VERSION}/media/transcribe/bytes', methods=['POST'])
def transcribe_bytes():
    """
    Transcribe audio using Faster-Whisper directly (with confidence score).

    Content-Type: application/octet-stream
    Body: Raw WAV audio bytes

    Query params:
    - language: Language code (e.g., 'vi', 'en'). Auto-detect if not specified.

    Returns:
    - {"code": 200, "response": {"text": "...", "detected_language": "vi", "score": 0.85}, "processing_time": 1.23}
    """
    start_time = time.time()

    try:
        # Get raw bytes from request body
        audio_bytes = request.get_data()

        if not audio_bytes or len(audio_bytes) == 0:
            return jsonify({
                "code": 400,
                "message": "Empty audio data"
            }), 400

        # Get language from query params
        language = request.args.get("language")

        # Convert WAV bytes to numpy array
        with io.BytesIO(audio_bytes) as wav_io:
            with wave.open(wav_io, "rb") as wav_file:
                sample_rate = wav_file.getframerate()
                audio_data = wav_file.readframes(wav_file.getnframes())

        # Convert int16 to float32
        audio_float = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

        # Get model
        model = load_model()

        # Transcribe using faster-whisper
        segments, info = model.transcribe(
            audio_float,
            language=language,
            task="transcribe",
            beam_size=5,
            vad_filter=True
        )

        # Extract text and scores from segments
        text_parts = []
        scores = []
        for segment in segments:
            text_parts.append(segment.text)
            if segment.avg_logprob is not None:
                # Convert log probability to confidence score (0-1)
                scores.append(np.exp(segment.avg_logprob))

        text = "".join(text_parts).strip()
        avg_score = round(float(np.mean(scores)), 4) if scores else None
        detected_language = info.language if info else (language or "unknown")

        processing_time = time.time() - start_time

        return jsonify({
            "code": 200,
            "response": {
                "text": text,
                "detected_language": detected_language,
                "score": avg_score
            },
            "message": "success",
            "processing_time": round(processing_time, 2)
        })

    except Exception as e:
        error_msg = str(e)
        print(f"Error in transcription: {error_msg}")
        print(traceback.format_exc())

        return jsonify({
            "code": 500,
            "response": None,
            "message": f"Internal server error: {error_msg}",
            "processing_time": round(time.time() - start_time, 2)
        }), 500


if __name__ == '__main__':
    print("Starting Faster-Whisper API Server...")
    print(f"Device: {Config.DEFAULT_DEVICE}")
    print(f"Model: {Config.DEFAULT_MODEL}")
    print(f"Port: {Config.PORT}")

    # Pre-load model
    load_model()

    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG,
        threaded=True
    )
