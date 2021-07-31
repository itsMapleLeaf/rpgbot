export type MaybePromise<T> = Promise<T> | T

export type NonEmptyArray<T> = [T, ...T[]]

export type ValueOf<T> = T extends readonly unknown[] ? T[number] : T
