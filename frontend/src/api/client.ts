import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
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

export interface Consumable {
  id: string;
  name: string;
  active: boolean;
  position: number;
  stock: number;
  categoryId: string | null;
  category?: Category | null;
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
}

export const createConsumable = (input: CreateConsumableInput) =>
  api.post<Consumable>('/consumables', input).then((res) => res.data);

export interface UpdateConsumableInput {
  name?: string;
  categoryId?: string;
  active?: boolean;
}

export const updateConsumable = (id: string, input: UpdateConsumableInput) =>
  api.patch<Consumable>(`/consumables/${id}`, input).then((res) => res.data);

export const deleteConsumable = (id: string) =>
  api.delete<void>(`/consumables/${id}`).then((res) => res.data);

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
}

export const createUser = (input: CreateUserInput) =>
  api.post<User>('/users', input).then((res) => res.data);

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  active?: boolean;
  password?: string;
}

export const updateUser = (id: string, input: UpdateUserInput) =>
  api.patch<User>(`/users/${id}`, input).then((res) => res.data);
