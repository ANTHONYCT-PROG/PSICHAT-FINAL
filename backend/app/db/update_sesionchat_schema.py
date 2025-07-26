import sqlite3

DB_PATH = '../../psichat.db'  # Ajusta la ruta si tu DB está en otro lugar

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return any(col[1] == column for col in cursor.fetchall())

def add_column_if_not_exists(cursor, table, column, coltype):
    if not column_exists(cursor, table, column):
        print(f"Agregando columna {column} a {table}...")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {coltype}")
    else:
        print(f"La columna {column} ya existe en {table}.")

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Agregar columnas si no existen
    add_column_if_not_exists(cursor, 'sesiones_chat', 'tutor_id', 'INTEGER')
    add_column_if_not_exists(cursor, 'sesiones_chat', 'pausada_en', 'DATETIME')
    add_column_if_not_exists(cursor, 'sesiones_chat', 'finalizada_en', 'DATETIME')
    add_column_if_not_exists(cursor, 'sesiones_chat', 'metadatos', 'TEXT')

    # Crear índice para tutor_id
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sesion_tutor ON sesiones_chat (tutor_id)")
        print("Índice idx_sesion_tutor creado o ya existente.")
    except Exception as e:
        print("Error creando índice:", e)

    conn.commit()
    conn.close()
    print("Actualización de la tabla sesiones_chat completada.")

if __name__ == '__main__':
    main() 