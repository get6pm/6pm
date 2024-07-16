import prisma from '../../lib/prisma'

export async function findAiCacheByQuery({
  query,
}: {
  query: string
}) {
  return await prisma.cachedGptResponse.findFirst({
    where: { query },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createAiCache({
  query,
  response,
}: {
  query: string
  response: string
}) {
  return await prisma.cachedGptResponse.create({
    data: { query, response },
  })
}
