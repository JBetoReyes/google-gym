from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CustomExercise(Base):
    __tablename__ = "custom_exercises"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)  # "custom_{timestamp}"
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    muscle: Mapped[str] = mapped_column(String(50), nullable=False)
