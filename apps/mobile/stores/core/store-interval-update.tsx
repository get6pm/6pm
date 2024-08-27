import { useSuspenseQueries } from '@tanstack/react-query'
import type { FC } from 'react'
import { useCategoryListQueryOptions } from '../category/hooks'
import { useTransactionListQueryOptions } from '../transaction/hooks'
import type { StoreHookQueryOptions } from './stores'
import { STORE_SYNC_INTERVAL } from './stores.const'

export type StoreIntervalUpdateProps = {
  interval?: number
}

export const StoreIntervalUpdate: FC<StoreIntervalUpdateProps> = ({
  interval = STORE_SYNC_INTERVAL,
}) => {
  const queryOptions: StoreHookQueryOptions = {
    refetchInterval: interval,
    refetchIntervalInBackground: true,
  }
  const categoryListQueryOptions = useCategoryListQueryOptions(queryOptions)
  const transactionListQueryOptions = useTransactionListQueryOptions(
    undefined,
    queryOptions,
  )

  useSuspenseQueries({
    queries: [{ ...categoryListQueryOptions }, transactionListQueryOptions],
  })

  return null
}
