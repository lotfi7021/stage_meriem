# STEG Insight - Stage Meriem

## 📋 Description

Projet de stage pour la Société Tunisienne de l'Électricité et du Gaz (STEG) - Système de gestion financière et analyse des risques.

## 🏗️ Structure du Projet

```
steg-meriem/
├── steg-backend-express/     # API Backend (Node.js + Express + TypeScript)
├── steg-insight-main/        # Frontend (React + Vite + TanStack)
├── README.md
└── .gitignore
```

## 🚀 Démarrage Rapide

### 1. Backend (API)

```bash
cd steg-backend-express
npm install
npm run seed    # Initialiser la base de données
npm run dev     # Démarre sur http://localhost:3002
```

### 2. Frontend (Interface)

```bash
cd steg-insight-main  
npm install
npm run dev     # Démarre sur http://localhost:8080
```

## 👤 Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@steg.com.tn | admin1234 |
| **Agent** | agent@steg.com.tn | agent1234 |
| **Direction** | direction@steg.com.tn | direction1234 |

## 📊 Fonctionnalités

- 📈 **Dashboard** avec KPI financiers
- 👥 **Gestion des clients** et profils
- 🧾 **Gestion des factures** avec suivi des statuts
- 💰 **Suivi des paiements** multi-méthodes
- ⚠️ **Analyse des risques** avec scoring automatique
- 📋 **Rapports** financiers détaillés
- 🔔 **Système de notifications** en temps réel

## 🛠️ Technologies

### Backend
- Node.js + Express + TypeScript
- MySQL + TypeORM
- JWT Authentication
- bcrypt pour le hachage

### Frontend  
- React 18 + TypeScript
- TanStack Router + Query
- Tailwind CSS + shadcn/ui
- Vite + Hot Reload

## 📞 Contact

Projet développé dans le cadre du stage de Meriem à la STEG.

---

*Développé avec ❤️ pour la transformation digitale de STEG*