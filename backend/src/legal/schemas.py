from pydantic import BaseModel

class LegalDocumentResponse(BaseModel):
	key: str
	title: str
	content: str
	updated_at: str
