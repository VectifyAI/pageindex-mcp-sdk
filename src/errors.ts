export type PageIndexErrorCode =
  | "USAGE_LIMIT_REACHED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export class PageIndexError extends Error {
  constructor(
    message: string,
    public readonly code?: PageIndexErrorCode,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "PageIndexError";
  }
}
