import { prisma } from '@6pm/db'
import { redirect } from 'next/navigation'
import { TransactionDetails } from './_components/transaction-details'

export default async function TransactionIdPage({
  params,
}: { params: Promise<{ spaceId: string; transactionId: string }> }) {
  const { transactionId, spaceId } = await params
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId, spaceId },
    include: {
      space: { select: { baseCurrencyCode: true } },
      member: {
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
            },
          },
        },
      },
      account: {
        select: {
          id: true,
          name: true,
          institution: true,
          lastDigits: true,
          color: true,
          type: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          isExclusive: true,
        },
      },
    },
  })

  if (!transaction) {
    return redirect(`/spaces/${spaceId}/transactions`)
  }

  return <TransactionDetails transaction={transaction} />
}
