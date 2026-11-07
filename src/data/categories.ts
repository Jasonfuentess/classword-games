import type { ContentLanguage } from '../types/activity';

export interface Category {
  id: string;
  icon: string;
  name: Record<ContentLanguage, string>;
  words: Record<ContentLanguage, string[]>;
}

export const CATEGORIES: Category[] = [
  {
    id: 'animals',
    icon: '🦊',
    name: { en: 'Animals', es: 'Animales' },
    words: {
      en: ['Elephant', 'Giraffe', 'Dolphin', 'Penguin', 'Kangaroo', 'Tiger', 'Rabbit', 'Turtle', 'Eagle', 'Zebra', 'Octopus', 'Squirrel'],
      es: ['Elefante', 'Jirafa', 'Delfín', 'Pingüino', 'Canguro', 'Tigre', 'Conejo', 'Tortuga', 'Águila', 'Cebra', 'Pulpo', 'Ardilla'],
    },
  },
  {
    id: 'fruits',
    icon: '🍓',
    name: { en: 'Fruits', es: 'Frutas' },
    words: {
      en: ['Apple', 'Banana', 'Cherry', 'Grape', 'Lemon', 'Mango', 'Orange', 'Peach', 'Pineapple', 'Strawberry', 'Watermelon', 'Kiwi'],
      es: ['Manzana', 'Plátano', 'Cereza', 'Uva', 'Limón', 'Mango', 'Naranja', 'Durazno', 'Piña', 'Fresa', 'Sandía', 'Kiwi'],
    },
  },
  {
    id: 'science',
    icon: '🔬',
    name: { en: 'Science', es: 'Ciencias' },
    words: {
      en: ['Atom', 'Energy', 'Gravity', 'Molecule', 'Planet', 'Cell', 'Oxygen', 'Magnet', 'Photosynthesis', 'Volcano', 'Experiment', 'Electron'],
      es: ['Átomo', 'Energía', 'Gravedad', 'Molécula', 'Planeta', 'Célula', 'Oxígeno', 'Imán', 'Fotosíntesis', 'Volcán', 'Experimento', 'Electrón'],
    },
  },
  {
    id: 'countries',
    icon: '🌎',
    name: { en: 'Countries', es: 'Países' },
    words: {
      en: ['Mexico', 'Canada', 'Brazil', 'Spain', 'Japan', 'Egypt', 'France', 'Italy', 'India', 'Chile', 'Peru', 'Germany'],
      es: ['México', 'Canadá', 'Brasil', 'España', 'Japón', 'Egipto', 'Francia', 'Italia', 'India', 'Chile', 'Perú', 'Alemania'],
    },
  },
  {
    id: 'school',
    icon: '✏️',
    name: { en: 'School supplies', es: 'Útiles escolares' },
    words: {
      en: ['Pencil', 'Eraser', 'Notebook', 'Ruler', 'Backpack', 'Scissors', 'Glue', 'Marker', 'Calculator', 'Crayon', 'Folder', 'Sharpener'],
      es: ['Lápiz', 'Borrador', 'Cuaderno', 'Regla', 'Mochila', 'Tijeras', 'Pegamento', 'Marcador', 'Calculadora', 'Crayón', 'Carpeta', 'Sacapuntas'],
    },
  },
  {
    id: 'sports',
    icon: '⚽',
    name: { en: 'Sports', es: 'Deportes' },
    words: {
      en: ['Soccer', 'Tennis', 'Swimming', 'Baseball', 'Basketball', 'Volleyball', 'Cycling', 'Boxing', 'Karate', 'Golf', 'Hockey', 'Surfing'],
      es: ['Fútbol', 'Tenis', 'Natación', 'Béisbol', 'Baloncesto', 'Voleibol', 'Ciclismo', 'Boxeo', 'Karate', 'Golf', 'Hockey', 'Surf'],
    },
  },
  {
    id: 'body',
    icon: '🫀',
    name: { en: 'Human body', es: 'Cuerpo humano' },
    words: {
      en: ['Heart', 'Brain', 'Lungs', 'Stomach', 'Skeleton', 'Muscle', 'Elbow', 'Shoulder', 'Knee', 'Finger', 'Tongue', 'Ankle'],
      es: ['Corazón', 'Cerebro', 'Pulmones', 'Estómago', 'Esqueleto', 'Músculo', 'Codo', 'Hombro', 'Rodilla', 'Dedo', 'Lengua', 'Tobillo'],
    },
  },
  {
    id: 'colors',
    icon: '🎨',
    name: { en: 'Colors', es: 'Colores' },
    words: {
      en: ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black', 'White', 'Gray', 'Turquoise'],
      es: ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Morado', 'Naranja', 'Rosa', 'Marrón', 'Negro', 'Blanco', 'Gris', 'Turquesa'],
    },
  },
];

export function getCategory(id: string | null | undefined): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
