"""
Security utilities (JWT + hashing).

This module centralizes:
- JWT creation for login (create_access_token)
- JWT decoding/validation for protected endpoints (decode_access_token)
- Password hashing utilities (hash_password & verify_password)

Environment variables:
- JWT_SECRET_KEY (required)
- JWT_ALGORITHM (optional, defaults to HS256)
"""

import uuid
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from src.config.settings import settings

JWT_SECRET_KEY = settings.jwt_secret_key
JWT_ALGORITHM = settings.jwt_algorithm

"""
Creates a signed JWT access token for an authenticated user.
The token includes:
- "sub": the unique user identifier (stored as string)
- "exp": expiration timestamp (UTC, timezone-aware)

It is returned to the client after successful login and must be sent
in the Authorization header ("Bearer <token>") on protected requests.

If the token expires, the client must authenticate again to receive a new one.
"""
def create_access_token(subject: str|uuid.UUID) -> str:
	now = datetime.now(timezone.utc)
	expiration_time = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
	payload = {
		"sub": str(subject),
		"exp":  expiration_time
	}
	token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
	return token
"""
Decodes and validates a JWT access token.
Returns the payload dict if valid; raises 401 if invalid/expired.
"""
def decode_access_token(token: str) -> dict:
	try:
		payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
		return payload
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": {"code": "UNAUTHORIZED", "message": "Authentication required"}})
	
"""
pwd_context is an object created from the class CryptContext
Password hashing context configuration.
We use bcrypt as the hashing algorithm because it is specifically designed for securely storing passwords
`deprecated="auto"` allows future algorithm upgrades without breaking existing hashes.
"""
pwd_context = CryptContext(
	schemes=["bcrypt"],
	deprecated="auto"
)

def hash_password(plain_password: str) -> str:
	return pwd_context.hash(plain_password)

def verify_password(plain_password: str, stored_hash: str) -> bool:
	if not plain_password or not stored_hash:
		return False
	return pwd_context.verify(plain_password, stored_hash)



