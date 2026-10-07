import type { AppError } from "@/server/shared/app-error";

type Success<T> = { ok: true; value: T };
type Failure<E> = { ok: false; error: E };
type Result<T, E = AppError> = Success<T> | Failure<E>;

function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

function err<E>(error: E): Failure<E> {
  return { ok: false, error };
}

export { err, success };
export type { Failure, Result, Success };
