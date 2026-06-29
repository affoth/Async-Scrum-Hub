"""
Base declarative class for all SQLAlchemy models.

All database models must inherit from this class so they share
the same metadata, which is required by SQLAlchemy and Alembic
for schema management and migrations.
"""

from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
	pass