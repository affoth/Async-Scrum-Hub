import os
from io import BytesIO
from PIL import Image, ImageOps
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import time

from src.database.models import User
from src.users.schemas import AvatarResponse

AVATARS_DIR = "/app/static/avatars"

ALLOWED_CONTENT_TYPES = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/gif": "gif",
	"image/webp": "webp",
}

PIL_FORMAT = {
	"jpg": "JPEG",
	"png": "PNG",
	"gif": "GIF",
	"webp": "WEBP",
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def user_update(db: Session, user: User, new_name: str | None, new_email: str | None) -> User:
	if new_name is not None:
		user.name = new_name
	if new_email is not None:
		user.email = new_email
	db.commit()
	db.refresh(user)
	return user


def upload_avatar(db: Session, user: User, content: bytes, content_type: str) -> AvatarResponse:
	if content_type not in ALLOWED_CONTENT_TYPES:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail={"error": {"code": "INVALID_FILE_TYPE", "message": "Only JPEG, PNG, GIF, and WebP images are allowed"}},
		)

	if len(content) > MAX_FILE_SIZE:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail={"error": {"code": "FILE_TOO_LARGE", "message": "File size exceeds the maximum limit of 5MB"}},
		)

	ext = ALLOWED_CONTENT_TYPES[content_type]
	filename = f"{user.id}_{int(time.time())}.{ext}"
	filepath = os.path.join(AVATARS_DIR, filename)

	os.makedirs(AVATARS_DIR, exist_ok=True)

	image = Image.open(BytesIO(content))
	image = ImageOps.exif_transpose(image)
	image = image.convert("RGB")
	resample = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS
	image = ImageOps.fit(image, (256, 256), method=resample)
	buffer = BytesIO()
	image.save(buffer, format=PIL_FORMAT[ext])

	with open(filepath, "wb") as f:
		f.write(buffer.getvalue())

	avatar_url = f"/static/avatars/{filename}"
	user.avatar_url = avatar_url
	db.commit()
	db.refresh(user)

	return AvatarResponse(avatar_url=avatar_url)
