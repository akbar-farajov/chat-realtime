export interface ActionResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export function createSafeAction<TInput extends unknown[], TOutput>(
  action: (...args: TInput) => Promise<TOutput>,
) {
  return async (...args: TInput): Promise<ActionResponse<TOutput>> => {
    try {
      const result = await action(...args);
      return { data: result, error: null, success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("[SafeAction Error]", message, err);
      return { data: null, error: message, success: false };
    }
  };
}

export function isSuccess<T>(
  response: ActionResponse<T>,
): response is ActionResponse<T> & { data: T; success: true } {
  return response.success && response.data !== null;
}

export function isError<T>(
  response: ActionResponse<T>,
): response is ActionResponse<T> & { data: null; success: false } {
  return !response.success;
}
