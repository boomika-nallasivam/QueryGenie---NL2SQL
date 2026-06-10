from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    transcription = client.audio.transcriptions.create(
        model="whisper-large-v3",
        file=(filename, file_bytes),
    )
    return transcription.text