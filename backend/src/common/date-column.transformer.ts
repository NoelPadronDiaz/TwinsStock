import { ValueTransformer } from 'typeorm';

// Postgres `date` columns come back from pg as JS Date objects at UTC
// midnight for that calendar day. Slicing the ISO string is safe regardless
// of the server's local timezone, since the instant is always UTC midnight
// for that exact date. Keeps the TS/DB value a plain 'YYYY-MM-DD' string.
export const dateColumnTransformer: ValueTransformer = {
  to: (value?: string | null) => value,
  from: (value?: Date | string | null) => {
    if (!value) return value ?? null;
    return value instanceof Date ? value.toISOString().slice(0, 10) : value;
  },
};
