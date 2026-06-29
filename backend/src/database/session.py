import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Read database environment variables
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# Collect missing variables so we can fail fast with a clear error message.
missing_vars = [] #empty list

#creates a dictionary with pairs "NAME", "VALUE"
for name, value in {
	"DB_USER": DB_USER,
	"DB_PASSWORD": DB_PASSWORD,
	"DB_HOST": DB_HOST,
	"DB_PORT": DB_PORT,
	"DB_NAME": DB_NAME,
}.items():
	if not value:  #if value is None or value == ""
		missing_vars.append(name)

if missing_vars:
	raise RuntimeError(
		f"Missing required database environment variables: {', '.join(missing_vars)}"
	)

#SQLAlchemy database URL built from explicit env vars.
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

#Engine = configuration + connection pool manager between backend (FastAPI) and PostgreSQL.
engine = create_engine(DATABASE_URL)

#SessionLocal is a session factory function (callable) to avoid repetition in each endpoint. 
#Each call SessionLocal() creates a new Session.
#it sets the configuration of the session.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

#FastAPI dependency that provides a database session per request.
def get_db() -> Generator[Session, None, None]:
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()