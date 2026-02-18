from sqlalchemy import Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True)
    weekly_goal: Mapped[int] = mapped_column(Integer, default=4, server_default=text("4"))
    lang: Mapped[str] = mapped_column(String(5), default="es", server_default="es")
    rest_timer_default: Mapped[int] = mapped_column(Integer, default=90, server_default=text("90"))
    theme: Mapped[str] = mapped_column(String(50), default="dark", server_default="dark")
    exercise_buttons: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=lambda: {
            "routineForm": {"video": True, "image": False, "anatomy": False},
            "workoutView": {"video": True, "image": False, "anatomy": False},
        },
    )
