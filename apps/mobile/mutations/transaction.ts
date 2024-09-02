import { clerk, getHonoClient } from '@/lib/client'
import {
  type TransactionFormValues,
  TransactionSchema,
  zUpdateTransaction,
} from '@6pm/validation'
import * as FileSystem from 'expo-file-system'
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
        amountInVnd: z.number({ coerce: true }),
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
        amountInVnd: z.number({ coerce: true }),
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

export async function getAITransactionData({
  fileUri,
  id,
}: {
  fileUri: string
  id?: string
}) {
  const token = await clerk.session?.getToken()

  const result = await FileSystem.uploadAsync(
    `${process.env.EXPO_PUBLIC_API_URL!}v1/transactions/ai`,
    fileUri,
    {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      headers: {
        // biome-ignore lint/style/useNamingConvention: <explanation>
        Authorization: `Bearer ${token}`,
      },
    },
  )

  const body = JSON.parse(result.body)

  const transaction = zUpdateTransaction.parse({
    ...body,
    date: body?.date ? new Date(body.date) : undefined,
  })

  return { id, ...transaction }
}
