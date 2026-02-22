from datetime import datetime

from pydantic import BaseModel, Field


class SetLogItem(BaseModel):
    weight: str
    reps: str
    isPR: bool | None = None


class SessionCreate(BaseModel):
    routine_id: str | None = None
    routine_name: str = Field(..., min_length=1, max_length=255)
    started_at: datetime
    finished_at: datetime
    duration_minutes: int = Field(..., ge=0)
    logs: dict[str, list[SetLogItem]] = Field(default_factory=dict)


class SessionRead(BaseModel):
    id: str
    routine_id: str | None
    routine_name: str
    started_at: datetime
    finished_at: datetime
    duration_minutes: int
    logs: dict[str, list[SetLogItem]]

    model_config = {"from_attributes": True}
