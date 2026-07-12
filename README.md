# Plateforme de Gestion IEPP — Circonscription Scolaire

Application web professionnelle destinée aux Inspecteurs d'Enseignement Préscolaire
et Primaire (IEPP) pour centraliser la gestion administrative et pédagogique
des écoles d'une circonscription. SaaS multi-établissements, abonnement annuel.

## Stack technique

| Composant       | Technologie                                   |
|-----------------|------------------------------------------------|
| Backend         | Django 5 + Django REST Framework                |
| Frontend        | Angular 18 + Angular Material                   |
| Base de données | PostgreSQL (compatible MySQL via changement de `ENGINE`) |
| Authentification| JWT (djangorestframework-simplejwt)             |
| Documentation API | Swagger / OpenAPI (drf-yasg)                  |
| Déploiement     | Gunicorn + Whitenoise (backend), build statique Angular (frontend) |

## Architecture des dossiers

```
iepp-platform/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/                  # Configuration globale du projet Django
│   │   ├── settings/
│   │   │   ├── base.py          # Réglages communs
│   │   │   ├── dev.py           # Développement local
│   │   │   └── prod.py          # Production
│   │   ├── urls.py              # Point d'entrée des routes API
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── apps/                    # Une app Django = un module métier
│       ├── users/               # Comptes, rôles, permissions, auth JWT
│       ├── schools/             # Module 1 : écoles
│       ├── teachers/            # Module 3 : instituteurs/directeurs
│       ├── students/            # Module 4 : élèves
│       ├── evaluations/         # Module 7 : notes et évaluations
│       ├── authorizations/      # Module 6 : demandes d'autorisation
│       ├── reports/             # Module 9 : rapports et impressions PDF
│       └── subscriptions/       # Module 10 : abonnements SaaS
│
├── frontend/
│   └── src/app/
│       ├── core/                # Services transverses, guards, intercepteurs JWT
│       ├── shared/               # Composants réutilisables (UI, tableaux, etc.)
│       └── features/            # Un dossier par module (auth, dashboard, schools...)
│
├── docs/                        # Documentation technique complémentaire
└── .gitignore
```

Chaque app Django suit la même structure interne :
`models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`, `permissions.py`, `tests.py`.
Cela garantit un code homogène, facile à maintenir même par quelqu'un qui découvre le projet.

## Rôles et permissions (aperçu)

- **Administrateur système** : gestion globale, abonnements, maintenance
- **Chef de Circonscription (IEPP)** : accès complet à sa circonscription
- **Directeur d'école** : gestion de son établissement
- **Instituteur** : gestion de ses classes et élèves
- **Conseiller pédagogique** : suivi pédagogique de son secteur

La gestion fine des permissions sera implémentée dans le module `users`
(section "Gestion des utilisateurs et des rôles").

## Plan de développement (à traiter section par section)

- [x] **Section 1 — Architecture globale & structure des dossiers** *(cette livraison)*
- [ ] Section 2 — Module Utilisateurs & rôles (authentification JWT, permissions)
- [ ] Section 3 — Module 1 : Gestion des écoles
- [ ] Section 4 — Module 2 : Gestion des directeurs
- [ ] Section 5 — Module 3 : Gestion des instituteurs
- [ ] Section 6 — Module 4 : Gestion des élèves
- [ ] Section 7 — Module 5 : Secteurs pédagogiques
- [ ] Section 8 — Module 6 : Demandes d'autorisation (+ PDF signé)
- [ ] Section 9 — Module 7 : Notes et évaluations
- [ ] Section 10 — Module 8 : Tableau de bord & statistiques
- [ ] Section 11 — Module 9 : Rapports et impressions PDF
- [ ] Section 12 — Module 10 : Abonnement annuel (SaaS)
- [ ] Section 13 — Sécurité (audit, chiffrement, sauvegardes)
## Sauvegardes

- Sauvegarde automatique quotidienne via `scripts/backup_db.ps1` (Planificateur de tâches Windows).
- Conserver au minimum 30 jours d'historique local.
- **Copier régulièrement les sauvegardes hors du serveur** (disque externe,
  stockage cloud chiffré) — une sauvegarde uniquement locale ne protège pas
  contre une panne matérielle ou un vol.
- Tester la restauration périodiquement (`pg_restore`) : une sauvegarde
  jamais testée n'est pas fiable.
- La clé `FIELD_ENCRYPTION_KEY` doit être sauvegardée séparément de la base
  de données, dans un gestionnaire de secrets ou un coffre-fort numérique —
  sans elle, les sauvegardes de la base sont illisibles.
- [ ] Section 14 — Frontend Angular : structure des modules et UI (charte orange/blanc/vert)
- [ ] Section 15 — Tests automatisés
- [ ] Section 16 — Déploiement (production + GitHub)

## Installation locale sous Windows

### Prérequis
1. **Python 3.12** — [python.org](https://www.python.org/downloads/) (cocher "Add to PATH")
2. **Node.js LTS** — [nodejs.org](https://nodejs.org/)
3. **Git** — [git-scm.com](https://git-scm.com/)
4. **VS Code** — [code.visualstudio.com](https://code.visualstudio.com/)
5. **PostgreSQL** — [postgresql.org](https://www.postgresql.org/download/windows/)

### Backend (PowerShell)
```powershell
cd iepp-platform\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Modifier .env avec vos identifiants PostgreSQL
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
L'API est alors disponible sur `http://127.0.0.1:8000/api/`
et la doc Swagger sur `http://127.0.0.1:8000/api/docs/`.

### Frontend (sera généré à la Section 14)
```powershell
cd iepp-platform\frontend
npm install
ng serve
```
L'application sera disponible sur `http://localhost:4200/`.

## Prochaine étape

➡️ **Section 2 : Module Utilisateurs & rôles** — modèle `User` personnalisé,
authentification JWT, permissions par rôle (IEPP, Directeur, Instituteur,
Conseiller pédagogique), endpoints `/api/auth/`.

Dites-moi quand vous voulez que j'enchaîne dessus.

# Déploiement — fichiers de configuration serveur

Ce dossier contient les fichiers à copier sur le serveur de production
au moment du déploiement (voir Section 16 du projet).

## nginx/iepp-platform.conf

1. Remplacer `votre-domaine.com` par le vrai nom de domaine
2. Copier sur le serveur :
   \`\`\`bash
   sudo cp deploy/nginx/iepp-platform.conf /etc/nginx/sites-available/iepp-platform
   sudo ln -s /etc/nginx/sites-available/iepp-platform /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   \`\`\`

## gunicorn/gunicorn.conf.py

Se place dans `backend/`, à côté de `manage.py` :
\`\`\`bash
cp deploy/gunicorn/gunicorn.conf.py backend/gunicorn.conf.py
\`\`\`

## systemd/iepp-backend.service

Permet à Gunicorn de démarrer automatiquement au boot du serveur et de
redémarrer en cas de plantage :
\`\`\`bash
sudo cp deploy/systemd/iepp-backend.service /etc/systemd/system/iepp-backend.service
sudo systemctl daemon-reload
sudo systemctl enable iepp-backend
sudo systemctl start iepp-backend
sudo systemctl status iepp-backend
\`\`\`

## Ordre d'exécution recommandé au premier déploiement

1. Cloner le dépôt sur le serveur
2. Configurer le backend (venv, `.env`, migrate, collectstatic) — voir README principal
3. Copier `gunicorn.conf.py` dans `backend/`
4. Copier et activer le service systemd
5. Build Angular en local, transférer le résultat sur le serveur
6. Copier et activer la configuration Nginx
7. Activer HTTPS avec Certbot