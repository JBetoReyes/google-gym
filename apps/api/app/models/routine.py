from sqlalchemy import ARRAY, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Routine(Base):
    __tablename__ = "routines"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    exercises: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    position: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    created_at: Mapped[str] = mapped_column(server_default=text("now()"))
    updated_at: Mapped[str] = mapped_column(
        server_default=text("now()"),
        onupdate=text("now()"),
    )
