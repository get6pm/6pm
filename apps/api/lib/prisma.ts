import { PrismaClient } from '@prisma/client'

// biome-ignore lint/style/useConst: <explanation>
let prisma: PrismaClient

prisma = new PrismaClient()

// if (process.env.NODE_ENV === 'production') {
//   prisma = new PrismaClient()
// } else {
//   const globalWithPrisma = global as typeof globalThis & {
//     prisma: PrismaClient
//   }
//   if (!globalWithPrisma.prisma) {
//     globalWithPrisma.prisma = new PrismaClient()
//   }
//   prisma = globalWithPrisma.prisma
// }

export default prisma
