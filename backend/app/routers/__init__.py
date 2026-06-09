from app.routers.auth import router as auth_router
from app.routers.research import router as research_router
from app.routers.companies import router as companies_router
from app.routers.watchlist import router as watchlist_router
from app.routers.market import router as market_router
from app.routers.portfolio import router as portfolio_router
from app.routers.documents import router as documents_router

__all__ = [
    "auth_router",
    "research_router",
    "companies_router",
    "watchlist_router",
    "market_router",
    "portfolio_router",
    "documents_router",
]
