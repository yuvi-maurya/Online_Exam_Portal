require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

async function main() {
  const [, , examId] = process.argv
  if (!examId) {
    console.error('Usage: node set-exam-start-past.cjs <examId>')
    process.exit(2)
  }
  const prisma = new PrismaClient()
  try {
    const past = new Date(Date.now() - 60 * 1000)
    await prisma.exam.update({ where: { id: examId }, data: { startTime: past } })
    console.log('Updated exam startTime to past for', examId)
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
