import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        # AFTER
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
    return conn

def run_query(sql: str):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(sql)
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"columns": columns, "rows": [list(row) for row in rows]}
    except Exception as e:
        raise Exception(f"Query error: {str(e)}")

def get_schema():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        schema = {}
        for table, column, dtype in rows:
            if table not in schema:
                schema[table] = []
            schema[table].append(f"{column} ({dtype})")
        return schema
    except Exception as e:
        raise Exception(f"Schema error: {str(e)}")