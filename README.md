# CounterCraft

CounterCraft est une application web permettant d'ajouter et visualiser des counters personnalisés pour les champions de League of Legends.

## ✨ Fonctionnalités

- 🔍 Recherche des champions via Data Dragon
- 🛡️ Filtrage par rôle (Top, Jungle, Mid, Bot, Support) (WIP)
- ➕ Ajout de counters personnalisés avec note et ordre de priorité
- ❌ Suppression des counters

## 🗂️ Structure du projet

```
CounterCraft/
├── main.py                 # Backend FastAPI
├── counters.json           # Stockage local des counters
├── static/                 # Frontend statique
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── favicon.ico
├── requirements.txt
└── README.md
```

## 🚀 Lancer le projet

### 1. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 2. Lancer le serveur

```bash
uvicorn main:app --reload
```

L'application sera disponible à l'adresse :  
👉 [http://localhost:8000](http://localhost:8000)

### 3. Utilisation

- Rendez-vous sur la page d'accueil
- Cliquez sur un champion pour voir/éditer ses counters
- Ajoutez ou supprimez des counters à volonté

## 🛠️ Stack

- FastAPI
- Tailwind CSS (via CDN)
- Tom Select (pour les listes déroulantes avec recherche)
- Vanilla JavaScript
- Riot Games Data Dragon

## 📄 Licence

MIT - libre à modifier et partager.

