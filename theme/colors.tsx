/* eslint-disable sort-keys-fix/sort-keys-fix */

// Общая базовая палитра (не зависит от темы)
export const BaseColors = {
  // Основные цвета
  primary: '#3B82F6',
  primary_700_15: '#3B82F626',
  green: '#34C759',
  green_500_15: '#34C75926',
  error_500: '#E73054',
  error_500_15: '#E7305426', // Исправлена ошибка в HEX-коде
  warning_500: '#E7B930',
  
  // Абсолютные цвета
  black: '#000000',
  white: '#FFFFFF',
  white_90: '#ffffffe5',
  // Серая палитра (переопределяется в темах)
  grey_50: '#F2F5F7',
  grey_100: '#E6EAED',
  grey_200: '#D7DCE0',
  grey_300: '#C2C7CC',
  grey_400: '#A7ADB2',
  grey_500: '#9BA4AD',
  grey_600: '#8A8F93',
  grey_700: '#46484A',
  grey_800: '#000A0A',
} as const;

// Светлая тема
export const lightColors = {
  ...BaseColors,
  
  // Семантические цвета
  card: BaseColors.white,
  background: BaseColors.white,
  text: BaseColors.grey_800,
  border: BaseColors.grey_200,
  label: BaseColors.grey_600,
  disabled: BaseColors.grey_100,
  success_500: BaseColors.green,
  success_500_15: BaseColors.green_500_15,
  promting: BaseColors.grey_600
} as const;

// Темная тема
// export const darkColors = {
//   ...BaseColors,
  
//   // Переопределение серой палитры для темной темы
//   grey_50: '#1E1E1E',
//   grey_100: '#1E1E1E',
//   grey_200: '#37474F',
//   grey_300: '#546E7A',
//   grey_400: '#78909C',
//   grey_500: '#B0BEC5',
//   grey_600: '#CFD8DC',
//   grey_700: '#E0E0E0',
//   grey_800: '#F5F5F5',
//   card: '#1E1E1E',
//   // Семантические цвета для темной темы
//   background: '#141414', // #000A0A - темный фон
//   text: BaseColors.white_90, // #FFFFFFEA - светлый текст для читаемости
//   border: BaseColors.grey_400, // #A7ADB2 - светлые границы для контраста
//   label: BaseColors.grey_100, // #E6EAED - светлые метки
//   disabled: BaseColors.grey_500, // #9BA4AD - приглушенный серый для отключенных элементов
//   success_500: BaseColors.green, // #34C759 - яркий зеленый остается без изменений
//   success_500_15: BaseColors.green_500_15, // #34C75926 - прозрачный зеленый,
//   promting: BaseColors.grey_600
// } as const;

export const darkColors = {
  ...BaseColors,

  // Серая палитра — от темнейшего к светлому
  grey_50: '#0D1117',   // surface deepest
  grey_100: '#161B22',  // card bg
  grey_200: '#1F2937',  // button / input bg
  grey_300: '#30363D',  // borders / dividers
  grey_400: '#6B7280',  // muted text
  grey_500: '#9CA3AF',  // secondary text
  grey_600: '#D1D5DB',  // label text
  grey_700: '#E5E7EB',  // body text
  grey_800: '#F9FAFB',  // primary text

  // Семантические цвета
  card: '#161B22',
  background: '#0A0F1E',
  text: '#F9FAFB',
  border: '#30363D',
  label: '#9CA3AF',
  disabled: '#30363D',
  success_500: BaseColors.green,
  success_500_15: BaseColors.green_500_15,
  promting: '#6B7280',
} as const;