import { getHonoClient } from '@/lib/client'
import { type TransactionFormValues, TransactionSchema } from '@6pm/validation'
import { z } from 'zod'

export async function createTransaction(data: TransactionFormValues) {
  const hc = await getHonoClient()
  const result = await hc.v1.transactions.$post({
    json: {
      ...data,
      amount: -data.amount,
    },
  })

  if (result.ok) {
    const transaction = await result.json()
    return TransactionSchema.merge(
      z.object({
        // override Decimal type with number
        amount: z.number({ coerce: true }),
      }),
    ).parse(transaction)
  }

  return result
}

export async function updateTransaction({
  id,
  data,
}: {
  id: string
  data: TransactionFormValues
}) {
  const hc = await getHonoClient()
  const result = await hc.v1.transactions[':transactionId'].$put({
    param: { transactionId: id },
    json: {
      ...data,
      amount: -data.amount,
    },
  })

  if (result.ok) {
    const transaction = await result.json()
    return TransactionSchema.merge(
      z.object({
        // override Decimal type with number
        amount: z.number({ coerce: true }),
      }),
    ).parse(transaction)
  }

  return result
}

export async function deleteTransaction(id: string) {
  const hc = await getHonoClient()
  await hc.v1.transactions[':transactionId'].$delete({
    param: { transactionId: id },
  })
}
