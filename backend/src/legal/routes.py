"""
Legal API routes.

Endpoints:
- GET    /legal/documents/{key}                    → get legal document     (public; keys: privacy, terms)

Reads markdown files from /app/legal/{key}.md and returns content with last-modified timestamp.
"""

import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status

from src.legal.schemas import LegalDocumentResponse

router = APIRouter()

LEGAL_DIR = "/app/legal"

DOCUMENTS = {
	"privacy": "Privacy Policy",
	"terms": "Terms of Service",
}


@router.get("/legal/documents/{key}", response_model=LegalDocumentResponse, status_code=status.HTTP_200_OK)
def get_legal_document(key: str):
	if key not in DOCUMENTS:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Legal document not found"}},
		)

	filepath = os.path.join(LEGAL_DIR, f"{key}.md")

	if not os.path.exists(filepath):
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Legal document not found"}},
		)

	with open(filepath, "r", encoding="utf-8") as f:
		raw = f.read()

	mtime = os.path.getmtime(filepath)
	updated_at = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()

	return LegalDocumentResponse(
		key=key,
		title=DOCUMENTS[key],
		content=raw,
		updated_at=updated_at,
	)
