from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # à restreindre si besoin
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path("counters.json")

def load_data():
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return {}

def save_data(data):
    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

@app.get("/counters")
def get_all():
    return load_data()

@app.get("/counters/{champion}")
def get_counters(champion: str):
    return load_data().get(champion, [])

@app.post("/counters/{champion}")
def set_counters(champion: str, counters: list[str]):
    data = load_data()
    data[champion] = counters
    save_data(data)
    return {"message": f"Updated counters for {champion}.", "counters": counters}
