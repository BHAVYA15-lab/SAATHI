from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.core.config import settings
from app.api import auth, hospitals, appointments, analytics
from app.seed import ensure_db_seeded

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Saarthi Healthcare Intelligence Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Set up CORS middleware dynamically
raw_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
parsed_origins = list(set(raw_origins + default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=parsed_origins if "*" not in parsed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    # Automatically seed database if empty
    ensure_db_seeded()

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(hospitals.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Saarthi Healthcare Intelligence Platform API",
        "docs": "/docs",
        "status": "healthy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
