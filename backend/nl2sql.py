from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_sql(question: str, schema: dict) -> str:
    schema_text = ""
    for table, columns in schema.items():
        schema_text += f"Table: {table}\nColumns: {', '.join(columns)}\n\n"

    prompt = f"""You are an expert SQL generator for PostgreSQL.
Given the schema below, convert the user's natural language question into a valid SQL query.
Return ONLY the SQL query, nothing else. No explanation, no markdown, no backticks.

Schema:
{schema_text}

Question: {question}

SQL:"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return response.choices[0].message.content.strip()