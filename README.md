# AI Restaurant Assitant

A modern LLM-powered chat assistant for restaurant discovery. Built with React, TypeScript, and FastAPI.

## 🚀 Features

- Personal AI-powered restaurant assistant
- Easy search and recommendations
- Restaurant details with images and reviews
- Message editing and deletion

## 🏗️ Project Structure

```
artisan-restaurant-assistant/
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── tests/
├── backend/
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── core/        # Core configuration
│   │   ├── models/      # Database models
│   │   └── services/    # Business logic
│   ├── scraper/        # Restaurant data scraping
│   └── tests/
└── docs/               # Documentation
```

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- TailwindCSS

### Backend
- Python 3.11+
- FastAPI
- SQLite
- BeautifulSoup4

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- pip

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chatbot-widget.git
cd chatbot-widget
```

2. Setup Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. Setup Frontend:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🧪 Testing

### Running Backend Tests
```bash
cd backend
python -m pytest
```

### Running Frontend Tests
```bash
cd frontend
npm test
```

## 📝 Development Guidelines

### Git Workflow
- Use feature branches
- Follow conventional commits
- Submit PRs for review

### Code Style
- Frontend: ESLint + Prettier
- Backend: Black + isort
- Pre-commit hooks enabled

## 📚 API Documentation

API documentation is available at `/docs` when running the backend server.
