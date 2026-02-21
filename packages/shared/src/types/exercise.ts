export type MuscleGroup =
  | 'Cardio'
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Abs'
  | 'Flexibility';

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
}

export interface ExerciseButtons {
  routineForm: {
    video: boolean;
    image: boolean;
    anatomy: boolean;
  };
  workoutView: {
    video: boolean;
    image: boolean;
    anatomy: boolean;
  };
}

export const DEFAULT_EXERCISE_BUTTONS: ExerciseButtons = {
  routineForm: { video: true, image: false, anatomy: false },
  workoutView: { video: true, image: false, anatomy: false },
};
