import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

export interface Consumable {
  id: string;
  name: string;
  active: boolean;
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

export const fetchConsumables = () => api.get<Consumable[]>('/consumables').then((res) => res.data);

export const registerConsumption = (consumableId: string) =>
  api.post<ConsumptionLog>('/consumption-logs', { consumableId }).then((res) => res.data);

export const fetchRecentLogs = (limit = 10) =>
  api.get<ConsumptionLog[]>('/consumption-logs', { params: { limit } }).then((res) => res.data);

export const fetchStatsSummary = (from?: string, to?: string) =>
  api.get<StatsSummaryRow[]>('/stats/summary', { params: { from, to } }).then((res) => res.data);

export const fetchStatsTimeseries = (from: string, to: string, groupBy: 'day' | 'week' | 'month') =>
  api
    .get<StatsTimeseriesRow[]>('/stats/timeseries', { params: { from, to, groupBy } })
    .then((res) => res.data);
