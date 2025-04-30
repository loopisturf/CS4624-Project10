import sqlite3,os

def get_db_connection():
    conn = sqlite3.connect(os.getenv('DATABASE_PATH', 'energy_estimation.db'))
    conn.row_factory = sqlite3.Row
    return conn

def fix_admin():
    conn = get_db_connection()
    cursor = conn.cursor()

    # replace all usernames that are 'temp' with 'admin'
    cursor.execute("UPDATE collections SET username = 'admin' WHERE username = 'undefined'")
    conn.commit()
    cursor.close()
    conn.close()

fix_admin()