import { PrismaClient } from '@prisma/client'

// In development, use a global variable so that the value
// is preserved across module reloads (triggered by HMR)
const prismaClientSingleton = () => {
  return new PrismaClient()
}

// Create a global object on the Node.js global object
const globalForPrisma = globalThis

// Check if we already have a PrismaClient instance
const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// If not in production, attach the instance to the global object
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
