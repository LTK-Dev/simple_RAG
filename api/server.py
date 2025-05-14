from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import ModelManager
from rag_engine import RAGEngine
from pydantic import BaseModel
import traceback

# Initialize models and RAG engine
model_manager = ModelManager()
rag_engine = RAGEngine(model_manager)

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="No message provided")
        response = rag_engine.generate_response(request.message)
        return {"response": response}
    except Exception as e:
        print("[ERROR] /api/chat:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="File is empty")
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text = content.decode('latin-1')
            except Exception:
                raise HTTPException(status_code=400, detail="Cannot decode file. Please upload a valid text file.")
        rag_engine.add_documents([text])
        return {"message": f"File '{file.filename}' uploaded and added to knowledge base."}
    except HTTPException as e:
        raise e
    except Exception as e:
        print("[ERROR] /api/upload:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 