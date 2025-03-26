import ErrorCode from '@/constants/error-codes'
import { getTranslations } from 'next-intl/server'

export const createServerAction = <
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Args extends any[] = unknown[],
  Result = unknown,
>(
  fn: (...args: Args) => Promise<Result>,
): ((
  ...args: Args
) => Promise<
  | { success: true; data: Result; error: null }
  | { success: false; data: null; error: string }
>) => {
  return async (...args: Args) => {
    try {
      const data = await fn(...args)

      return {
        success: true,
        data,
        error: null,
      }
    } catch (error) {
      const t = await getTranslations('errors')
      console.error(`Error executing server action ${fn.name}:`, error)

      let errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      // @ts-ignore
      if (Object.values(ErrorCode).includes(errorMessage)) {
        errorMessage = t(errorMessage)
      }

      return {
        success: false,
        data: null,
        error: errorMessage,
      }
    }
  }
}
