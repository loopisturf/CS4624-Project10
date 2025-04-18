# init_db.py
import sqlite3

def init_db():
    conn = sqlite3.connect('energy_estimation.db')  # your existing DB file
    with open('setup.sql', 'r') as f:
        sql_script = f.read()
        conn.executescript(sql_script)
    conn.close()
    print("Database initialized with new schema.")

if __name__ == '__main__':
    init_db()