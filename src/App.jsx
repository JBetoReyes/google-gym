import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  BarChart3, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  Play, 
  Activity,
  History,
  TrendingUp,
  Clock,
  Search,
  X,
  Check,
  Info,
  Trophy,
  Target,
  Settings,
  Minus,
  ChevronLeft,
  ChevronRight,
  Globe,
  Download,
  Upload,
  AlertTriangle,
  Youtube,
  Image,
  Camera,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

// --- SISTEMA DE TRADUCCIÓN ---
const TRANSLATIONS = {
  es: {
    dashboard: 'Inicio',
    routines: 'Rutinas',
    history: 'Historial',
    weekly_goal: 'Meta Semanal',
    workouts_completed: 'entrenamientos completados',
    total_workouts: 'Sesiones Totales',
    total_sets: 'Series Totales',
    progress: 'Progreso',
    new_routine: 'Nueva Rutina',
    create_routine: 'Crear Nueva Rutina',
    start: 'Empezar',
    exercises: 'ejercicios',
    save_routine: 'Guardar Rutina',
    name_placeholder: 'Nombre (ej: Día de Pierna)',
    search_placeholder: 'Buscar ejercicio...',
    weight: 'Peso',
    reps: 'Reps',
    level: 'Nivel',
    time: 'Minutos',
    sets_completed: 'Series Completadas',
    finish_workout: 'Finalizar Entrenamiento',
    cancel_workout: '¿Cancelar entrenamiento?',
    cancel_msg: 'Se perderá el progreso actual.',
    delete_routine: '¿Borrar rutina?',
    delete_session: '¿Borrar entrenamiento?',
    delete_msg: 'Esta acción no se puede deshacer.',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    no_history: 'No hay historial aún',
    settings: 'Configuración',
    language: 'Idioma',
    data_management: 'Gestión de Datos',
    export_data: 'Exportar Progreso',
    import_data: 'Importar Progreso',
    import_alert: 'Importar borrará los datos actuales. Asegúrate de tener respaldo.',
    goal_met_title: '¡Meta Cumplida!',
    goal_met_desc: 'Has completado tus días de entrenamiento.',
    watch_tutorial: 'Ver tutorial',
    view_images: 'Ver diagrama',
    view_anatomy: 'Ver anatomía',
    muscles: {
      Cardio: 'Cardio',
      Pecho: 'Pecho',
      Espalda: 'Espalda',
      Pierna: 'Pierna',
      Hombro: 'Hombro',
      Brazos: 'Brazos',
      Abs: 'Abs'
    },
    ex_names: {
      cinta: 'Cinta de Correr',
      eliptica: 'Elíptica',
      bici: 'Bici Estática',
      escaladora: 'Escalera Eléctrica',
      bp: 'Press de Banca',
      pi: 'Press Inclinado',
      ap: 'Aperturas Mancuernas',
      pecho_maq: 'Máquina de Pecho',
      pec_deck: 'Pec Deck (Mariposa)',
      fondos_maq: 'Fondos en Máquina',
      dom: 'Dominadas',
      dom_asist: 'Dominadas Asistidas',
      jal: 'Jalón al Pecho',
      rem: 'Remo con Barra',
      remo_t: 'Remo Barra T',
      remo_maq: 'Máquina de Remo',
      sen: 'Sentadilla',
      hack: 'Sentadilla Hack',
      pm: 'Peso Muerto',
      pren: 'Prensa',
      hip: 'Hip Thrust',
      ext: 'Extensión Cuádriceps',
      fem_tumb: 'Curl Femoral Tumbado',
      abduct: 'Máquina Abductores',
      adduct: 'Máquina Aductores',
      gem_maq: 'Máquina de Gemelos',
      pmil: 'Press Militar',
      elevl: 'Elevaciones Laterales',
      curlb: 'Curl Barra',
      curlm: 'Curl Martillo',
      pred_maq: 'Máquina Predicador',
      curl_conc: 'Curl Concentrado',
      polea: 'Tríceps Polea',
      tri_soga: 'Tríceps con Soga',
      tri_copa: 'Extensión Copa',
      plank: 'Plancha (Tiempo)',
      crunch: 'Crunch',
      // Pecho - nuevos
      press_mancuerna: 'Press Mancuernas Plano',
      press_mancuerna_incl: 'Press Mancuernas Inclinado',
      ap_incl: 'Aperturas Inclinadas',
      polea_cruce: 'Cruce de Poleas',
      polea_cruce_baja: 'Cruce Polea Baja',
      pullover_m: 'Pullover con Mancuerna',
      // Espalda - nuevos
      remo_m: 'Remo con Mancuerna',
      pull_polea: 'Pullover en Polea',
      polea_recta: 'Jalón Brazo Recto',
      face_pull: 'Face Pull',
      // Pierna - nuevos
      rdl_m: 'RDL con Mancuernas',
      zancada_m: 'Zancadas con Mancuernas',
      sen_goblet: 'Sentadilla Goblet',
      patada_polea: 'Patada Trasera Polea',
      pull_through: 'Pull-Through Polea',
      gem_m: 'Elevación de Talones con Mancuerna',
      // Hombro - nuevos
      pmil_m: 'Press Militar Mancuernas',
      arnold: 'Press Arnold',
      elevf: 'Elevaciones Frontales',
      elevl_polea: 'Elevaciones Laterales Polea',
      pajaro: 'Pájaro (Posterior)',
      polea_rear: 'Posterior en Polea',
      remo_verti: 'Remo al Mentón',
      // Brazos - nuevos
      curl_polea: 'Curl en Polea Baja',
      curl_incl: 'Curl Inclinado Mancuernas',
      curl_inv: 'Curl Inverso',
      tri_m: 'Extensión Tríceps Mancuerna',
      tri_polea_alta: 'Tríceps Polea Alta',
      // Abs - nuevos
      crunch_polea: 'Crunch en Polea',
      woodchop: 'Wood Chop',
      twist_ruso: 'Twist Ruso'
    }
  },
  en: {
    dashboard: 'Dashboard',
    routines: 'Routines',
    history: 'History',
    weekly_goal: 'Weekly Goal',
    workouts_completed: 'workouts completed',
    total_workouts: 'Total Workouts',
    total_sets: 'Total Sets',
    progress: 'Progress',
    new_routine: 'New Routine',
    create_routine: 'Create New Routine',
    start: 'Start',
    exercises: 'exercises',
    save_routine: 'Save Routine',
    name_placeholder: 'Name (e.g., Leg Day)',
    search_placeholder: 'Search exercise...',
    weight: 'Weight',
    reps: 'Reps',
    level: 'Level',
    time: 'Minutes',
    sets_completed: 'Sets Completed',
    finish_workout: 'Finish Workout',
    cancel_workout: 'Cancel workout?',
    cancel_msg: 'Current progress will be lost.',
    delete_routine: 'Delete routine?',
    delete_session: 'Delete training?',
    delete_msg: 'This action cannot be undone.',
    confirm: 'Confirm',
    cancel: 'Cancel',
    no_history: 'No history yet',
    settings: 'Settings',
    language: 'Language',
    data_management: 'Data Management',
    export_data: 'Export Data',
    import_data: 'Import Data',
    import_alert: 'Importing will overwrite current data. Make sure to backup.',
    goal_met_title: 'Goal Met!',
    goal_met_desc: 'You completed your training days.',
    watch_tutorial: 'Watch tutorial',
    view_images: 'View diagram',
    view_anatomy: 'View anatomy',
    muscles: {
      Cardio: 'Cardio',
      Pecho: 'Chest',
      Espalda: 'Back',
      Pierna: 'Legs',
      Hombro: 'Shoulders',
      Brazos: 'Arms',
      Abs: 'Abs'
    },
    ex_names: {
      cinta: 'Treadmill',
      eliptica: 'Elliptical',
      bici: 'Stationary Bike',
      escaladora: 'Stair Climber',
      bp: 'Bench Press',
      pi: 'Incline Press',
      ap: 'Dumbbell Flyes',
      pecho_maq: 'Chest Press Machine',
      pec_deck: 'Pec Deck',
      fondos_maq: 'Machine Dips',
      dom: 'Pull Ups',
      dom_asist: 'Assisted Pull-up',
      jal: 'Lat Pulldown',
      rem: 'Barbell Row',
      remo_t: 'T-Bar Row',
      remo_maq: 'Seated Row Machine',
      sen: 'Squat',
      hack: 'Hack Squat',
      pm: 'Deadlift',
      pren: 'Leg Press',
      hip: 'Hip Thrust',
      ext: 'Leg Extension',
      fem_tumb: 'Lying Leg Curl',
      abduct: 'Abductor Machine',
      adduct: 'Adductor Machine',
      gem_maq: 'Calf Raise Machine',
      pmil: 'Military Press',
      elevl: 'Lateral Raises',
      curlb: 'Barbell Curl',
      curlm: 'Hammer Curl',
      pred_maq: 'Preacher Curl Machine',
      curl_conc: 'Concentration Curl',
      polea: 'Cable Triceps',
      tri_soga: 'Triceps Rope Pushdown',
      tri_copa: 'Overhead Extension',
      plank: 'Plank',
      crunch: 'Crunch',
      // Chest - new
      press_mancuerna: 'Flat Dumbbell Press',
      press_mancuerna_incl: 'Incline Dumbbell Press',
      ap_incl: 'Incline Dumbbell Flyes',
      polea_cruce: 'Cable Crossover',
      polea_cruce_baja: 'Low Cable Fly',
      pullover_m: 'Dumbbell Pullover',
      // Back - new
      remo_m: 'Single-Arm Dumbbell Row',
      pull_polea: 'Cable Pullover',
      polea_recta: 'Straight-Arm Pulldown',
      face_pull: 'Face Pull',
      // Legs - new
      rdl_m: 'Dumbbell RDL',
      zancada_m: 'Dumbbell Lunges',
      sen_goblet: 'Goblet Squat',
      patada_polea: 'Cable Kickback',
      pull_through: 'Cable Pull-Through',
      gem_m: 'Single-Leg Calf Raise',
      // Shoulders - new
      pmil_m: 'Dumbbell Shoulder Press',
      arnold: 'Arnold Press',
      elevf: 'Front Raises',
      elevl_polea: 'Cable Lateral Raise',
      pajaro: 'Rear Delt Fly',
      polea_rear: 'Cable Rear Delt Fly',
      remo_verti: 'Upright Row',
      // Arms - new
      curl_polea: 'Cable Curl',
      curl_incl: 'Incline Dumbbell Curl',
      curl_inv: 'Reverse Curl',
      tri_m: 'Dumbbell Triceps Extension',
      tri_polea_alta: 'Cable Overhead Triceps',
      // Abs - new
      crunch_polea: 'Cable Crunch',
      woodchop: 'Wood Chop',
      twist_ruso: 'Russian Twist'
    }
  },
  fr: {
    dashboard: 'Accueil',
    routines: 'Routines',
    history: 'Historique',
    weekly_goal: 'Objectif Hebdo',
    workouts_completed: 'séances terminées',
    total_workouts: 'Total Séances',
    total_sets: 'Total Séries',
    progress: 'Progrès',
    new_routine: 'Nouvelle Routine',
    create_routine: 'Créer une Routine',
    start: 'Commencer',
    exercises: 'exercices',
    save_routine: 'Sauvegarder',
    name_placeholder: 'Nom (ex: Jour Jambes)',
    search_placeholder: 'Chercher exercice...',
    weight: 'Poids',
    reps: 'Reps',
    level: 'Niveau',
    time: 'Minutes',
    sets_completed: 'Séries Terminées',
    finish_workout: 'Terminer Séance',
    cancel_workout: 'Annuler la séance ?',
    cancel_msg: 'Les progrès actuels seront perdus.',
    delete_routine: 'Supprimer routine ?',
    delete_session: 'Supprimer séance ?',
    delete_msg: 'Cette action est irréversible.',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    no_history: 'Pas encore d\'historique',
    settings: 'Paramètres',
    language: 'Langue',
    data_management: 'Gestion des Données',
    export_data: 'Exporter',
    import_data: 'Importer',
    import_alert: 'L\'importation écrasera les données actuelles.',
    goal_met_title: 'Objectif Atteint!',
    goal_met_desc: 'Vous avez terminé vos jours d\'entraînement.',
    watch_tutorial: 'Voir le tutoriel',
    view_images: 'Voir diagramme',
    view_anatomy: 'Voir anatomie',
    muscles: {
      Cardio: 'Cardio',
      Pecho: 'Pectoraux',
      Espalda: 'Dos',
      Pierna: 'Jambes',
      Hombro: 'Épaules',
      Brazos: 'Bras',
      Abs: 'Abdos'
    },
    ex_names: {
      cinta: 'Tapis de course',
      eliptica: 'Vélo elliptique',
      bici: 'Vélo d\'appartement',
      escaladora: 'Escalier',
      bp: 'Développé couché',
      pi: 'Développé incliné',
      ap: 'Écartés',
      pecho_maq: 'Presse Pectoraux',
      pec_deck: 'Pec Deck',
      fondos_maq: 'Dips Machine',
      dom: 'Tractions',
      dom_asist: 'Tractions Assistées',
      jal: 'Tirage poitrine',
      rem: 'Rowing barre',
      remo_t: 'Rowing Barre T',
      remo_maq: 'Rowing Assis Machine',
      sen: 'Squat',
      hack: 'Squat Hack',
      pm: 'Soulevé de terre',
      pren: 'Presse à cuisses',
      hip: 'Hip Thrust',
      ext: 'Extension jambes',
      fem_tumb: 'Leg Curl Allongé',
      abduct: 'Machine Abducteurs',
      adduct: 'Machine Adducteurs',
      gem_maq: 'Extension Mollets',
      pmil: 'Développé militaire',
      elevl: 'Élévations latérales',
      curlb: 'Curl barre',
      curlm: 'Curl marteau',
      pred_maq: 'Curl Pupitre Machine',
      curl_conc: 'Curl Concentré',
      polea: 'Triceps poulie',
      tri_soga: 'Triceps Corde',
      tri_copa: 'Extension Verticale',
      plank: 'Gainage',
      crunch: 'Crunch',
      // Pectoraux - nouveaux
      press_mancuerna: 'Développé couché haltères',
      press_mancuerna_incl: 'Développé incliné haltères',
      ap_incl: 'Écartés inclinés',
      polea_cruce: 'Croisé poulie',
      polea_cruce_baja: 'Croisé poulie basse',
      pullover_m: 'Pullover haltère',
      // Dos - nouveaux
      remo_m: 'Rowing haltère unilatéral',
      pull_polea: 'Pullover poulie',
      polea_recta: 'Tirage bras tendus',
      face_pull: 'Face Pull',
      // Jambes - nouveaux
      rdl_m: 'Soulevé roumain haltères',
      zancada_m: 'Fentes haltères',
      sen_goblet: 'Squat goblet',
      patada_polea: 'Kickback poulie',
      pull_through: 'Pull-Through poulie',
      gem_m: 'Élévation mollets haltère',
      // Épaules - nouveaux
      pmil_m: 'Développé épaules haltères',
      arnold: 'Press Arnold',
      elevf: 'Élévations frontales',
      elevl_polea: 'Élévations latérales poulie',
      pajaro: 'Oiseau (deltoïde post.)',
      polea_rear: 'Poulie deltoïde postérieur',
      remo_verti: 'Rowing menton',
      // Bras - nouveaux
      curl_polea: 'Curl poulie basse',
      curl_incl: 'Curl incliné haltères',
      curl_inv: 'Curl inversé',
      tri_m: 'Extension triceps haltère',
      tri_polea_alta: 'Triceps poulie haute',
      // Abdos - nouveaux
      crunch_polea: 'Crunch poulie',
      woodchop: 'Wood Chop',
      twist_ruso: 'Rotation russe'
    }
  }
};

// --- Componentes UI Básicos ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, ...props }) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 shadow-lg",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400",
    success: "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-900/20",
    ghost: "bg-transparent hover:bg-slate-700 text-slate-400 hover:text-white",
    icon: "p-2 aspect-square rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
  };

  const variantStyle = variants[variant] || variants.primary;

  return (
    <button onClick={onClick} className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

// --- Modal de Confirmación Genérico ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, t }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-sm p-6 bg-slate-900 border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-500/10 rounded-full text-red-500">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="secondary" className="flex-1">{t('cancel')}</Button>
          <Button onClick={onConfirm} variant="danger" className="flex-1">{t('confirm')}</Button>
        </div>
      </Card>
    </div>
  );
};

// --- Modal de Celebración ---
const CelebrationModal = ({ achievements, onClose, t }) => {
  if (!achievements || achievements.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl shadow-purple-500/20">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Trophy size={64} className="text-yellow-400 animate-bounce" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
          {achievements[0].title}
        </h2>
        <div className="space-y-3 mb-8">
          {achievements.map((ach, i) => (
            <div key={i} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom fade-in duration-500" style={{animationDelay: `${i * 150}ms`}}>
              <div className={`p-2 rounded-full ${ach.type === 'goal' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {ach.type === 'goal' ? <Target size={20} /> : <TrendingUp size={20} />}
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 border-none">
          OK
        </Button>
      </div>
    </div>
  );
};

// --- Iconos Musculares Personalizados (SVG Inline) ---
const MuscleIcon = ({ muscle, className = "w-5 h-5" }) => {
  const getColor = (m) => {
    switch(m) {
      case 'Pecho': return 'text-red-400';
      case 'Espalda': return 'text-blue-400';
      case 'Pierna': return 'text-orange-400';
      case 'Hombro': return 'text-yellow-400';
      case 'Brazos': return 'text-purple-400';
      case 'Abs': return 'text-emerald-400';
      case 'Cardio': return 'text-pink-500';
      default: return 'text-slate-400';
    }
  };

  const colorClass = getColor(muscle);
  const paths = {
    Pecho: <path d="M4 7c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7zm3 6h10v4H7v-4z" />,
    Espalda: <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.8l5 3.1v6.2l-5 3.1-5-3.1V7.9l5-3.1z" />,
    Pierna: <path d="M7 2v10l-2 10h3l2-10 2 10h3l-2-10V2H7z" />,
    Hombro: <path d="M2 8a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v3h-4V8H6v3H2V8z" />,
    Brazos: <path d="M18 10a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4h3v4h6v-4h3v-4z" />,
    Abs: <path d="M7 4h10v3H7V4zm0 5h10v3H7V9zm0 5h10v3H7v-3z" />,
    Cardio: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /> 
  };

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} ${colorClass}`} xmlns="http://www.w3.org/2000/svg">
      {paths[muscle] || <circle cx="12" cy="12" r="10" />}
    </svg>
  );
};

// --- Base de Datos de Ejercicios ---
const EXERCISE_CATALOG = [
  // Cardio
  { id: 'cinta', name: 'Cinta de Correr', muscle: 'Cardio' },
  { id: 'eliptica', name: 'Elíptica', muscle: 'Cardio' },
  { id: 'bici', name: 'Bici Estática', muscle: 'Cardio' },
  { id: 'escaladora', name: 'Escalera Eléctrica', muscle: 'Cardio' },
  // Pecho
  { id: 'bp', name: 'Press de Banca', muscle: 'Pecho' },
  { id: 'pi', name: 'Press Inclinado', muscle: 'Pecho' },
  { id: 'press_mancuerna', name: 'Press Mancuernas Plano', muscle: 'Pecho' },
  { id: 'press_mancuerna_incl', name: 'Press Mancuernas Inclinado', muscle: 'Pecho' },
  { id: 'ap', name: 'Aperturas', muscle: 'Pecho' },
  { id: 'ap_incl', name: 'Aperturas Inclinadas', muscle: 'Pecho' },
  { id: 'polea_cruce', name: 'Cruce de Poleas', muscle: 'Pecho' },
  { id: 'polea_cruce_baja', name: 'Cruce Polea Baja', muscle: 'Pecho' },
  { id: 'pullover_m', name: 'Pullover con Mancuerna', muscle: 'Pecho' },
  { id: 'pecho_maq', name: 'Máquina de Pecho', muscle: 'Pecho' },
  { id: 'pec_deck', name: 'Pec Deck', muscle: 'Pecho' },
  { id: 'fondos_maq', name: 'Fondos en Máquina', muscle: 'Pecho' },
  // Espalda
  { id: 'dom', name: 'Dominadas', muscle: 'Espalda' },
  { id: 'dom_asist', name: 'Dominadas Asistidas', muscle: 'Espalda' },
  { id: 'jal', name: 'Jalón al Pecho', muscle: 'Espalda' },
  { id: 'polea_recta', name: 'Jalón Brazo Recto', muscle: 'Espalda' },
  { id: 'pull_polea', name: 'Pullover en Polea', muscle: 'Espalda' },
  { id: 'face_pull', name: 'Face Pull', muscle: 'Espalda' },
  { id: 'rem', name: 'Remo con Barra', muscle: 'Espalda' },
  { id: 'remo_t', name: 'Remo Barra T', muscle: 'Espalda' },
  { id: 'remo_m', name: 'Remo con Mancuerna', muscle: 'Espalda' },
  { id: 'remo_maq', name: 'Máquina de Remo', muscle: 'Espalda' },
  // Pierna
  { id: 'sen', name: 'Sentadilla', muscle: 'Pierna' },
  { id: 'sen_goblet', name: 'Sentadilla Goblet', muscle: 'Pierna' },
  { id: 'hack', name: 'Sentadilla Hack', muscle: 'Pierna' },
  { id: 'pm', name: 'Peso Muerto', muscle: 'Pierna' },
  { id: 'rdl_m', name: 'RDL con Mancuernas', muscle: 'Pierna' },
  { id: 'pren', name: 'Prensa', muscle: 'Pierna' },
  { id: 'hip', name: 'Hip Thrust', muscle: 'Pierna' },
  { id: 'pull_through', name: 'Pull-Through Polea', muscle: 'Pierna' },
  { id: 'zancada_m', name: 'Zancadas con Mancuernas', muscle: 'Pierna' },
  { id: 'ext', name: 'Extensión Cuádriceps', muscle: 'Pierna' },
  { id: 'fem_tumb', name: 'Curl Femoral Tumbado', muscle: 'Pierna' },
  { id: 'patada_polea', name: 'Patada Trasera Polea', muscle: 'Pierna' },
  { id: 'abduct', name: 'Máquina Abductores', muscle: 'Pierna' },
  { id: 'adduct', name: 'Máquina Aductores', muscle: 'Pierna' },
  { id: 'gem_maq', name: 'Máquina de Gemelos', muscle: 'Pierna' },
  { id: 'gem_m', name: 'Elevación de Talones con Mancuerna', muscle: 'Pierna' },
  // Hombro
  { id: 'pmil', name: 'Press Militar', muscle: 'Hombro' },
  { id: 'pmil_m', name: 'Press Militar Mancuernas', muscle: 'Hombro' },
  { id: 'arnold', name: 'Press Arnold', muscle: 'Hombro' },
  { id: 'elevl', name: 'Elevaciones Laterales', muscle: 'Hombro' },
  { id: 'elevl_polea', name: 'Elevaciones Laterales Polea', muscle: 'Hombro' },
  { id: 'elevf', name: 'Elevaciones Frontales', muscle: 'Hombro' },
  { id: 'pajaro', name: 'Pájaro (Posterior)', muscle: 'Hombro' },
  { id: 'polea_rear', name: 'Posterior en Polea', muscle: 'Hombro' },
  { id: 'remo_verti', name: 'Remo al Mentón', muscle: 'Hombro' },
  // Brazos
  { id: 'curlb', name: 'Curl Barra', muscle: 'Brazos' },
  { id: 'curlm', name: 'Curl Martillo', muscle: 'Brazos' },
  { id: 'curl_incl', name: 'Curl Inclinado Mancuernas', muscle: 'Brazos' },
  { id: 'curl_polea', name: 'Curl en Polea Baja', muscle: 'Brazos' },
  { id: 'curl_inv', name: 'Curl Inverso', muscle: 'Brazos' },
  { id: 'pred_maq', name: 'Máquina Predicador', muscle: 'Brazos' },
  { id: 'curl_conc', name: 'Curl Concentrado', muscle: 'Brazos' },
  { id: 'polea', name: 'Tríceps Polea', muscle: 'Brazos' },
  { id: 'tri_soga', name: 'Tríceps con Soga', muscle: 'Brazos' },
  { id: 'tri_copa', name: 'Extensión Copa', muscle: 'Brazos' },
  { id: 'tri_m', name: 'Extensión Tríceps Mancuerna', muscle: 'Brazos' },
  { id: 'tri_polea_alta', name: 'Tríceps Polea Alta', muscle: 'Brazos' },
  // Abs
  { id: 'plank', name: 'Plancha (Tiempo)', muscle: 'Abs' },
  { id: 'crunch', name: 'Crunch', muscle: 'Abs' },
  { id: 'crunch_polea', name: 'Crunch en Polea', muscle: 'Abs' },
  { id: 'woodchop', name: 'Wood Chop', muscle: 'Abs' },
  { id: 'twist_ruso', name: 'Twist Ruso', muscle: 'Abs' },
];

const INITIAL_ROUTINES = [
  {
    id: 'r1',
    name: 'Full Body',
    exercises: ['sen', 'bp', 'rem', 'pmil', 'cinta']
  },
  {
    id: 'r2',
    name: 'Cardio & Abs',
    exercises: ['cinta', 'eliptica', 'crunch', 'plank']
  }
];

// --- Diagrama Corporal SVG ---
const BodyDiagramSVG = ({ muscle, color }) => {
  const dim = '#334155';
  const head = '#475569';

  const activeRegions = {
    Pecho:   ['chest-l', 'chest-r'],
    Espalda: ['back-l', 'back-r'],
    Pierna:  ['thigh-l', 'thigh-r', 'calf-l', 'calf-r'],
    Hombro:  ['sh-l', 'sh-r'],
    Brazos:  ['arm-l', 'arm-r', 'fore-l', 'fore-r'],
    Abs:     ['abs'],
    Cardio:  ['chest-l', 'chest-r', 'abs', 'thigh-l', 'thigh-r'],
  }[muscle] || [];

  const c = (id) => activeRegions.includes(id) ? color : dim;
  const o = (id) => activeRegions.includes(id) ? 1 : 0.3;
  const glow = (id) => activeRegions.includes(id) ? 'url(#glow)' : undefined;
  const isBack = muscle === 'Espalda';

  return (
    <svg width="140" height="290" viewBox="0 0 140 290" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Head */}
      <ellipse cx="70" cy="22" rx="18" ry="20" fill={head} opacity="0.6"/>
      <rect x="64" y="40" width="12" height="10" rx="4" fill={head} opacity="0.5"/>

      {/* Shoulders */}
      <ellipse cx="32" cy="68" rx="22" ry="13" fill={c('sh-l')} opacity={o('sh-l')} filter={glow('sh-l')}/>
      <ellipse cx="108" cy="68" rx="22" ry="13" fill={c('sh-r')} opacity={o('sh-r')} filter={glow('sh-r')}/>

      {/* Chest / Back */}
      {isBack ? (
        <>
          <path d="M37 57 Q70 52 103 57 L100 98 Q70 104 40 98 Z"
            fill="none" stroke={color} strokeWidth="3" strokeDasharray="6 3" opacity="0.4"/>
          <path d="M37 57 Q70 52 103 57 L100 98 Q70 104 40 98 Z"
            fill={c('back-l')} opacity={o('back-l') * 0.6} filter={glow('back-l')}/>
          <path d="M37 57 Q70 52 103 57 L100 98 Q70 104 40 98 Z"
            fill={c('back-r')} opacity={o('back-r') * 0.6} filter={glow('back-r')}/>
          {/* Lat lines */}
          <path d="M40 62 Q55 85 45 100" stroke={color} strokeWidth="2.5" fill="none" opacity="0.9" filter={glow('back-l')}/>
          <path d="M100 62 Q85 85 95 100" stroke={color} strokeWidth="2.5" fill="none" opacity="0.9" filter={glow('back-r')}/>
        </>
      ) : (
        <>
          <path d="M38 57 Q70 52 102 57 L99 98 Q70 104 41 98 Z"
            fill={c('chest-l')} opacity={o('chest-l')} filter={glow('chest-l')}/>
        </>
      )}

      {/* Abs */}
      <rect x="43" y="100" width="54" height="52" rx="10" fill={c('abs')} opacity={o('abs')} filter={glow('abs')}/>
      {activeRegions.includes('abs') && (
        <>
          <line x1="70" y1="100" x2="70" y2="152" stroke="#000" strokeWidth="1.5" opacity="0.3"/>
          <line x1="43" y1="118" x2="97" y2="118" stroke="#000" strokeWidth="1" opacity="0.2"/>
          <line x1="43" y1="134" x2="97" y2="134" stroke="#000" strokeWidth="1" opacity="0.2"/>
        </>
      )}

      {/* Hips */}
      <ellipse cx="70" cy="157" rx="35" ry="12" fill={dim} opacity="0.25"/>

      {/* Upper arms */}
      <rect x="11" y="60" width="19" height="60" rx="9.5" fill={c('arm-l')} opacity={o('arm-l')} filter={glow('arm-l')}/>
      <rect x="110" y="60" width="19" height="60" rx="9.5" fill={c('arm-r')} opacity={o('arm-r')} filter={glow('arm-r')}/>

      {/* Forearms */}
      <rect x="9" y="122" width="17" height="48" rx="8.5" fill={c('fore-l')} opacity={o('fore-l') * 0.85} filter={glow('fore-l')}/>
      <rect x="114" y="122" width="17" height="48" rx="8.5" fill={c('fore-r')} opacity={o('fore-r') * 0.85} filter={glow('fore-r')}/>

      {/* Thighs */}
      <rect x="37" y="166" width="27" height="68" rx="13.5" fill={c('thigh-l')} opacity={o('thigh-l')} filter={glow('thigh-l')}/>
      <rect x="76" y="166" width="27" height="68" rx="13.5" fill={c('thigh-r')} opacity={o('thigh-r')} filter={glow('thigh-r')}/>

      {/* Calves */}
      <rect x="39" y="237" width="23" height="43" rx="11.5" fill={c('calf-l')} opacity={o('calf-l') * 0.85} filter={glow('calf-l')}/>
      <rect x="78" y="237" width="23" height="43" rx="11.5" fill={c('calf-r')} opacity={o('calf-r') * 0.85} filter={glow('calf-r')}/>
    </svg>
  );
};

// --- Modal de Anatomía ---
const AnatomyModal = ({ exerciseId, onClose, t, getExName, getMuscleName }) => {
  if (!exerciseId) return null;

  let exInfo = EXERCISE_CATALOG.find(e => e.id === exerciseId);
  if (!exInfo) exInfo = EXERCISE_CATALOG.find(e => e.name === exerciseId);
  const muscle = exInfo?.muscle || 'Cardio';
  const exName = getExName(exerciseId);

  const muscleColor = {
    Pecho: '#ef4444', Espalda: '#3b82f6', Pierna: '#f97316',
    Hombro: '#eab308', Brazos: '#a855f7', Abs: '#10b981', Cardio: '#ec4899'
  }[muscle] || '#64748b';

  const isBack = muscle === 'Espalda';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 pb-3">
          <div className="absolute top-0 left-0 right-0 h-1" style={{background: `linear-gradient(to right, ${muscleColor}, ${muscleColor}88)`}}/>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
          <div className="flex items-center gap-3 mt-1">
            <div className="p-2.5 rounded-xl" style={{backgroundColor: `${muscleColor}20`}}>
              <MuscleIcon muscle={muscle} className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg leading-tight">{exName}</h3>
              <p className="text-sm font-bold" style={{color: muscleColor}}>{getMuscleName(muscle)}</p>
            </div>
          </div>
        </div>

        {/* Diagram */}
        <div className="flex justify-center items-center py-4 bg-slate-950/40">
          <BodyDiagramSVG muscle={muscle} color={muscleColor} />
        </div>

        {/* Footer label */}
        <div className="px-5 py-3 text-center">
          <p className="text-xs text-slate-500 font-medium">
            {isBack ? '← Back muscles targeted' : 'Front view · highlighted muscle group'}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Routine Creation Form (module-level so its reference is stable across App re-renders) ---
const RoutineCreationForm = ({ t, getExName, getExNameEn, getMuscleName, openVideoSearch, openImageSearch, onOpenAnatomy, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSelection = (exId) => {
    setSelectedExercises(prev => prev.includes(exId) ? prev.filter(e => e !== exId) : [...prev, exId]);
  };

  const filteredExercises = EXERCISE_CATALOG.filter(ex => {
    const exName = t('ex_names')[ex.id] || ex.name;
    const muscle = t('muscles')[ex.muscle] || ex.muscle;
    return exName.toLowerCase().includes(searchTerm.toLowerCase()) || muscle.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in slide-in-from-right">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full"><ChevronLeft /></button>
          <h3 className="text-xl font-bold text-white">{t('new_routine')}</h3>
        </div>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none mb-4 font-bold"
          placeholder={t('name_placeholder')}
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white outline-none text-sm"
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {filteredExercises.map(ex => {
          const isSelected = selectedExercises.includes(ex.id);
          return (
            <div
              key={ex.id}
              onClick={() => toggleSelection(ex.id)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected ? 'bg-blue-900/40 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  <MuscleIcon muscle={ex.muscle} className="w-6 h-6" />
                </div>
                <div>
                  <p className={`font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{getExName(ex.id)}</p>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">{getMuscleName(ex.muscle)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => openVideoSearch(e, getExName(ex.id))}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-slate-700/50 rounded-full transition-colors active:scale-95"
                  title={t('watch_tutorial')}
                >
                  <Youtube size={22} />
                </button>
                <button
                  onClick={(e) => openImageSearch(e, getExNameEn(ex.id))}
                  className="p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-full transition-colors active:scale-95"
                  title={t('view_images')}
                >
                  <Image size={22} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenAnatomy(ex.id); }}
                  className="p-3 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded-full transition-colors active:scale-95"
                  title={t('view_anatomy')}
                >
                  <Camera size={22} />
                </button>
                {isSelected && <div className="bg-blue-500 rounded-full p-1 ml-1"><Check size={14} className="text-white" /></div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 mt-auto border-t border-slate-800">
        <Button className="w-full py-4 text-lg" onClick={() => onSave(name, selectedExercises)} disabled={!name || selectedExercises.length === 0}>
          {t('save_routine')} ({selectedExercises.length})
        </Button>
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('gym_lang') || 'es');
  const t = (key) => TRANSLATIONS[lang][key] || key;
  
  // Helper para traducir nombre de ejercicio
  const getExName = (idOrName) => {
    const entry = EXERCISE_CATALOG.find(e => e.id === idOrName || e.name === idOrName);
    if (entry) return TRANSLATIONS[lang].ex_names[entry.id] || entry.name;
    return idOrName;
  };
  const getExNameEn = (idOrName) => {
    const entry = EXERCISE_CATALOG.find(e => e.id === idOrName || e.name === idOrName);
    if (entry) return TRANSLATIONS.en.ex_names[entry.id] || entry.name;
    return idOrName;
  };

  const getMuscleName = (muscleKey) => TRANSLATIONS[lang].muscles[muscleKey] || muscleKey;
  
  const openVideoSearch = (e, exName) => {
    e.stopPropagation();
    const query = encodeURIComponent(`how to do ${exName} exercise`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  const openImageSearch = (e, exName) => {
    e.stopPropagation();
    const query = encodeURIComponent(`${exName} exercise outline diagram line drawing`);
    window.open(`https://www.google.com/search?tbm=isch&q=${query}&tbs=itp:lineart`, '_blank');
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [routines, setRoutines] = useState(() => {
    const saved = localStorage.getItem('gym_routines');
    return saved ? JSON.parse(saved) : INITIAL_ROUTINES;
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('gym_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const saved = localStorage.getItem('gym_weekly_goal');
    return saved ? parseInt(saved) : 4;
  });
  
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [anatomyExercise, setAnatomyExercise] = useState(null);

  // Controls whether the creation form is shown (in App so it survives anatomy modal re-renders)
  const [isCreating, setIsCreating] = useState(false);

  // ActiveWorkoutView state lifted to avoid remount when App re-renders
  const [workoutSelectedExercise, setWorkoutSelectedExercise] = useState(null);
  
  // Estado para el modal de confirmación
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  const fileInputRef = useRef(null);
  
  useEffect(() => { localStorage.setItem('gym_routines', JSON.stringify(routines)); }, [routines]);
  useEffect(() => { localStorage.setItem('gym_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('gym_weekly_goal', weeklyGoal.toString()); }, [weeklyGoal]);
  useEffect(() => { localStorage.setItem('gym_lang', lang); }, [lang]);

  // --- Wrapper para Confirmaciones ---
  const triggerConfirm = (title, message, action) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- Import/Export ---
  const handleExport = () => {
    const dataStr = JSON.stringify({ routines, history, weeklyGoal });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'gymtracker_backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.routines) setRoutines(data.routines);
        if (data.history) setHistory(data.history);
        if (data.weeklyGoal) setWeeklyGoal(data.weeklyGoal);
        setShowSettings(false);
        alert('Datos importados correctamente.');
      } catch (err) {
        alert('Error al importar archivo.');
      }
    };
    reader.readAsText(file);
  };

  // --- Lógica de Stats ---
  const stats = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); 
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0,0,0,0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }

    const startOfWeek = weekDays[0].getTime();
    const endOfWeek = new Date(weekDays[6]).setHours(23,59,59,999);
    
    const thisWeekSessions = history.filter(s => {
      const sDate = new Date(s.date).getTime();
      return sDate >= startOfWeek && sDate <= endOfWeek;
    });

    const uniqueDaysSet = new Set(thisWeekSessions.map(s => new Date(s.date).toDateString()));
    const uniqueDaysCount = uniqueDaysSet.size;

    const totalWorkouts = history.length;
    const totalSets = history.reduce((acc, session) => {
      let sets = 0;
      Object.values(session.logs).forEach(exLogs => sets += exLogs.length);
      return acc + sets;
    }, 0);

    const volumeData = history.slice(-7).map(session => {
       let volume = 0;
       Object.entries(session.logs).forEach(([exId, exLogs]) => {
         let catInfo = EXERCISE_CATALOG.find(c => c.id === exId);
         if (!catInfo) catInfo = EXERCISE_CATALOG.find(c => c.name === exId); 

         if (catInfo && catInfo.muscle === 'Cardio') return;
         exLogs.forEach(set => volume += (parseFloat(set.weight) * parseFloat(set.reps)));
       });
       return {
         date: new Date(session.date).toLocaleDateString(lang === 'es' ? 'es-MX' : lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric' }),
         volumen: Math.round(volume),
         name: session.routineName
       };
    });

    return { totalWorkouts, totalSets, volumeData, uniqueDaysCount, weekDays, uniqueDaysSet };
  }, [history, lang]);

  const handleStartWorkout = (routine) => {
    setActiveWorkout({
      routineId: routine.id,
      routineName: routine.name,
      startTime: new Date().toISOString(),
      logs: {},
      currentExerciseIndex: 0
    });
    setWorkoutSelectedExercise(routine.exercises[0]);
    setActiveTab('workout');
  };

  const handleFinishWorkout = () => {
    if (!activeWorkout) return;
    const newSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      routineName: activeWorkout.routineName,
      duration: Math.round((new Date() - new Date(activeWorkout.startTime)) / 60000), 
      logs: activeWorkout.logs
    };
    
    const prevUniqueDays = stats.uniqueDaysSet.size;
    const isNewDay = !stats.uniqueDaysSet.has(new Date().toDateString());
    if (isNewDay && (prevUniqueDays + 1) === weeklyGoal) {
       setAchievements([{type: 'goal', title: t('goal_met_title'), desc: t('goal_met_desc')}]);
    }

    setHistory([newSession, ...history]);
    setActiveWorkout(null);
    setWorkoutSelectedExercise(null);
    setActiveTab('dashboard');
  };

  const handleCancelWorkout = () => {
    triggerConfirm(t('cancel_workout'), t('cancel_msg'), () => {
      setActiveWorkout(null);
      setWorkoutSelectedExercise(null);
      setActiveTab('routines');
    });
  };

  const logSet = (exerciseId, weight, reps) => {
    setActiveWorkout(prev => {
      const currentLogs = prev.logs[exerciseId] || [];
      return { ...prev, logs: { ...prev.logs, [exerciseId]: [...currentLogs, { weight, reps }] } };
    });
  };

  const deleteSet = (exerciseId, index) => {
    setActiveWorkout(prev => {
      const currentLogs = prev.logs[exerciseId] || [];
      const newLogs = currentLogs.filter((_, i) => i !== index);
      return { ...prev, logs: { ...prev.logs, [exerciseId]: newLogs } };
    });
  };

  const addNewRoutine = (name, exercises) => {
    if (!name || exercises.length === 0) return;
    setRoutines([...routines, { id: Date.now().toString(), name, exercises }]);
  };

  const deleteRoutine = (id) => {
     triggerConfirm(t('delete_routine'), t('delete_msg'), () => {
        setRoutines(prev => prev.filter(r => r.id !== id));
     });
  };

  const deleteSession = (id) => {
    triggerConfirm(t('delete_session'), t('delete_msg'), () => {
      setHistory(prev => prev.filter(s => s.id !== id));
    });
  };

  // --- Settings Modal ---
  const SettingsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-md p-6 bg-slate-900 border border-slate-700 relative">
        <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="text-blue-400" /> {t('settings')}
        </h2>

        {/* Idioma */}
        <div className="mb-6">
          <label className="text-sm font-bold text-slate-400 uppercase mb-3 block">{t('language')}</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { code: 'es', label: 'Español', flag: '🇪🇸' },
              { code: 'en', label: 'English', flag: '🇺🇸' },
              { code: 'fr', label: 'Français', flag: '🇫🇷' }
            ].map(l => (
              <button 
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${lang === l.code ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
              >
                <span className="text-2xl">{l.flag}</span>
                <span className="text-xs font-bold">{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Datos */}
        <div>
          <label className="text-sm font-bold text-slate-400 uppercase mb-3 block">{t('data_management')}</label>
          <div className="space-y-3">
            <Button onClick={handleExport} variant="secondary" className="w-full justify-start" icon={Download}>
              {t('export_data')}
            </Button>
            
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden" 
                accept=".json"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full justify-start" icon={Upload}>
                {t('import_data')}
              </Button>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg text-yellow-500 text-xs">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p>{t('import_alert')}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // --- VISTAS ---

  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-end">
        <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </div>

      <Card className="p-6 border border-slate-700 bg-slate-800/80 backdrop-blur">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="text-blue-400" size={24} />
              <h3 className="text-xl font-bold text-white">{t('weekly_goal')}</h3>
            </div>
            <p className="text-slate-400 text-sm">
              {stats.uniqueDaysCount} / {weeklyGoal} {t('workouts_completed')}
            </p>
          </div>
          
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700">
            <button onClick={() => setWeeklyGoal(Math.max(1, weeklyGoal - 1))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors active:scale-90">
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-bold text-white">{weeklyGoal}</span>
            <button onClick={() => setWeeklyGoal(Math.min(7, weeklyGoal + 1))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors active:scale-90">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="w-full bg-slate-700/50 h-3 rounded-full overflow-hidden mb-6 border border-slate-700">
          <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min((stats.uniqueDaysCount / weeklyGoal) * 100, 100)}%` }} />
        </div>

        <div className="flex justify-between items-center px-1">
          {stats.weekDays.map((date, idx) => {
            const dayNames = lang === 'es' ? ['D','L','M','M','J','V','S'] : lang === 'fr' ? ['D','L','M','M','J','V','S'] : ['S','M','T','W','T','F','S'];
            const dayLetter = dayNames[date.getDay()];
            const dayNumber = date.getDate();
            const isToday = new Date().toDateString() === date.toDateString();
            const isDone = stats.uniqueDaysSet.has(date.toDateString());

            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{dayLetter}</span>
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                  ${isDone ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : isToday ? 'bg-transparent border-blue-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-600'}
                `}>
                  {dayNumber}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Activity size={18} />
            <span className="text-xs font-bold uppercase">{t('total_workouts')}</span>
          </div>
          <p className="text-3xl font-black text-white">{stats.totalWorkouts}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Dumbbell size={18} />
            <span className="text-xs font-bold uppercase">{t('total_sets')}</span>
          </div>
          <p className="text-3xl font-black text-white">{stats.totalSets}</p>
        </Card>
      </div>
      
      <Card className="p-5">
        <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
           <TrendingUp className="text-emerald-400" size={20}/> {t('progress')}
        </h3>
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Line type="monotone" dataKey="volumen" stroke="#3b82f6" strokeWidth={3} dot={{r:3}} />
              </LineChart>
            </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );

  const RoutinesView = () => {
    return (
      <div className="space-y-4 animate-in fade-in">
        <Button onClick={() => setIsCreating(true)} className="w-full py-4 border-2 border-dashed border-slate-700 bg-transparent hover:bg-slate-800 text-slate-400" icon={Plus}>
          {t('create_routine')}
        </Button>
        {routines.map(routine => (
          <Card key={routine.id} className="p-5 group hover:border-slate-600 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-xl text-white mb-1">{routine.name}</h3>
                <p className="text-slate-400 text-sm">{routine.exercises.length} {t('exercises')}</p>
              </div>
              <button onClick={() => deleteRoutine(routine.id)} className="text-slate-600 hover:text-red-400 p-2"><Trash2 size={18} /></button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {routine.exercises.slice(0, 3).map((ex, i) => (
                <span key={i} className="text-xs bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
                  {getExName(ex)}
                </span>
              ))}
              {routine.exercises.length > 3 && <span className="text-xs text-slate-500 py-1">+{routine.exercises.length - 3}</span>}
            </div>
            <Button variant="success" className="w-full font-bold" icon={Play} onClick={() => handleStartWorkout(routine)}>
              {t('start')}
            </Button>
          </Card>
        ))}
      </div>
    );
  };

  const ActiveWorkoutView = () => {
    if (!activeWorkout) return null;
    const routine = routines.find(r => r.id === activeWorkout.routineId) || { exercises: [] };
    const selectedExercise = workoutSelectedExercise ?? routine.exercises[0];
    const setSelectedExercise = setWorkoutSelectedExercise;
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');

    useEffect(() => {
      const logs = activeWorkout.logs[selectedExercise];
      if (logs?.length) {
        setWeight(logs[logs.length-1].weight);
        setReps(logs[logs.length-1].reps);
      } else {
        const hist = history.find(h => h.logs[selectedExercise]?.length);
        if(hist) {
           const last = hist.logs[selectedExercise][hist.logs[selectedExercise].length-1];
           setWeight(last.weight);
           setReps(last.reps);
        } else {
           setWeight(''); setReps('');
        }
      }
    }, [selectedExercise]);

    const handleAdd = (e) => {
      e.preventDefault();
      if(!weight || !reps) return;
      logSet(selectedExercise, weight, reps);
    };

    // Resolver info del ejercicio (manejando IDs o Nombres legacy)
    let exInfo = EXERCISE_CATALOG.find(e => e.id === selectedExercise);
    if (!exInfo) exInfo = EXERCISE_CATALOG.find(e => e.name === selectedExercise);

    const isCardio = exInfo?.muscle === 'Cardio';

    return (
      <div className="flex flex-col h-full animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center mb-4 bg-slate-900/50 p-2 rounded-xl backdrop-blur shrink-0">
          <div className="flex items-center gap-2 px-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-sm font-bold text-white">{activeWorkout.routineName}</span>
          </div>
          <button onClick={handleCancelWorkout} className="p-2 text-slate-400 hover:text-red-400"><X size={20}/></button>
        </div>

        <div className="flex overflow-x-auto pb-3 gap-2 mb-3 scrollbar-hide shrink-0">
          {routine.exercises.map(ex => {
            const active = selectedExercise === ex;
            const count = (activeWorkout.logs[ex] || []).length;
            // Buscar info para el icono
            let info = EXERCISE_CATALOG.find(e => e.id === ex);
            if (!info) info = EXERCISE_CATALOG.find(e => e.name === ex);

            return (
              <button key={ex} onClick={() => setSelectedExercise(ex)} 
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border
                  ${active ? 'bg-slate-100 text-slate-900 border-white shadow-lg shadow-white/10 scale-105' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
                `}
              >
                {info && <MuscleIcon muscle={info.muscle} className="w-4 h-4" />}
                {getExName(ex)}
                {count > 0 && <span className="bg-emerald-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{count}</span>}
              </button>
            )
          })}
        </div>

        <Card className="p-5 mb-4 border border-slate-700 bg-slate-800 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          {/* Header con Nombre y Botones de Ayuda */}
          <div className="flex items-center justify-between mb-5 gap-3">
            <h2 className="text-xl font-black text-white tracking-tight leading-tight flex-1 min-w-0 truncate">
              {getExName(selectedExercise)}
            </h2>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={(e) => openVideoSearch(e, getExName(selectedExercise))}
                className="text-white bg-red-600 hover:bg-red-500 p-2 rounded-full transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center justify-center"
                title={t('watch_tutorial')}
              >
                <Youtube size={20} fill="currentColor" />
              </button>
              <button
                onClick={(e) => openImageSearch(e, getExNameEn(selectedExercise))}
                className="text-white bg-blue-600 hover:bg-blue-500 p-2 rounded-full transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center"
                title={t('view_images')}
              >
                <Image size={20} />
              </button>
              <button
                onClick={() => setAnatomyExercise(selectedExercise)}
                className="text-white bg-emerald-600 hover:bg-emerald-500 p-2 rounded-full transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center"
                title={t('view_anatomy')}
              >
                <Camera size={20} />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleAdd} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">
                {isCardio ? t('level') : t('weight')} (kg)
              </label>
              <input 
                type="number" inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl h-16 text-center text-2xl font-black text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                placeholder="0"
                value={weight} onChange={e => setWeight(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">
                {isCardio ? t('time') : t('reps')}
              </label>
              <input 
                 type="number" inputMode="numeric"
                 className="w-full bg-slate-900 border border-slate-700 rounded-xl h-16 text-center text-2xl font-black text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                 placeholder="0"
                 value={reps} onChange={e => setReps(e.target.value)}
              />
            </div>
            <button type="submit" className="h-16 w-16 flex-none rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 active:scale-95 transition-all border border-emerald-400/50">
              <CheckCircle size={28} strokeWidth={2.5} />
            </button>
          </form>
        </Card>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          <div className="flex items-center justify-between px-2 mb-2">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('sets_completed')}</span>
             <span className="text-xs font-bold text-emerald-500">{(activeWorkout.logs[selectedExercise] || []).length}</span>
          </div>
          {((activeWorkout.logs[selectedExercise] || []).slice().reverse()).map((set, i, arr) => {
            const realIndex = arr.length - 1 - i;
            return (
              <div key={realIndex} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-800 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 font-mono text-sm">#{realIndex + 1}</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-xl font-black text-white">{set.weight}</span>
                     <span className="text-xs text-slate-500 mr-3">{isCardio ? 'nvl' : 'kg'}</span>
                     <span className="text-xl font-black text-white">{set.reps}</span>
                     <span className="text-xs text-slate-500">{isCardio ? 'min' : 'reps'}</span>
                  </div>
                </div>
                <button onClick={() => deleteSet(selectedExercise, realIndex)} className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800"><Trash2 size={16}/></button>
              </div>
            )
          })}
        </div>

        <div className="pt-3 pb-2 shrink-0">
          <Button onClick={handleFinishWorkout} className="w-full py-4 text-lg shadow-2xl shadow-blue-900/50" icon={Save}>
            {t('finish_workout')}
          </Button>
        </div>
      </div>
    );
  };

  const HistoryView = () => (
    <div className="space-y-4 animate-in fade-in">
      {history.length === 0 ? (
        <div className="text-center py-20 opacity-50">
           <History size={64} className="mx-auto mb-4 text-slate-600"/>
           <p>{t('no_history')}</p>
        </div>
      ) : (
        history.map(s => (
          <Card key={s.id} className="p-5">
             <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
               <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-white text-lg truncate">{s.routineName}</h3>
                 <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                   <Calendar size={12}/>
                   {new Date(s.date).toLocaleDateString(lang === 'es' ? 'es-MX' : lang === 'fr' ? 'fr-FR' : 'en-US', {weekday: 'long', day:'numeric', month:'short'})}
                 </div>
               </div>
               <div className="flex items-center gap-2 shrink-0 ml-2">
                 <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 text-blue-400 font-bold text-sm">
                   {s.duration} min
                 </div>
                 <button onClick={() => deleteSession(s.id)} className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                   <Trash2 size={16}/>
                 </button>
               </div>
             </div>
             <div className="space-y-2">
               {Object.entries(s.logs).map(([ex, sets]) => (
                 <div key={ex} className="flex justify-between items-center text-sm">
                   <span className="text-slate-300 font-medium">{getExName(ex)}</span>
                   <span className="text-slate-500">{sets.length}</span>
                 </div>
               ))}
             </div>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 pb-safe">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-slate-950">
        
        <header className="px-6 pt-8 pb-4 flex justify-between items-center bg-slate-950 sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              GYMTRACKER
            </h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-[10px] text-white">PRO</div>
          </div>
        </header>

        <main className={`flex-1 px-4 scrollbar-hide min-h-0 ${activeTab === 'workout' ? 'overflow-hidden flex flex-col pb-4' : 'overflow-y-auto pb-24'}`}>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'routines' && isCreating && (
            <RoutineCreationForm
              t={t}
              getExName={getExName}
              getExNameEn={getExNameEn}
              getMuscleName={getMuscleName}
              openVideoSearch={openVideoSearch}
              openImageSearch={openImageSearch}
              onOpenAnatomy={setAnatomyExercise}
              onSave={(name, exercises) => { addNewRoutine(name, exercises); setIsCreating(false); }}
              onCancel={() => setIsCreating(false)}
            />
          )}
          {activeTab === 'routines' && !isCreating && <RoutinesView />}
          {activeTab === 'workout' && <ActiveWorkoutView />}
          {activeTab === 'history' && <HistoryView />}
        </main>

        {activeTab !== 'workout' && (
          <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-30 pb-safe">
            <div className="max-w-md mx-auto flex justify-around items-center h-20 px-2">
              {[
                { id: 'dashboard', icon: BarChart3, label: t('dashboard') },
                { id: 'routines', icon: Dumbbell, label: t('routines') },
                { id: 'history', icon: History, label: t('history') },
              ].map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center w-20 transition-all ${active ? 'text-blue-500 -translate-y-1' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    <tab.icon size={24} strokeWidth={active ? 2.5 : 2} className="mb-1" />
                    <span className="text-[10px] font-bold">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        )}
        
        <AnatomyModal
          exerciseId={anatomyExercise}
          onClose={() => setAnatomyExercise(null)}
          t={t}
          getExName={getExName}
          getMuscleName={getMuscleName}
        />
        <CelebrationModal achievements={achievements} onClose={() => setAchievements([])} t={t} />
        <ConfirmationModal 
          isOpen={confirmModal.isOpen} 
          title={confirmModal.title} 
          message={confirmModal.message} 
          onConfirm={confirmModal.onConfirm} 
          onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
          t={t}
        />
        {showSettings && <SettingsModal />}
      </div>
    </div>
  );
}