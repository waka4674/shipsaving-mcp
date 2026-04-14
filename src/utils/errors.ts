export class ApiError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

const ERROR_MESSAGES: Record<number, string> = {
  401: "Authentication failed. Please check your SHIPSAVING_APP_KEY configuration.",
  402: "Insufficient balance. Please top up your wallet first.",
  403: "Permission denied. You do not have access to this operation.",
  404: "The requested resource was not found.",
  429: "Too many requests. Please try again later.",
};

export function formatError(error: unknown): string {
  if (error instanceof ApiError) {
    const friendly = ERROR_MESSAGES[error.code];
    return friendly ? `${friendly} (${error.message})` : `Error: ${error.message}`;
  }
  return `Unknown error: ${(error as Error).message}`;
}
