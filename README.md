# ArthaDrishti AI 🔍
### Autonomous Financial Intelligence Platform for Indian Equities

> **Capgemini Exceller AgentifAI Buildathon 2026 · Team Five Stars**

ArthaDrishti AI is a production-grade, multi-agent financial intelligence platform that autonomously monitors Indian equity markets — digesting company filings, tracking sentiment divergence, computing risk scores, and surfacing early fraud signals.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **RashtriyaRiskIndex™** | 8-dimensional AI risk scoring (Financial, Operational, Geopolitical, Legal, Market, ESG, Fraud, Macro) |
| **Narrative Divergence Engine** | Detects gaps between management claims in filings and news coverage |
| **Fraud Early Warning** | Beneish M-Score proxy + red flag detection (promoter pledge, auditor change, RPT) |
| **RAG Filing Analysis** | Upload PDFs → AI answers grounded in citations from actual documents |
| **Macro Impact Simulator** | Simulate RBI rate changes, crude oil shocks, currency moves on sector exposure |
| **Live Alert Stream** | SSE-powered real-time alerts when risk thresholds breach |
| **PDF Research Reports** | One-click branded PDF export with all risk dimensions |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js 15 Frontend                        │
│   (App Router · React 19 · TanStack Query · Zustand)         │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST + SSE
┌────────────────────────▼─────────────────────────────────────┐
│                   FastAPI Backend                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  9 AI Agents│  │  RAG Pipeline│  │  5 API Routers     │  │
│  │  (LLM-based)│  │  (ChromaDB)  │  │  (REST + SSE)      │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└──────┬──────────────────────────────────────┬────────────────┘
       │                                      │
┌──────▼──────┐                   ┌───────────▼──────┐
│    Redis    │                   │   SQLite / PgSQL │
│  (Celery)   │                   │   (SQLAlchemy)   │
└─────────────┘                   └──────────────────┘
```

**AI Agents:**
- `FilingAgent` — RAG-powered Q&A over uploaded filings
- `RiskAgent` — RashtriyaRiskIndex with 8 risk dimensions
- `NewsAgent` — Multi-source news aggregation + sentiment scoring
- `SentimentAgent` — Narrative divergence detection
- `MacroAgent` — Sector sensitivity + macro scenario analysis
- `FraudAgent` — Beneish M-Score proxy + red flag detection
- `EarningsAgent` — Earnings call transcript analysis
- `CompetitorAgent` — Peer benchmarking for NSE companies
- `WatchlistAgent` — Continuous monitoring with threshold alerts
- `Orchestrator` — Intent classification + multi-agent coordination

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Redis 7 (for Celery)
- A [Groq API key](https://console.groq.com/keys) (free)

### 1. Clone & Configure

```bash
git clone <repo>
cd ArthaDrishti

# Copy and fill environment file
cp .env.example .env
# Add your GROQ_API_KEY (minimum required)
```

### 2. Start with Docker Compose

```bash
docker compose up -d
```

This starts: FastAPI backend · Next.js frontend · Redis · Celery worker · Celery beat

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### 3. Demo Login

```
Email: demo@arthadrishti.ai
Password: Demo@2024#
```

Pre-loaded with: 5 companies, 5-item watchlist, 3-item portfolio, 2 sample alerts.

---

## 💻 Local Development (without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate   # Windows
source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Seed demo data
python scripts/seed_demo.py

# Start API server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Celery Worker (optional — for background monitoring)

```bash
cd backend
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
celery -A app.tasks.celery_app.celery_app beat --loglevel=info
```

---

## 📂 Project Structure

```
ArthaDrishti/
├── backend/
│   ├── app/
│   │   ├── agents/          # 9 AI agents + orchestrator
│   │   ├── models/          # SQLAlchemy ORM models (7)
│   │   ├── schemas/         # Pydantic v2 schemas (7)
│   │   ├── routers/         # FastAPI routers (5)
│   │   ├── rag/             # RAG pipeline (chunker, embedder, retriever)
│   │   ├── utils/           # LLM client, market data, news, PDF export
│   │   ├── tasks/           # Celery tasks
│   │   └── core/            # Config, database, security
│   ├── scripts/
│   │   └── seed_demo.py     # Demo data seeder
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/          # Login, register pages
│   │   └── (app)/           # Dashboard, company, watchlist, etc.
│   ├── components/
│   │   ├── agents/          # ResearchTerminal, AlertFeed
│   │   ├── charts/          # RiskRadar SVG chart
│   │   └── shared/          # Sidebar, MarketOverview
│   └── lib/                 # API client, SSE, Zustand stores, utils
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | JWT signing secret (32+ chars) |
| `GROQ_API_KEY` | ✅ | Groq LLM API key (free tier) |
| `OPENAI_API_KEY` | Optional | OpenAI key (if LLM_PROVIDER=openai) |
| `NEWS_API_KEY` | Optional | NewsAPI key for news |
| `GNEWS_API_KEY` | Optional | GNews key for news |
| `DATABASE_URL` | ✅ | SQLite or PostgreSQL URL |
| `CELERY_BROKER_URL` | ✅ | Redis URL for Celery |

---

## 📊 API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login → JWT token |
| GET | `/api/v1/companies/search` | Search NSE companies |
| GET | `/api/v1/companies/{symbol}/risk` | AI risk analysis |
| GET | `/api/v1/companies/{symbol}/fraud` | Fraud early warning |
| GET | `/api/v1/companies/{symbol}/sentiment` | Narrative divergence |
| POST | `/api/v1/research/query` | **SSE** streaming research |
| POST | `/api/v1/market/simulate` | Macro event simulator |
| GET | `/api/v1/watchlist/alerts/stream` | **SSE** live alert stream |
| POST | `/api/v1/documents/upload` | Upload PDF for RAG |

Full docs at http://localhost:8000/docs

---

## ⚠️ Disclaimer

ArthaDrishti AI is for **informational and research purposes only**. It is NOT a SEBI-registered investment advisor. All AI-generated risk scores, sentiment analysis, and research outputs are based on publicly available data and should not be construed as investment advice. Past performance of models and indicators is not indicative of future results. Always consult a qualified SEBI-registered financial advisor before making investment decisions.

---

## 🤝 Team Five Stars — Capgemini Exceller AgentifAI Buildathon 2026
