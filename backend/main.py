from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import run_query, get_schema
from nl2sql import generate_sql
from audio import transcribe_audio
from auth import get_current_user
from history import save_history, get_history, save_uploaded_file, get_uploaded_files
from excel_handler import upload_excel_to_db, get_excel_schema

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str
    source: str = "sample_db"
    table_name: str = None

@app.get("/")
def root():
    return {"status": "NL2SQL API is running!"}

@app.post("/ask")
def ask(request: QuestionRequest, user=Depends(get_current_user)):
    try:
        if request.source == "sample_db":
            schema = get_schema()
        else:
            schema = get_excel_schema(request.table_name)
        sql = generate_sql(request.question, schema)
        result = run_query(sql)
        row_count = len(result["rows"])
        save_history(
            user_id=str(user.id),
            question=request.question,
            sql_query=sql,
            row_count=row_count,
            source=request.source
        )
        return {"sql": sql, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), user=Depends(get_current_user)):
    try:
        file_bytes = await file.read()
        text = transcribe_audio(file_bytes, file.filename)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...), user=Depends(get_current_user)):
    try:
        file_bytes = await file.read()
        result = upload_excel_to_db(file_bytes, file.filename)
        print(f"Upload result: {result}")
        print(f"User ID: {user.id}")
        save_uploaded_file(
            user_id=str(user.id),
            file_name=file.filename,
            table_name=result["table_name"],
            row_count=result["row_count"],
            columns=",".join(result["columns"])
        )
        print("File saved to DB!")
        return result
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
def history(user=Depends(get_current_user)):
    return get_history(str(user.id))

@app.get("/my-files")
def my_files(user=Depends(get_current_user)):
    return get_uploaded_files(str(user.id))