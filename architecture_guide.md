# Enterprise Architecture & Deployment Manuals

This guide details the structural layers, database configurations (SQL ER Diagrams), and production setup steps for **TechTrade**.

---

## 1. System Topology Overview

```mermaid
graph TD
    Client[Browser Client PWA] -->|HTTPS| Proxy[Nginx Gateway Ingress]
    Proxy -->|Static assets| Frontend[React / TypeScript Static Hosting]
    Proxy -->|API Routing| Backend[FastAPI Backend Nodes]
    Backend -->|CRUD| Postgres[(PostgreSQL Primary DB)]
    Backend -->|RAG Lookups| Ollama[(Ollama Local LLM Server)]
    Backend -->|Real-time indicators| YFinance[Yahoo Finance API]
```

---

## 2. Database Relationship Model (ER Schema)

```mermaid
erDiagram
    USER ||--o{ WATCHLIST : owns
    USER ||--o{ TRADE : logs
    USER ||--o{ CHATMESSAGES : sends
    USER ||--o{ ALERT : configures
    USER ||--o{ HOLDING : holds
    
    WATCHLIST ||--o{ WATCHLISTITEM : contains

    USER {
        int id PK
        string email
        string full_name
        string hashed_password
        boolean is_active
        boolean is_superuser
    }

    WATCHLIST {
        int id PK
        int owner_id FK
        string name
    }

    WATCHLISTITEM {
        int id PK
        int watchlist_id FK
        string symbol
    }

    TRADE {
        int id PK
        int user_id FK
        string symbol
        string direction
        float entry_price
        float exit_price
        float stop_loss
        float target
        integer position_size
        string notes
        string emotions_before
        string emotions_after
        string status
        datetime entry_date
        datetime exit_date
    }

    CHATMESSAGES {
        int id PK
        int user_id FK
        string role
        string content
        datetime timestamp
    }

    ALERT {
        int id PK
        int user_id FK
        string symbol
        string alert_type
        string channel
        string condition
        float value
        boolean is_active
        datetime triggered_at
    }

    HOLDING {
        int id PK
        int user_id FK
        string symbol
        float shares
        float avg_price
        float dividend_received
    }
```

---

## 3. Production Deployment Guide

### local Docker Setup
1. Validate configurations in `docker-compose.yml`.
2. Build and boot services:
   ```bash
   docker-compose up --build -d
   ```
3. Backend runs at `localhost:8000/docs`, frontend at `localhost:80`.

### Kubernetes Production Setup
1. Configure context clusters and apply manifests:
   ```bash
   kubectl apply -f kubernetes/deployment.yaml
   ```
2. Verify pods and routes are active:
   ```bash
   kubectl get pods -n default
   ```
