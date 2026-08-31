export function toPlainData<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString() as T;
  if (Array.isArray(value)) return value.map(item => toPlainData(item)) as T;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toPlainData(item)])) as T;
}

export function isPlainSerializable(value: unknown): boolean {
  if (value === null || ["string", "number", "boolean", "undefined"].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isPlainSerializable);
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.values(value).every(isPlainSerializable);
}
