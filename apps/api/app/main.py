from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.modules.admin.router import router as admin_router
from app.modules.analytics.router import router as analytics_router
from app.modules.auth.router import router as auth_router
from app.modules.config.router import router as config_router
from app.modules.exercises.router import router as exercises_router
from app.modules.preferences.router import router as preferences_router
from app.modules.routines.router import router as routines_router
from app.modules.sessions.router import router as sessions_router
from app.modules.stripe.router import router as stripe_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="GymTracker API",
        version="2.0.0",
        description="Backend for GymTracker v2 — routines, sessions, analytics, premium features.",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- routers ---
    app.include_router(auth_router)
    app.include_router(routines_router)
    app.include_router(sessions_router)
    app.include_router(exercises_router)
    app.include_router(preferences_router)
    app.include_router(analytics_router)
    app.include_router(admin_router)
    app.include_router(config_router)
    app.include_router(stripe_router)

    @app.get("/health", tags=["health"])
    async def health() -> dict:
        return {"status": "ok", "version": "2.0.0"}

    return app


app = create_app()

# Serverless adapter (Vercel / Netlify Functions / AWS Lambda)
# Uncomment when deploying serverless:
# from mangum import Mangum
# handler = Mangum(app)
