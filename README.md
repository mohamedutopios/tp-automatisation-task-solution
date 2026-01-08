# TaskFlow - Gestionnaire de Tâches

Application CRUD complète avec interface moderne, tests unitaires et tests Selenium.

## 🚀 Fonctionnalités

- **CRUD complet** : Créer, lire, modifier, supprimer des tâches
- **Interface glassmorphism** : Design moderne avec animations
- **Filtrage** : Par statut (En attente, En cours, Terminées)
- **Priorités** : Basse, Moyenne, Haute
- **Statistiques** : Compteurs en temps réel
- **Notifications toast** : Feedback visuel

## 📁 Structure du projet

```
task-manager/
├── package.json
├── jest.config.js
├── src/
│   ├── app.js              # Serveur Express
│   ├── routes/
│   │   └── tasks.js        # Routes API REST
│   └── models/
│       └── taskStore.js    # Store en mémoire
├── public/
│   ├── index.html          # Interface utilisateur
│   ├── css/
│   │   └── style.css       # Styles glassmorphism
│   └── js/
│       └── app.js          # Logique frontend
└── tests/
    ├── setup.js
    ├── unit/
    │   ├── taskStore.test.js   # Tests du store
    │   └── api.test.js         # Tests API REST
    └── selenium/
        └── tasks.selenium.test.js  # Tests E2E
```

## 🛠️ Installation

```bash
npm install
```

## ▶️ Démarrage

```bash
npm start
```

Ouvrir http://localhost:3000

## 🧪 Tests

### Tests unitaires (Jest + Supertest)

```bash
npm test
```

Tests couverts :
- **TaskStore** : CRUD en mémoire, gestion des IDs, dates
- **API REST** : Tous les endpoints, validation, erreurs

### Tests Selenium

```bash
# Installer Chrome et chromedriver d'abord
npm run test:selenium
```

Tests couverts :
- Chargement de la page
- Création de tâches
- Filtrage par statut
- Modification via modal
- Suppression avec confirmation
- Changement de statut
- Notifications toast

### Tous les tests

```bash
npm run test:all
```

## 📡 API REST

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/tasks | Liste toutes les tâches |
| GET | /api/tasks/:id | Récupère une tâche |
| POST | /api/tasks | Crée une tâche |
| PUT | /api/tasks/:id | Met à jour une tâche |
| DELETE | /api/tasks/:id | Supprime une tâche |

### Exemple de tâche

```json
{
  "id": "uuid",
  "title": "Ma tâche",
  "description": "Description",
  "status": "pending|in-progress|completed",
  "priority": "low|medium|high",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🎨 Design

- **Police** : Outfit (texte) + Space Mono (chiffres)
- **Style** : Glassmorphism avec backdrop blur
- **Animations** : Shapes flottantes, hover effects, transitions
- **Responsive** : Mobile-first

## 🐳 Docker

### Option 1 : Node.js seul (simple)

```bash
# Build
docker build -t taskflow .

# Run
docker run -p 3000:3000 taskflow

# Ou avec docker-compose
docker-compose -f docker-compose.simple.yml up -d
```

### Option 2 : Nginx + Node.js (production)

```bash
docker-compose up -d
```

Architecture :
- **Nginx** (port 80) : Fichiers statiques + reverse proxy
- **Node.js** (interne) : API REST

```
┌─────────────────────────────────────────┐
│              Client (port 80)           │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│                 Nginx                    │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │   Static    │    │   /api/* proxy  │ │
│  │   Files     │    │   → Node:3000   │ │
│  └─────────────┘    └─────────────────┘ │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│           Node.js API (port 3000)       │
└─────────────────────────────────────────┘
```

### Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Rebuild
docker-compose up -d --build
```

## 📋 Prérequis pour Selenium

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y chromium-browser chromium-chromedriver

# Ou avec npm (si accès réseau)
npm install chromedriver
```
