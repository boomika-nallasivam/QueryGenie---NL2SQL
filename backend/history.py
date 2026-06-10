from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

# Use service role key to bypass RLS
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

def save_history(user_id: str, question: str, sql_query: str, row_count: int, source: str = "sample_db"):
    try:
        supabase.table("query_history").insert({
            "user_id": user_id,
            "question": question,
            "sql_query": sql_query,
            "row_count": row_count,
            "source": source
        }).execute()
    except Exception as e:
        print(f"History save error: {str(e)}")

def get_history(user_id: str):
    try:
        res = supabase.table("query_history")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(50)\
            .execute()
        return res.data
    except Exception as e:
        print(f"History fetch error: {str(e)}")
        return []

def save_uploaded_file(user_id: str, file_name: str, table_name: str, row_count: int, columns: str):
    try:
        supabase.table("uploaded_files").insert({
            "user_id": user_id,
            "file_name": file_name,
            "table_name": table_name,
            "row_count": row_count,
            "columns": columns
        }).execute()
    except Exception as e:
        print(f"File save error: {str(e)}")

def get_uploaded_files(user_id: str):
    try:
        res = supabase.table("uploaded_files")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        return res.data
    except Exception as e:
        print(f"Files fetch error: {str(e)}")
        return []