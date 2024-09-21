import { clerk } from '@/lib/client'
import { BlobObjectSchema, zUpdateTransaction } from '@6pm/validation'
import * as FileSystem from 'expo-file-system'

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

  const transaction = zUpdateTransaction
    .extend({
      blobObject: BlobObjectSchema.nullable().optional(),
    })
    .parse({
      ...body,
      date: body?.date ? new Date(body.date) : undefined,
    })

  return { id, ...transaction }
}
