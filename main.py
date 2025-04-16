from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import psycopg2
import os
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()



DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


app = FastAPI()

# Middleware CORS pour le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monter le dossier static
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_index():
    return FileResponse("static/index.html")




@app.get("/counters/{champion}")
def get_counters(champion: str):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT name, comment, rank
            FROM counters
            WHERE champion = %s
            ORDER BY rank ASC;
        """, (champion,))
        return cur.fetchall()


@app.post("/counters/{champion}")
def add_counter(champion: str, new_counter: dict):
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


@app.delete("/counters/{champion}/{counter_name}")
def delete_counter(champion: str, counter_name: str):
    with conn.cursor() as cur:
        cur.execute("""
            DELETE FROM counters
            WHERE champion = %s AND name = %s;
        """, (champion, counter_name))
        conn.commit()
    return {"message": f"Counter '{counter_name}' supprimé pour {champion}"}
