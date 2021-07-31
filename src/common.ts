export function raise(error: string | Error): never {
  throw typeof error === "string" ? new Error(error) : error
}

export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}
