from pydantic import BaseModel, Field


class ExerciseCreate(BaseModel):
    id: str = Field(..., pattern=r"^custom_\d+$")
    name: str = Field(..., min_length=1, max_length=255)
    muscle: str = Field(..., min_length=1, max_length=50)


class ExerciseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    muscle: str | None = Field(default=None, min_length=1, max_length=50)


class ExerciseRead(BaseModel):
    id: str
    name: str
    muscle: str

    model_config = {"from_attributes": True}
