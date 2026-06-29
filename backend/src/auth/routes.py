"""
Auth API routes.

Endpoints:
- POST   /auth/register                            → register new account   (public)
- POST   /auth/login                               → login, returns JWT     (public)

No authorization required — these endpoints are public.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.auth import service
from src.auth.schemas import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse

router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
	return service.register_user(db, body.email, body.name, body.password)


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login(body: LoginRequest, db: Session = Depends(get_db)):
	return service.login_user(db, body.email, body.password)
