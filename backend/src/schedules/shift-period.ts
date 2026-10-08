export const SHIFT_PERIODS = ['morning', 'afternoon'] as const;
export type ShiftPeriod = (typeof SHIFT_PERIODS)[number];
