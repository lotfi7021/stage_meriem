# STEG Insight

Plateforme FinTech Intelligente STEG

Conception et développement d'une plateforme d'analyse, de suivi et d'optimisation des paiements et de la facturation clients

1. Contexte et objectifs

La STEG (Société Tunisienne de l'Électricité et du Gaz) gère un volume massif de factures et de paiements clients. Le suivi manuel des retards, des impayés et des risques clients limite la réactivité financière de l'entreprise.

Objectif du projet : concevoir une plateforme web intelligente permettant de centraliser la gestion des factures/paiements, d'analyser les comportements de paiement, et de prédire les risques d'impayés grâce à un modèle de Machine Learning.

Deux volets :

Plateforme de gestion (CRUD paiements, factures, clients, dashboard)

Module IA/Data (scoring de risque, prédiction de retard de paiement)

2. Stack technique

CoucheTechnologieFrontendReact.js + Vite, TypeScript, Tailwind CSS, Recharts (dashboard), React Router, AxiosBackendNestJS (TypeScript), REST API, TypeORM/PrismaBase de donnéesPostgreSQLAuthentificationJWT (Passport.js), rôles (admin, agent, direction)Module IAPython (FastAPI ou Flask), scikit-learn / XGBoost, exposé en microservice appelé par NestJSAutresDocker (conteneurisation), Swagger (doc API NestJS), Chart.js/Recharts (visualisation)

Architecture globale :

[React SPA] ---> [NestJS API Gateway] ---> [PostgreSQL]
                        |
                        ---> [Service IA Python (FastAPI)] ---> [Modèle ML]

3. Modélisation des données (entités principales)

Client : id, nom, type (particulier/entreprise/administration), secteur, adresse, ancienneté contrat, historique paiement

Facture : id, clientId, montant, dateEmission, dateEcheance, statut (payée/en attente/en retard/impayée), montantPayé

Paiement : id, factureId, montant, datePaiement, méthode

ScoreRisque : id, clientId, score (0-100), catégorie (faible/moyen/élevé), date de calcul

Utilisateur : id, nom, email, rôle, motDePasseHash

Notification : id, clientId, type, statut, dateEnvoi

RapportFinancier : id, période, type, données agrégées

4. Fonctionnalités du MVP (priorité 1)

Authentification & rôles (admin / agent financier / direction)

Gestion des clients (CRUD, fiche client avec historique)

Gestion des factures (CRUD, statuts, filtres par période/statut)

Gestion des paiements (enregistrement, rapprochement avec factures)

Dashboard financier (KPIs : total facturé, total payé, taux d'impayés, évolution mensuelle)

Détection des retards de paiement (liste des factures en retard, alertes visuelles)

Score de risque client (appel au microservice IA, affichage en badge faible/moyen/élevé)

Notifications (factures impayées approchant l'échéance)

5. Fonctionnalités avancées (perspectives d'extension)

Prédiction des impayés futurs (modèle de série temporelle sur les revenus)

Simulation "what-if" (impact d'une relance anticipée sur le cash-flow)

Génération de rapports PDF/Excel automatisés

Système d'alertes graduées (rappel amiable → mise en demeure)

Segmentation clients avancée (clustering comportemental)

Explicabilité du modèle IA (SHAP / feature importance) dans le dashboard

6. Module IA — Prédiction du risque de retard de paiement

Objectif métier : estimer, pour chaque facture émise, la probabilité qu'elle soit payée en retard, afin de prioriser les relances et ajuster le suivi client.

Features envisagées :

Historique de paiement du client (nb de retards passés, délai moyen de paiement)

Montant de la facture (relatif à la moyenne du client)

Ancienneté du contrat client

Type de client (particulier / entreprise / administration)

Secteur d'activité

Saisonnalité (pics de consommation estivaux)

Délai jusqu'à l'échéance

Approche :

Modèle de classification binaire (payé à temps / en retard) — Régression logistique ou XGBoost

Sortie : probabilité (0–1) convertie en score de risque (faible/moyen/élevé)

Service exposé via API REST (FastAPI), consommé par NestJS

(Extension) Ajout d'explicabilité (SHAP) pour justifier le score dans l'UI

7. Architecture Backend NestJS (modules proposés)

src/
├── auth/              # JWT, guards, stratégies Passport
├── users/             # gestion utilisateurs & rôles
├── clients/           # CRUD clients
├── invoices/          # CRUD factures, statuts
├── payments/          # CRUD paiements, rapprochement
├── dashboard/         # agrégations, KPIs
├── risk-scoring/       # appel au microservice IA, cache des scores
├── notifications/      # génération et envoi des alertes
├── reports/           # génération de rapports
└── common/            # DTOs, interceptors, pipes, filtres d'exception

8. Architecture Frontend React

src/
├── pages/
│   ├── Dashboard/
│   ├── Clients/
│   ├── Invoices/
│   ├── Payments/
│   ├── RiskAnalysis/
│   └── Reports/
├── components/         # composants réutilisables (Table, Badge statut, Card KPI...)
├── services/            # appels API (axios) par domaine
├── hooks/               # hooks custom (useAuth, useFetch...)
├── context/              # AuthContext, ThemeContext
├── types/                # interfaces TypeScript
└── utils/                # formatage dates, montants, etc.

Charte visuelle : cohérente avec le style corporate STEG (bleu institutionnel, blanc, gris clair), statuts codés en couleur (vert = payé, orange = en attente, rouge = en retard/impayé).

9. Planning indicatif (stage de 8 semaines)

SemaineTâches1Cadrage, conception BDD, maquettes UI2Setup projet (NestJS + React + PostgreSQL), authentification3Module clients + factures (backend + frontend)4Module paiements + rapprochement5Dashboard financier + KPIs6Collecte/préparation des données pour le modèle IA, entraînement7Intégration du microservice IA, scoring de risque dans l'UI8Notifications, rapports, tests, documentation, présentation finale

10. Livrables attendus

Code source (frontend + backend + microservice IA)

Documentation technique (README, schéma BDD, doc API Swagger)

Rapport de stage

Support de présentation (soutenance)

Jeu de données simulé/anonymisé (si pas d'accès aux données réelles STEG)

11. Points de vigilance

Confidentialité des données : anonymiser ou simuler les données clients STEG (pas d'accès direct aux données réelles de facturation sans autorisation)

Scope réaliste : limiter le MVP aux fonctionnalités de la section 4 pour un stage de 8 semaines

Qualité du modèle IA : privilégier un modèle simple et interprétable (régression logistique) avant d'aller vers des modèles plus complexes

creer just le front with react

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3288487f-47c4-48ca-a347-7ee5fe1bae04).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
