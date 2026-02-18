from pydantic import BaseModel, Field


class RoutineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    exercises: list[str] = Field(default_factory=list)
    position: int = Field(default=0, ge=0)


class RoutineUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    exercises: list[str] | None = None
    position: int | None = Field(default=None, ge=0)


class RoutineRead(BaseModel):
    id: str
    name: str
    exercises: list[str]
    position: int
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}
