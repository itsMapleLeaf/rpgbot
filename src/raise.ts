export function raise(error: string | Error): never {
  throw typeof error === "string" ? new Error(error) : error
}
