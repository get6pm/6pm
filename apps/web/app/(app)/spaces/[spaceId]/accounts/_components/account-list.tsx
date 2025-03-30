'use client'
import { getColorValue } from '@/lib/get-color-value'
import { getCurrencyInputProps } from '@/lib/get-currency-input-props'
import { useAppContext } from '@/store/app-provider'
import { NumericFormat } from '@6pm/ui/components/number-format'
import { cn } from '@6pm/ui/lib/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { FC } from 'react'

export type AccountListProps = {}

export const AccountList: FC<AccountListProps> = () => {
  const { spaceId, accountId } = useParams<{
    spaceId: string
    accountId?: string
  }>()
  const { space } = useAppContext((state) => ({
    space: state.spaces[spaceId],
  }))

  const accounts = Object.values(space?.accounts || [])

  if (!space || !accounts.length) {
    return (
      <p>Your space doesn't have any accounts yet. Add one to get started!</p>
    )
  }

  return (
    <table className="w-full">
      <tbody className="[&_td]:px-2 [&_td]:py-1 [&_th]:pb-3">
        <tr className="text-left">
          <th className="overflow-hidden" />
          <th className="w-[1%] text-right" />
        </tr>
        {accounts.map((account) => (
          <tr key={account.id}>
            <td>
              <Link
                prefetch
                href="/spaces/[spaceId]/accounts/[accountId]"
                as={`/spaces/${spaceId}/accounts/${account.id}`}
                className="flex flex-nowrap items-center gap-4 overflow-hidden"
              >
                <div
                  className="h-10 w-2 shrink-0 rounded-lg"
                  style={{ background: getColorValue(account.color) }}
                />
                <div
                  className={cn(
                    'opacity-80 transition-all hover:opacity-90',
                    accountId === account.id && 'opacity-100',
                  )}
                >
                  <span
                    className={cn(
                      'line-clamp-1',
                      accountId === account.id &&
                        'font-semibold text-accent-main-200',
                    )}
                  >
                    {account.name}
                  </span>
                  <div className="text-sm opacity-80">
                    {account.institution} {account.lastDigits}
                  </div>
                </div>
              </Link>
            </td>
            <td>
              <NumericFormat
                className="text-right font-bold text-sm"
                value={account.balance}
                {...getCurrencyInputProps(space.baseCurrencyCode, {
                  noCode: true,
                })}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
