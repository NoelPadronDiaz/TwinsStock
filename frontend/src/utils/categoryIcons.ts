const CATEGORY_ICONS: Record<string, string> = {
  'Líquidos y Cremas': '🥛',
  'Productos secos': '🌾',
  Congelados: '❄️',
  Consumibles: '🥤',
};

const DEFAULT_CATEGORY_ICON = '🏷️';

export function getCategoryIcon(categoryName: string): string {
  return CATEGORY_ICONS[categoryName] ?? DEFAULT_CATEGORY_ICON;
}
