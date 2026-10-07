import { ValueTransformer } from 'typeorm';

export const timeColumnTransformer: ValueTransformer = {
  to: (value?: string | null) => value,
  from: (value?: string | null) => (value ? value.slice(0, 5) : (value ?? null)),
};
