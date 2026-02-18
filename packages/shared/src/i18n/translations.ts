import type { Lang } from '../types/user.js';
import type { MuscleGroup } from '../types/exercise.js';

export interface TranslationShape {
  // Navigation
  dashboard: string;
  routines: string;
  history: string;
  // Goal & stats
  weekly_goal: string;
  workouts_completed: string;
  total_workouts: string;
  total_sets: string;
  progress: string;
  avg_duration: string;
  streak: string;
  fav_exercise: string;
  total_time: string;
  sessions_label: string;
  weeks_label: string;
  min_label: string;
  this_week: string;
  // Routines
  new_routine: string;
  create_routine: string;
  edit_routine: string;
  start: string;
  exercises: string;
  save_routine: string;
  name_placeholder: string;
  search_placeholder: string;
  no_routines: string;
  no_routines_hint: string;
  selected: string;
  all: string;
  tab_exercises: string;
  no_exercises_selected: string;
  reorder_exercises: string;
  drag_to_reorder: string;
  // Workout
  weight: string;
  reps: string;
  level: string;
  time: string;
  sets_completed: string;
  finish_workout: string;
  cancel_workout: string;
  cancel_msg: string;
  add_exercise: string;
  focus_mode: string;
  last_set: string;
  new_pr: string;
  set_deleted: string;
  // History
  no_history: string;
  delete_session: string;
  // Settings
  settings: string;
  language: string;
  data_management: string;
  export_data: string;
  import_data: string;
  import_alert: string;
  import_success: string;
  import_error: string;
  my_exercises: string;
  no_custom_exercises: string;
  delete_exercise_warn: string;
  rest_timer: string;
  rest_timer_default: string;
  skip: string;
  rest_done: string;
  exercise_buttons: string;
  btn_video: string;
  btn_image: string;
  btn_anatomy: string;
  routine_form_btns: string;
  workout_btns: string;
  // Generic
  delete_routine: string;
  delete_msg: string;
  confirm: string;
  cancel: string;
  goal_met_title: string;
  goal_met_desc: string;
  // Exercise action buttons
  watch_tutorial: string;
  view_images: string;
  view_anatomy: string;
  create_exercise: string;
  new_exercise: string;
  exercise_name_placeholder: string;
  add: string;
  // QR
  share_routine: string;
  scan_qr: string;
  import: string;
  routine_qr_title: string;
  import_routine: string;
  import_confirm: string;
  camera_error: string;
  // Anatomy modal
  view_front: string;
  view_back: string;
  primary_muscle: string;
  secondary_muscle: string;
  // Charts
  chart_volume: string;
  chart_duration: string;
  chart_sets: string;
  chart_freq: string;
  chart_muscle: string;
  // Nested
  muscles: Record<MuscleGroup, string>;
  ex_names: Record<string, string>;
}

const esExNames: Record<string, string> = {
  cinta: 'Cinta de Correr', eliptica: 'Elíptica', bici: 'Bici Estática',
  escaladora: 'Escalera Eléctrica', bp: 'Press de Banca', pi: 'Press Inclinado',
  ap: 'Aperturas Mancuernas', pecho_maq: 'Máquina de Pecho', pec_deck: 'Pec Deck (Mariposa)',
  fondos_maq: 'Fondos en Máquina', dom: 'Dominadas', dom_asist: 'Dominadas Asistidas',
  jal: 'Jalón al Pecho', rem: 'Remo con Barra', remo_t: 'Remo Barra T',
  remo_maq: 'Máquina de Remo', sen: 'Sentadilla', hack: 'Sentadilla Hack',
  pm: 'Peso Muerto', pren: 'Prensa', hip: 'Hip Thrust', ext: 'Extensión Cuádriceps',
  fem_tumb: 'Curl Femoral Tumbado', abduct: 'Máquina Abductores', adduct: 'Máquina Aductores',
  gem_maq: 'Máquina de Gemelos', pmil: 'Press Militar', elevl: 'Elevaciones Laterales',
  curlb: 'Curl Barra', curlm: 'Curl Martillo', pred_maq: 'Máquina Predicador',
  curl_conc: 'Curl Concentrado', polea: 'Tríceps Polea', tri_soga: 'Tríceps con Soga',
  tri_copa: 'Extensión Copa', plank: 'Plancha (Tiempo)', crunch: 'Crunch',
  press_mancuerna: 'Press Mancuernas Plano', press_mancuerna_incl: 'Press Mancuernas Inclinado',
  ap_incl: 'Aperturas Inclinadas', polea_cruce: 'Cruce de Poleas',
  polea_cruce_baja: 'Cruce Polea Baja', pullover_m: 'Pullover con Mancuerna',
  remo_m: 'Remo con Mancuerna', pull_polea: 'Pullover en Polea',
  polea_recta: 'Jalón Brazo Recto', face_pull: 'Face Pull',
  rdl_m: 'RDL con Mancuernas', zancada_m: 'Zancadas con Mancuernas',
  sen_goblet: 'Sentadilla Goblet', patada_polea: 'Patada Trasera Polea',
  pull_through: 'Pull-Through Polea', gem_m: 'Elevación de Talones con Mancuerna',
  pmil_m: 'Press Militar Mancuernas', arnold: 'Press Arnold', elevf: 'Elevaciones Frontales',
  elevl_polea: 'Elevaciones Laterales Polea', pajaro: 'Pájaro (Posterior)',
  polea_rear: 'Posterior en Polea', remo_verti: 'Remo al Mentón',
  curl_polea: 'Curl en Polea Baja', curl_incl: 'Curl Inclinado Mancuernas',
  curl_inv: 'Curl Inverso', tri_m: 'Extensión Tríceps Mancuerna',
  tri_polea_alta: 'Tríceps Polea Alta', crunch_polea: 'Crunch en Polea',
  woodchop: 'Wood Chop', twist_ruso: 'Twist Ruso', hs_chest: 'Press Hammer Pecho',
  hs_incline: 'Press Hammer Inclinado', pec_fly: 'Fly en Máquina',
  cable_fly_high: 'Cruce Polea Alta', hs_row: 'Remo Hammer', hs_pulldown: 'Jalón Hammer',
  chest_supported: 'Remo Pecho Apoyado', rev_pec_fly: 'Pec Fly Inverso',
  hs_leg_press: 'Prensa Hammer', fem_sent: 'Curl Femoral Sentado',
  bulgarian: 'Sentadilla Búlgara', hs_shoulder: 'Press Hammer Hombro',
  lat_raise_maq: 'Máquina Elevaciones', cable_front: 'Elevación Frontal Polea',
  skull_crusher: 'Rompe Cráneos', tricep_kickback_m: 'Patada de Tríceps',
  cable_curl_high: 'Curl Polea Alta', bayesian_curl: 'Curl Bayesiano',
  leg_raise: 'Elevaciones de Piernas', ab_wheel: 'Rueda Abdominal',
};

const enExNames: Record<string, string> = {
  cinta: 'Treadmill', eliptica: 'Elliptical', bici: 'Stationary Bike',
  escaladora: 'Stair Climber', bp: 'Bench Press', pi: 'Incline Press',
  ap: 'Dumbbell Flyes', pecho_maq: 'Chest Press Machine', pec_deck: 'Pec Deck',
  fondos_maq: 'Machine Dips', dom: 'Pull Ups', dom_asist: 'Assisted Pull-up',
  jal: 'Lat Pulldown', rem: 'Barbell Row', remo_t: 'T-Bar Row',
  remo_maq: 'Seated Row Machine', sen: 'Squat', hack: 'Hack Squat',
  pm: 'Deadlift', pren: 'Leg Press', hip: 'Hip Thrust', ext: 'Leg Extension',
  fem_tumb: 'Lying Leg Curl', abduct: 'Abductor Machine', adduct: 'Adductor Machine',
  gem_maq: 'Calf Raise Machine', pmil: 'Military Press', elevl: 'Lateral Raises',
  curlb: 'Barbell Curl', curlm: 'Hammer Curl', pred_maq: 'Preacher Curl Machine',
  curl_conc: 'Concentration Curl', polea: 'Cable Triceps', tri_soga: 'Triceps Rope Pushdown',
  tri_copa: 'Overhead Extension', plank: 'Plank', crunch: 'Crunch',
  press_mancuerna: 'Flat Dumbbell Press', press_mancuerna_incl: 'Incline Dumbbell Press',
  ap_incl: 'Incline Dumbbell Flyes', polea_cruce: 'Cable Crossover',
  polea_cruce_baja: 'Low Cable Fly', pullover_m: 'Dumbbell Pullover',
  remo_m: 'Single-Arm Dumbbell Row', pull_polea: 'Cable Pullover',
  polea_recta: 'Straight-Arm Pulldown', face_pull: 'Face Pull',
  rdl_m: 'Dumbbell RDL', zancada_m: 'Dumbbell Lunges', sen_goblet: 'Goblet Squat',
  patada_polea: 'Cable Kickback', pull_through: 'Cable Pull-Through',
  gem_m: 'Single-Leg Calf Raise', pmil_m: 'Dumbbell Shoulder Press',
  arnold: 'Arnold Press', elevf: 'Front Raises', elevl_polea: 'Cable Lateral Raise',
  pajaro: 'Rear Delt Fly', polea_rear: 'Cable Rear Delt Fly', remo_verti: 'Upright Row',
  curl_polea: 'Cable Curl', curl_incl: 'Incline Dumbbell Curl', curl_inv: 'Reverse Curl',
  tri_m: 'Dumbbell Triceps Extension', tri_polea_alta: 'Cable Overhead Triceps',
  crunch_polea: 'Cable Crunch', woodchop: 'Wood Chop', twist_ruso: 'Russian Twist',
  hs_chest: 'Hammer Strength Chest Press', hs_incline: 'Hammer Strength Incline Press',
  pec_fly: 'Pec Fly Machine', cable_fly_high: 'High Cable Fly',
  hs_row: 'Hammer Strength Row', hs_pulldown: 'Hammer Strength Pulldown',
  chest_supported: 'Chest Supported Row', rev_pec_fly: 'Reverse Pec Fly',
  hs_leg_press: 'Hammer Strength Leg Press', fem_sent: 'Seated Leg Curl',
  bulgarian: 'Bulgarian Split Squat', hs_shoulder: 'Hammer Strength Shoulder Press',
  lat_raise_maq: 'Lateral Raise Machine', cable_front: 'Cable Front Raise',
  skull_crusher: 'Skull Crusher', tricep_kickback_m: 'Tricep Kickback',
  cable_curl_high: 'High Cable Curl', bayesian_curl: 'Bayesian Curl',
  leg_raise: 'Leg Raises', ab_wheel: 'Ab Wheel',
};

const frExNames: Record<string, string> = {
  cinta: 'Tapis de course', eliptica: 'Vélo elliptique', bici: "Vélo d'appartement",
  escaladora: 'Escalier', bp: 'Développé couché', pi: 'Développé incliné',
  ap: 'Écartés', pecho_maq: 'Presse Pectoraux', pec_deck: 'Pec Deck',
  fondos_maq: 'Dips Machine', dom: 'Tractions', dom_asist: 'Tractions Assistées',
  jal: 'Tirage poitrine', rem: 'Rowing barre', remo_t: 'Rowing Barre T',
  remo_maq: 'Rowing Assis Machine', sen: 'Squat', hack: 'Squat Hack',
  pm: 'Soulevé de terre', pren: 'Presse à cuisses', hip: 'Hip Thrust',
  ext: 'Extension jambes', fem_tumb: 'Leg Curl Allongé',
  abduct: 'Machine Abducteurs', adduct: 'Machine Adducteurs',
  gem_maq: 'Extension Mollets', pmil: 'Développé militaire', elevl: 'Élévations latérales',
  curlb: 'Curl barre', curlm: 'Curl marteau', pred_maq: 'Curl Pupitre Machine',
  curl_conc: 'Curl Concentré', polea: 'Triceps poulie', tri_soga: 'Triceps Corde',
  tri_copa: 'Extension Verticale', plank: 'Gainage', crunch: 'Crunch',
  press_mancuerna: 'Développé couché haltères', press_mancuerna_incl: 'Développé incliné haltères',
  ap_incl: 'Écartés inclinés', polea_cruce: 'Croisé poulie',
  polea_cruce_baja: 'Croisé poulie basse', pullover_m: 'Pullover haltère',
  remo_m: 'Rowing haltère unilatéral', pull_polea: 'Pullover poulie',
  polea_recta: 'Tirage bras tendus', face_pull: 'Face Pull',
  rdl_m: 'Soulevé roumain haltères', zancada_m: 'Fentes haltères',
  sen_goblet: 'Squat goblet', patada_polea: 'Kickback poulie',
  pull_through: 'Pull-Through poulie', gem_m: 'Élévation mollets haltère',
  pmil_m: 'Développé épaules haltères', arnold: 'Press Arnold',
  elevf: 'Élévations frontales', elevl_polea: 'Élévations latérales poulie',
  pajaro: 'Oiseau (deltoïde post.)', polea_rear: 'Poulie deltoïde postérieur',
  remo_verti: 'Rowing menton', curl_polea: 'Curl poulie basse',
  curl_incl: 'Curl incliné haltères', curl_inv: 'Curl inversé',
  tri_m: 'Extension triceps haltère', tri_polea_alta: 'Triceps poulie haute',
  crunch_polea: 'Crunch poulie', woodchop: 'Wood Chop', twist_ruso: 'Rotation russe',
  hs_chest: 'Presse Hammer Poitrine', hs_incline: 'Presse Hammer Incliné',
  pec_fly: 'Machine Fly Pectoraux', cable_fly_high: 'Écarté Poulie Haute',
  hs_row: 'Rowing Hammer', hs_pulldown: 'Tirage Hammer',
  chest_supported: 'Rowing Poitrine Appuyé', rev_pec_fly: 'Pec Fly Inversé',
  hs_leg_press: 'Presse Jambes Hammer', fem_sent: 'Leg Curl Assis',
  bulgarian: 'Squat Bulgare', hs_shoulder: 'Presse Hammer Épaules',
  lat_raise_maq: 'Machine Élévations Latérales', cable_front: 'Élévation Frontale Câble',
  skull_crusher: 'Skull Crusher', tricep_kickback_m: 'Extension Triceps Arrière',
  cable_curl_high: 'Curl Poulie Haute', bayesian_curl: 'Curl Bayésien',
  leg_raise: 'Élévations de Jambes', ab_wheel: 'Roue Abdominale',
};

export const TRANSLATIONS: Record<Lang, TranslationShape> = {
  es: {
    dashboard: 'Inicio', routines: 'Rutinas', history: 'Historial',
    weekly_goal: 'Meta Semanal', workouts_completed: 'entrenamientos completados',
    total_workouts: 'Sesiones Totales', total_sets: 'Series Totales', progress: 'Progreso',
    avg_duration: 'Dur. Promedio', streak: 'Racha', fav_exercise: 'Ejercicio Fav.',
    total_time: 'Tiempo Total', sessions_label: 'sesiones', weeks_label: 'sem',
    min_label: 'min', this_week: 'esta semana',
    new_routine: 'Nueva Rutina', create_routine: 'Crear Nueva Rutina',
    edit_routine: 'Editar Rutina', start: 'Empezar', exercises: 'ejercicios',
    save_routine: 'Guardar Rutina', name_placeholder: 'Nombre (ej: Día de Pierna)',
    search_placeholder: 'Buscar ejercicio...', no_routines: 'Sin rutinas aún',
    no_routines_hint: 'Crea tu primera rutina para empezar.',
    selected: 'Seleccionados', all: 'Todos', tab_exercises: 'Ejercicios',
    no_exercises_selected: 'Sin ejercicios seleccionados',
    reorder_exercises: 'Reordenar', drag_to_reorder: 'Arrastra para cambiar el orden',
    weight: 'Peso', reps: 'Reps', level: 'Nivel', time: 'Minutos',
    sets_completed: 'Series Completadas', finish_workout: 'Finalizar Entrenamiento',
    cancel_workout: '¿Cancelar entrenamiento?', cancel_msg: 'Se perderá el progreso actual.',
    add_exercise: 'Agregar Ejercicio', focus_mode: 'Modo Enfoque', last_set: 'Último:',
    new_pr: '¡Nuevo Récord!', set_deleted: 'Serie eliminada',
    no_history: 'No hay historial aún', delete_session: '¿Borrar entrenamiento?',
    settings: 'Configuración', language: 'Idioma',
    data_management: 'Gestión de Datos', export_data: 'Exportar Progreso',
    import_data: 'Importar Progreso',
    import_alert: 'Importar borrará los datos actuales. Asegúrate de tener respaldo.',
    import_success: 'Datos importados correctamente', import_error: 'Error al importar archivo',
    my_exercises: 'Mis Ejercicios', no_custom_exercises: 'No tienes ejercicios personalizados',
    delete_exercise_warn: 'Se eliminará de las rutinas que lo usen.',
    rest_timer: 'Descanso', rest_timer_default: 'Descanso por defecto',
    skip: 'Saltar', rest_done: '¡Descanso listo!',
    exercise_buttons: 'Botones de Ejercicio', btn_video: 'Video',
    btn_image: 'Imágenes', btn_anatomy: 'Músculos',
    routine_form_btns: 'Rutinas', workout_btns: 'Entrenamiento',
    delete_routine: '¿Borrar rutina?', delete_msg: 'Esta acción no se puede deshacer.',
    confirm: 'Confirmar', cancel: 'Cancelar',
    goal_met_title: '¡Meta Cumplida!', goal_met_desc: 'Has completado tus días de entrenamiento.',
    watch_tutorial: 'Ver tutorial', view_images: 'Ver diagrama', view_anatomy: 'Ver anatomía',
    create_exercise: 'Crear ejercicio', new_exercise: 'Nuevo ejercicio',
    exercise_name_placeholder: 'Nombre del ejercicio', add: 'Agregar',
    share_routine: 'Compartir', scan_qr: 'Escanear QR', import: 'Importar',
    routine_qr_title: 'Código QR', import_routine: 'Importar Rutina',
    import_confirm: '¿Agregar esta rutina a tu lista?', camera_error: 'No se pudo acceder a la cámara',
    view_front: 'Frente', view_back: 'Espalda',
    primary_muscle: 'Principal', secondary_muscle: 'Secundario',
    chart_volume: 'Volumen', chart_duration: 'Duración', chart_sets: 'Series',
    chart_freq: 'Frecuencia', chart_muscle: 'Por Músculo',
    muscles: {
      Cardio: 'Cardio', Chest: 'Pecho', Back: 'Espalda',
      Legs: 'Pierna', Shoulders: 'Hombro', Arms: 'Brazos', Abs: 'Abs',
    },
    ex_names: esExNames,
  },
  en: {
    dashboard: 'Dashboard', routines: 'Routines', history: 'History',
    weekly_goal: 'Weekly Goal', workouts_completed: 'workouts completed',
    total_workouts: 'Total Workouts', total_sets: 'Total Sets', progress: 'Progress',
    avg_duration: 'Avg. Duration', streak: 'Streak', fav_exercise: 'Top Exercise',
    total_time: 'Total Time', sessions_label: 'sessions', weeks_label: 'wks',
    min_label: 'min', this_week: 'this week',
    new_routine: 'New Routine', create_routine: 'Create New Routine',
    edit_routine: 'Edit Routine', start: 'Start', exercises: 'exercises',
    save_routine: 'Save Routine', name_placeholder: 'Name (e.g., Leg Day)',
    search_placeholder: 'Search exercise...', no_routines: 'No routines yet',
    no_routines_hint: 'Create your first routine to get started.',
    selected: 'Selected', all: 'All', tab_exercises: 'Exercises',
    no_exercises_selected: 'No exercises selected',
    reorder_exercises: 'Reorder', drag_to_reorder: 'Drag to reorder',
    weight: 'Weight', reps: 'Reps', level: 'Level', time: 'Minutes',
    sets_completed: 'Sets Completed', finish_workout: 'Finish Workout',
    cancel_workout: 'Cancel workout?', cancel_msg: 'Current progress will be lost.',
    add_exercise: 'Add Exercise', focus_mode: 'Focus Mode', last_set: 'Last:',
    new_pr: 'New PR!', set_deleted: 'Set deleted',
    no_history: 'No history yet', delete_session: 'Delete training?',
    settings: 'Settings', language: 'Language',
    data_management: 'Data Management', export_data: 'Export Data',
    import_data: 'Import Data',
    import_alert: 'Importing will overwrite current data. Make sure to backup.',
    import_success: 'Data imported successfully', import_error: 'Error importing file',
    my_exercises: 'My Exercises', no_custom_exercises: 'No custom exercises yet',
    delete_exercise_warn: 'This will be removed from routines using it.',
    rest_timer: 'Rest Timer', rest_timer_default: 'Default Rest Timer',
    skip: 'Skip', rest_done: 'Rest done!',
    exercise_buttons: 'Exercise Buttons', btn_video: 'Video',
    btn_image: 'Images', btn_anatomy: 'Muscles',
    routine_form_btns: 'Routine Builder', workout_btns: 'During Workout',
    delete_routine: 'Delete routine?', delete_msg: 'This action cannot be undone.',
    confirm: 'Confirm', cancel: 'Cancel',
    goal_met_title: 'Goal Met!', goal_met_desc: 'You completed your training days.',
    watch_tutorial: 'Watch tutorial', view_images: 'View diagram', view_anatomy: 'View anatomy',
    create_exercise: 'Create exercise', new_exercise: 'New exercise',
    exercise_name_placeholder: 'Exercise name', add: 'Add',
    share_routine: 'Share', scan_qr: 'Scan QR', import: 'Import',
    routine_qr_title: 'QR Code', import_routine: 'Import Routine',
    import_confirm: 'Add this routine to your list?', camera_error: 'Could not access camera',
    view_front: 'Front', view_back: 'Back',
    primary_muscle: 'Primary', secondary_muscle: 'Secondary',
    chart_volume: 'Volume', chart_duration: 'Duration', chart_sets: 'Sets',
    chart_freq: 'Frequency', chart_muscle: 'Muscle Split',
    muscles: {
      Cardio: 'Cardio', Chest: 'Chest', Back: 'Back',
      Legs: 'Legs', Shoulders: 'Shoulders', Arms: 'Arms', Abs: 'Abs',
    },
    ex_names: enExNames,
  },
  fr: {
    dashboard: 'Accueil', routines: 'Routines', history: 'Historique',
    weekly_goal: 'Objectif Hebdo', workouts_completed: 'séances terminées',
    total_workouts: 'Total Séances', total_sets: 'Total Séries', progress: 'Progrès',
    avg_duration: 'Durée Moy.', streak: 'Série', fav_exercise: 'Exercice Fav.',
    total_time: 'Temps Total', sessions_label: 'séances', weeks_label: 'sem',
    min_label: 'min', this_week: 'cette semaine',
    new_routine: 'Nouvelle Routine', create_routine: 'Créer une Routine',
    edit_routine: 'Modifier la Routine', start: 'Commencer', exercises: 'exercices',
    save_routine: 'Sauvegarder', name_placeholder: 'Nom (ex: Jour Jambes)',
    search_placeholder: 'Chercher exercice...', no_routines: 'Aucune routine',
    no_routines_hint: 'Créez votre première routine pour commencer.',
    selected: 'Sélectionnés', all: 'Tous', tab_exercises: 'Exercices',
    no_exercises_selected: 'Aucun exercice sélectionné',
    reorder_exercises: 'Réordonner', drag_to_reorder: 'Glisser pour réordonner',
    weight: 'Poids', reps: 'Reps', level: 'Niveau', time: 'Minutes',
    sets_completed: 'Séries Terminées', finish_workout: 'Terminer Séance',
    cancel_workout: 'Annuler la séance ?', cancel_msg: 'Les progrès actuels seront perdus.',
    add_exercise: 'Ajouter un Exercice', focus_mode: 'Mode Focus', last_set: 'Dernier:',
    new_pr: 'Nouveau Record !', set_deleted: 'Série supprimée',
    no_history: "Pas encore d'historique", delete_session: 'Supprimer séance ?',
    settings: 'Paramètres', language: 'Langue',
    data_management: 'Gestion des Données', export_data: 'Exporter',
    import_data: 'Importer',
    import_alert: "L'importation écrasera les données actuelles.",
    import_success: 'Données importées avec succès',
    import_error: "Erreur lors de l'importation",
    my_exercises: 'Mes Exercices', no_custom_exercises: 'Aucun exercice personnalisé',
    delete_exercise_warn: "Il sera supprimé des routines qui l'utilisent.",
    rest_timer: 'Repos', rest_timer_default: 'Minuteur de repos par défaut',
    skip: 'Passer', rest_done: 'Repos terminé !',
    exercise_buttons: "Boutons d'Exercice", btn_video: 'Vidéo',
    btn_image: 'Images', btn_anatomy: 'Muscles',
    routine_form_btns: 'Routines', workout_btns: 'Entraînement',
    delete_routine: 'Supprimer routine ?', delete_msg: 'Cette action est irréversible.',
    confirm: 'Confirmer', cancel: 'Annuler',
    goal_met_title: 'Objectif Atteint!', goal_met_desc: "Vous avez terminé vos jours d'entraînement.",
    watch_tutorial: 'Voir le tutoriel', view_images: 'Voir diagramme', view_anatomy: 'Voir anatomie',
    create_exercise: 'Créer exercice', new_exercise: 'Nouvel exercice',
    exercise_name_placeholder: "Nom de l'exercice", add: 'Ajouter',
    share_routine: 'Partager', scan_qr: 'Scanner QR', import: 'Importer',
    routine_qr_title: 'Code QR', import_routine: 'Importer Routine',
    import_confirm: 'Ajouter cette routine?', camera_error: 'Caméra inaccessible',
    view_front: 'Avant', view_back: 'Dos',
    primary_muscle: 'Principal', secondary_muscle: 'Secondaire',
    chart_volume: 'Volume', chart_duration: 'Durée', chart_sets: 'Séries',
    chart_freq: 'Fréquence', chart_muscle: 'Par Muscle',
    muscles: {
      Cardio: 'Cardio', Chest: 'Pectoraux', Back: 'Dos',
      Legs: 'Jambes', Shoulders: 'Épaules', Arms: 'Bras', Abs: 'Abdos',
    },
    ex_names: frExNames,
  },
};

/** Get translation for a key in the active language */
export function t(lang: Lang, key: keyof TranslationShape): string {
  return TRANSLATIONS[lang][key] as string;
}

/** Get exercise name in active language */
export function getExName(lang: Lang, id: string): string {
  return TRANSLATIONS[lang].ex_names[id] ?? id;
}

/** Get exercise name always in English (for YouTube/Google searches) */
export function getExNameEn(id: string): string {
  return TRANSLATIONS.en.ex_names[id] ?? id;
}

/** Get muscle group name in active language */
export function getMuscleName(lang: Lang, muscle: MuscleGroup): string {
  return TRANSLATIONS[lang].muscles[muscle] ?? muscle;
}
