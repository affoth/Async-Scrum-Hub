"""
Users API routes.

Endpoints:
- GET    /users/me                                 → get current user profile    (authenticated)
- PATCH  /users/me                                 → update name or email        (authenticated)
- POST   /users/me/avatar                          → upload profile avatar       (authenticated)

All endpoints require a valid JWT (get_current_user dependency).
"""

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.database.models import User
from src.api.deps import get_current_user
from src.users import service
from src.users.schemas import UserResponse, UpdateUserRequest, AvatarResponse

router = APIRouter()

@router.get("/users/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_me(current_user: User = Depends(get_current_user)):
	return current_user


@router.patch("/users/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def update_me(
	body: UpdateUserRequest, 
	db: Session = Depends(get_db), 
	current_user: User = Depends(get_current_user)
):
	return service.user_update(db, current_user, body.name, body.email)

@router.post("/users/me/avatar", response_model=AvatarResponse, status_code=status.HTTP_200_OK)
async def upload_avatar(
	file: UploadFile = File(...),
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	content = await file.read()
	return service.upload_avatar(db, current_user, content, file.content_type)
