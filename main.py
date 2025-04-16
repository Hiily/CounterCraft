from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI()

# CORS pour frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve les fichiers statiques
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_index():
    return FileResponse("static/index.html")

# Connexion PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set.")

conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

@app.get("/counters/{champion}")
def get_counters(champion: str):
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT name, comment, rank
                FROM counters
                WHERE champion = %s
                ORDER BY rank ASC;
            """, (champion,))
            return cur.fetchall()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur DB (GET): {str(e)}")

@app.post("/counters/{champion}")
def add_counter(champion: str, new_counter: dict):
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO counters (champion, name, comment, rank)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (champion, name) DO UPDATE
                SET comment = EXCLUDED.comment,
                    rank = EXCLUDED.rank;
            """, (
                champion,
                new_counter.get("name"),
                new_counter.get("comment"),
                new_counter.get("order")
            ))
            conn.commit()
        return {"message": "Counter enregistré"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur DB (POST): {str(e)}")

@app.delete("/counters/{champion}/{counter_name}")
def delete_counter(champion: str, counter_name: str):
    try:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM counters
                WHERE champion = %s AND name = %s;
            """, (champion, counter_name))
            conn.commit()
        return {"message": f"Counter '{counter_name}' supprimé pour {champion}"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur DB (DELETE): {str(e)}")
