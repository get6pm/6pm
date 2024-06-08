// import { Pool } from '@neondatabase/serverless'
// import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

// const neon = new Pool({ connectionString: process.env.POSTGRES_PRISMA_URL })
// const adapter = new PrismaNeon(neon)

const prisma = new PrismaClient()

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
