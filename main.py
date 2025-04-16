from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path

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

DATA_FILE = Path("counters.json")

def load_data():
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return {}

def save_data(data):
    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

@app.get("/counters/{champion}")
def get_counters(champion: str):
    data = load_data()
    return data.get(champion, [])

@app.post("/counters/{champion}")
def add_counter(champion: str, new_counter: dict):
    data = load_data()
    counters = data.get(champion, [])

    # vérifier s'il existe déjà un counter avec le même nom
    for c in counters:
        if c["name"] == new_counter["name"]:
            # mettre à jour l'existant
            c.update(new_counter)
            break
    else:
        counters.append(new_counter)

    data[champion] = counters
    save_data(data)
    return {"message": "Counter enregistré", "data": counters}

@app.delete("/counters/{champion}/{counter_name}")
def delete_counter(champion: str, counter_name: str):
    data = load_data()
    counters = data.get(champion, [])

    new_counters = [c for c in counters if c["name"] != counter_name]
    data[champion] = new_counters
    save_data(data)
    return {"message": f"Counter {counter_name} supprimé pour {champion}"}

