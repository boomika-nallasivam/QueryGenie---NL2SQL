import pandas as pd
import re
import io
from database import get_connection

def sanitize_table_name(filename: str) -> str:
    name = filename.replace(".xlsx", "").replace(".xls", "").replace(".csv", "")
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    return f"upload_{name.lower()}"

def upload_excel_to_db(file_bytes: bytes, filename: str) -> dict:
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        else:
            df = pd.read_excel(io.BytesIO(file_bytes))

        # Clean columns
        df.columns = [re.sub(r'[^a-zA-Z0-9_]', '_', col.lower().strip()) for col in df.columns]
        
        # Limit to 2000 rows
        df = df.head(2000)
        df = df.fillna("")

        table_name = sanitize_table_name(filename)
        conn = get_connection()
        cur = conn.cursor()

        # Drop with CASCADE and commit first
        cur.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE;")
        conn.commit()

        # Create table
        col_defs = [f'"{col}" TEXT' for col in df.columns]
        cur.execute(f"CREATE TABLE {table_name} ({', '.join(col_defs)});")
        conn.commit()

        # Fast insert using copy_from
        output = io.StringIO()
        df.to_csv(output, sep='\t', header=False, index=False)
        output.seek(0)
        cur.copy_from(output, table_name, null="")
        conn.commit()

        cur.close()
        conn.close()

        return {
            "table_name": table_name,
            "row_count": len(df),
            "columns": list(df.columns)
        }
    except Exception as e:
        raise Exception(f"Excel upload error: {str(e)}")

def get_excel_schema(table_name: str) -> dict:
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
            ORDER BY ordinal_position;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {table_name: [f"{col} ({dtype})" for col, dtype in rows]}
    except Exception as e:
        raise Exception(f"Schema error: {str(e)}")