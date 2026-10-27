import sqlite3

conn = sqlite3.connect(r'C:\Users\mxmin\AppData\Roaming\sh.voicebox.app\voicebox.db')
cursor = conn.cursor()
tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("TABELAS:", [t[0] for t in tables])

for t in tables:
    t_name = t[0]
    if not t_name.startswith('sqlite_'):
        rows = cursor.execute(f"SELECT * FROM {t_name} LIMIT 5").fetchall()
        print(f"\n--- {t_name} ({len(rows)} linhas) ---")
        for r in rows:
            print(r)
