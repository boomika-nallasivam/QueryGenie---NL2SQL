import pandas as pd
import re
import io
from database import get_connection

print("Connecting to DB...")
conn = get_connection()
print("Connected!")

df = pd.read_csv('C:/Users/BOOMIKA/Downloads/Employee.csv')
print(f"File loaded: {len(df)} rows")

df = df.head(100)
df.columns = [re.sub(r'[^a-zA-Z0-9_]', '_', col.lower().strip()) for col in df.columns]
df = df.fillna("")

table_name = "upload_employee_test"
cur = conn.cursor()

print("Dropping old table...")
cur.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE;")
conn.commit()
print("Dropped!")

print("Creating table...")
col_defs = [f'"{col}" TEXT' for col in df.columns]
cur.execute(f"CREATE TABLE {table_name} ({', '.join(col_defs)});")
conn.commit()
print("Table created!")

print("Inserting data...")
output = io.StringIO()
df.to_csv(output, sep='\t', header=False, index=False)
output.seek(0)
cur.copy_from(output, table_name, null="")
conn.commit()
print("Done! Rows inserted:", len(df))

cur.close()
conn.close()