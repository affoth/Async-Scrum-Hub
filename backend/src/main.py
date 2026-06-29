"""
FastAPI Application Entry Point

This is the main entry point for the Async Scrum Hub backend API.
It initializes the FastAPI application, configures middleware, and includes API routers.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Create FastAPI application instance
app = FastAPI(
	title="Async Scrum Hub API",
	description="Backend API for Async Scrum Hub - A remote-first collaboration platform",
	version="1.0.0",
	docs_url="/docs",  # Swagger UI documentation
	redoc_url="/redoc",  # ReDoc documentation
)

# Configure CORS (Cross-Origin Resource Sharing)
# This allows the frontend (running on port 5173) to make requests to the backend (port 8000)
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=False,
	allow_methods=["*"],
	allow_headers=["*"],
)


# Root endpoint - Health check
@app.get("/")
def read_root():
	"""
	Root endpoint that returns basic API information.
	This is useful for health checks and verifying the API is running.
	"""
	return {
		"message": "Async Scrum Hub API",
		"status": "running",
		"version": "1.0.0",
		"docs": "/docs",
	}


# Health check endpoint
@app.get("/health")
def health_check():
	"""
	Health check endpoint for monitoring and Docker health checks.
	Returns a simple status indicating the API is operational.
	"""
	return {"status": "healthy"}


# API v1 prefix will be used for all API routes
# Example: /api/v1/auth/register
@app.get("/api/v1")
def api_info():
	"""
	API v1 information endpoint.
	"""
	return {
		"version": "1.0.0",
		"endpoints": {
			"auth": "/api/v1/auth",
			"organizations": "/api/v1/organizations",
			"tickets": "/api/v1/tickets",
			"tasks": "/api/v1/tasks",
			"standups": "/api/v1/standups",
			"blockers": "/api/v1/blockers",
		}
	}


from src.api.routes import api_router
from src.realtime import routes as ws_routes

app.include_router(api_router, prefix="/api/v1")
app.include_router(ws_routes.router, tags=["realtime"])

os.makedirs("/app/static/avatars", exist_ok=True)
app.mount("/static", StaticFiles(directory="/app/static"), name="static")
