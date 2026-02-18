from pydantic import BaseModel, Field


class ExerciseButtonsSchema(BaseModel):
    routineForm: dict[str, bool] | None = None
    workoutView: dict[str, bool] | None = None


class PreferencesUpdate(BaseModel):
    weekly_goal: int | None = Field(default=None, ge=1, le=7)
    lang: str | None = Field(default=None, pattern="^(es|en|fr)$")
    rest_timer_default: int | None = Field(default=None)
    theme: str | None = None
    exercise_buttons: ExerciseButtonsSchema | None = None


class PreferencesRead(BaseModel):
    weekly_goal: int
    lang: str
    rest_timer_default: int
    theme: str
    exercise_buttons: dict

    model_config = {"from_attributes": True}
