export const BATCH_OPTIONS = [
  "24x7 Batch",
  "Morning Batch",
  "Evening Batch",
] as const;

export type BatchOption = (typeof BATCH_OPTIONS)[number];

export function isBatchOption(value: string): value is BatchOption {
  return (BATCH_OPTIONS as readonly string[]).includes(value);
}
