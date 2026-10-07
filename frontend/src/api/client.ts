import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

export type UserRole = 'admin' | 'employee';
export type UserTheme = 'light' | 'dark';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
  theme: UserTheme;
  weeklyHours: number | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

const AUTH_STORAGE_KEY = 'twinsstock_auth';

export function getStoredAuth(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: AuthResponse) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export const UNAUTHORIZED_EVENT = 'twinsstock:unauthorized';

api.interceptors.request.use((config) => {
  const token = getStoredAuth()?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export interface Category {
  id: string;
  name: string;
  position: number;
}

export const MARKETS = [
  'Mercadona',
  'Makro',
  'Alcampo',
  'HiperDino',
  'Spar',
  'Alteza',
  'Lidl',
  'Aldi',
] as const;

export type Market = (typeof MARKETS)[number];

export interface Consumable {
  id: string;
  name: string;
  active: boolean;
  position: number;
  stock: number;
  minStock: number;
  market: Market | null;
  categoryId: string | null;
  category?: Category | null;
}

export interface ShoppingListItem {
  id: string;
  consumableId: string;
  market: Market | null;
  quantity: number;
  createdAt: string;
  consumable: Consumable;
}

export interface PurchaseLog {
  id: string;
  consumableId: string | null;
  consumableName: string;
  market: Market | null;
  quantity: number;
  purchasedAt: string;
}

export interface ConsumptionLog {
  id: string;
  consumableId: string;
  consumedAt: string;
  createdAt: string;
  consumable?: Consumable;
}

export interface StatsSummaryRow {
  consumableId: string;
  consumableName: string;
  count: number;
  lastConsumedAt: string | null;
}

export interface StatsTimeseriesRow {
  period: string;
  consumableId: string;
  consumableName: string;
  count: number;
}

export type StockStatus = 'in' | 'out';

export interface ConsumablesFilter {
  includeInactive?: boolean;
  active?: boolean;
  categoryId?: string;
  stockStatus?: StockStatus;
}

export const fetchConsumables = (filter: ConsumablesFilter = {}) =>
  api
    .get<Consumable[]>('/consumables', {
      params: {
        includeInactive: filter.includeInactive ? 'true' : undefined,
        active: filter.active === undefined ? undefined : String(filter.active),
        categoryId: filter.categoryId || undefined,
        stockStatus: filter.stockStatus,
      },
    })
    .then((res) => res.data);

export const fetchCategories = () => api.get<Category[]>('/categories').then((res) => res.data);

export interface CreateConsumableInput {
  name: string;
  categoryId: string;
  minStock?: number;
  market?: Market | null;
}

export const createConsumable = (input: CreateConsumableInput) =>
  api.post<Consumable>('/consumables', input).then((res) => res.data);

export interface UpdateConsumableInput {
  name?: string;
  categoryId?: string;
  active?: boolean;
  minStock?: number;
  market?: Market | null;
}

export const updateConsumable = (id: string, input: UpdateConsumableInput) =>
  api.patch<Consumable>(`/consumables/${id}`, input).then((res) => res.data);

export const deleteConsumable = (id: string) =>
  api.delete<void>(`/consumables/${id}`).then((res) => res.data);

export const fetchShoppingList = () =>
  api.get<ShoppingListItem[]>('/shopping-list').then((res) => res.data);

export const markAsPurchased = (consumableId: string) =>
  api.post<PurchaseLog>(`/shopping-list/${consumableId}/purchase`).then((res) => res.data);

export const fetchPurchaseLogs = (limit = 30) =>
  api.get<PurchaseLog[]>('/shopping-list/purchases', { params: { limit } }).then((res) => res.data);

export const addToShoppingList = (consumableId: string, market: Market | null) =>
  api.post<ShoppingListItem>('/shopping-list', { consumableId, market }).then((res) => res.data);

export const setShoppingItemMarket = (consumableId: string, market: Market | null) =>
  api
    .patch<ShoppingListItem>(`/shopping-list/${consumableId}`, { market })
    .then((res) => res.data);

export const removeFromShoppingList = (consumableId: string) =>
  api.delete<void>(`/shopping-list/${consumableId}`).then((res) => res.data);

export const registerConsumption = (consumableId: string) =>
  api.post<ConsumptionLog>('/consumption-logs', { consumableId }).then((res) => res.data);

export interface ConsumptionLogsFilter {
  limit?: number;
  from?: string;
  to?: string;
  consumableId?: string;
}

export const fetchConsumptionLogs = (filter: ConsumptionLogsFilter = {}) =>
  api
    .get<ConsumptionLog[]>('/consumption-logs', {
      params: {
        limit: filter.limit,
        from: filter.from,
        to: filter.to,
        consumableId: filter.consumableId || undefined,
      },
    })
    .then((res) => res.data);

export const deleteConsumptionLog = (id: string) =>
  api.delete<void>(`/consumption-logs/${id}`).then((res) => res.data);

export const adjustStock = (consumableId: string, delta: number) =>
  api.patch<Consumable>(`/consumables/${consumableId}/stock`, { delta }).then((res) => res.data);

export const fetchStatsSummary = (from?: string, to?: string) =>
  api.get<StatsSummaryRow[]>('/stats/summary', { params: { from, to } }).then((res) => res.data);

export const fetchStatsTimeseries = (from: string, to: string, groupBy: 'day' | 'week' | 'month') =>
  api
    .get<StatsTimeseriesRow[]>('/stats/timeseries', { params: { from, to, groupBy } })
    .then((res) => res.data);

export const login = (username: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { username, password }).then((res) => res.data);

export const fetchUsers = () => api.get<User[]>('/users').then((res) => res.data);

export interface CreateUserInput {
  username: string;
  name: string;
  password: string;
  role: UserRole;
  weeklyHours?: number;
}

export const createUser = (input: CreateUserInput) =>
  api.post<User>('/users', input).then((res) => res.data);

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  active?: boolean;
  password?: string;
  weeklyHours?: number;
}

export const updateUser = (id: string, input: UpdateUserInput) =>
  api.patch<User>(`/users/${id}`, input).then((res) => res.data);

export const updateOwnTheme = (theme: UserTheme) =>
  api.patch<User>('/users/me/theme', { theme }).then((res) => res.data);

export interface Shift {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
  createdAt: string;
  user?: { id: string; name: string; username: string };
}

export interface ShiftTemplate {
  id: string;
  userId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface ShiftRangeResult {
  datesCreated: string[];
  datesSkipped: string[];
}

export const fetchShifts = (params: { userId?: string; from: string; to: string }) =>
  api.get<Shift[]>('/shifts', { params }).then((res) => res.data);

export const fetchMyShifts = (from: string, to: string) =>
  api.get<Shift[]>('/shifts/me', { params: { from, to } }).then((res) => res.data);

export interface CreateShiftInput {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
}

export const createShift = (input: CreateShiftInput) =>
  api.post<Shift>('/shifts', input).then((res) => res.data);

export interface UpdateShiftInput {
  startTime?: string;
  endTime?: string;
  note?: string;
}

export const updateShift = (id: string, input: UpdateShiftInput) =>
  api.patch<Shift>(`/shifts/${id}`, input).then((res) => res.data);

export const deleteShift = (id: string) => api.delete<void>(`/shifts/${id}`).then((res) => res.data);

export const applyShiftTemplate = (userId: string, from: string, to: string) =>
  api.post<ShiftRangeResult>('/shifts/apply-template', { userId, from, to }).then((res) => res.data);

export const copyShiftWeek = (userId: string, sourceWeekStart: string, targetWeekStart: string) =>
  api
    .post<ShiftRangeResult>('/shifts/copy-week', { userId, sourceWeekStart, targetWeekStart })
    .then((res) => res.data);

export const fetchShiftTemplates = (userId: string) =>
  api.get<ShiftTemplate[]>(`/shift-templates/${userId}`).then((res) => res.data);

export const replaceShiftTemplates = (
  userId: string,
  templates: { weekday: number; startTime: string; endTime: string }[],
) => api.put<ShiftTemplate[]>(`/shift-templates/${userId}`, { templates }).then((res) => res.data);
