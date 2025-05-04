from fastapi import FastAPI, Response
from melo.api import TTS
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import uuid
from fastapi.concurrency import run_in_threadpool
import asyncio
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize TTS model
model = TTS(language='EN', device='cpu')
speaker_id = model.hps.data.spk2id['EN-US']

# Create semaphore to limit concurrent requests
# Limit to 1 for sequential processing
semaphore = asyncio.Semaphore(1)

# Configure text replacements
TEXT_REPLACEMENTS = {
    "<3": "",
    # Add more replacements here
}

def preprocess_text(text: str) -> str:
    # Replace configured strings
    for old, new in TEXT_REPLACEMENTS.items():
        text = text.replace(old, new)
    
    # Replace newlines with periods
    text = text.replace("\n", "...\n\n")
    
    return text

class TTSRequest(BaseModel):
   text: str
   speed: float = 1.0

@app.post("/tts")
async def text_to_speech(request: TTSRequest):
   # Wait for semaphore (queue up)
   async with semaphore:
       # Generate unique filename
       filename = f"temp_{uuid.uuid4()}.wav"
       
       try:
           # Preprocess the text
           processed_text = preprocess_text(request.text)
           
           # Run CPU-intensive TTS in thread pool
           await run_in_threadpool(
               model.tts_to_file,
               processed_text,
               speaker_id,
               filename,
               speed=request.speed
           )
           
           # Return file
           response = FileResponse(
               filename,
               media_type='audio/wav',
               filename='speech.wav'
           )
           
           # Clean up file after sending
           def cleanup():
               try:
                   os.remove(filename)
               except:
                   pass
                   
           response.background = cleanup
           return response

       except Exception as e:
           if os.path.exists(filename):
               os.remove(filename)
           return Response(
               content=str(e),
               status_code=500
           )