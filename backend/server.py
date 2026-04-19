import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from core.parser import parse_document
from core.rag import ingest_chunks_into_db, query_rag
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="Smart Document Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount the static files from the React build
# The "frontend/dist" path matches where our Dockerfile will put the build
if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse("frontend/dist/index.html")

    @app.get("/{rest_of_path:path}")
    async def serve_catchall(rest_of_path: str):
        # Serve index.html for any path that isn't /upload or /chat
        if rest_of_path not in ["upload", "chat", "health"]:
            return FileResponse("frontend/dist/index.html")
        # Let FastAPI handle /upload and /chat via their decorators
        return None 

class Message(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    query: str
    history: List[Message] = []

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Smart Document Analyzer is running."}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # Save file temporarily
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
    try:
        # Parse the document
        chunks = parse_document(file_path, file.filename)
        
        # Ingest into vector DB
        if not chunks:
            return {"status": "warning", "message": f"No text could be extracted from {file.filename}."}
            
        ingest_chunks_into_db(chunks)
        
        return {"status": "success", "message": f"Successfully ingested {file.filename}."}
        
    except Exception as e:
        print(f"Error during upload: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response = query_rag(request.query, [msg.dict() for msg in request.history])
        return {
            "answer": response["answer"],
            "citations": response["citations"]
        }
    except Exception as e:
        print(f"Error during chat: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
