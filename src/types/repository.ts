// Shared repository result types and helpers
export type RepoSuccess<T> = { ok: true; data: T };
export type RepoError = { ok: false; error: string; code?: string };
export type RepoResult<T> = RepoSuccess<T> | RepoError;

export const isOk = <T>(res: RepoResult<T>): res is RepoSuccess<T> => res.ok === true;

export function getError<T>(res: RepoResult<T>): string | null {
  if (res.ok) return null;
  return (res as RepoError).error;
}
