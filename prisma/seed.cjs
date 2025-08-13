/* node prisma/seed.cjs */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  await prisma.user.upsert({
    where: { dni: '00000001A' },
    update: {},
    create: { fullName: 'Test User', dni: '00000001A', phone: '600000001', email: 'test@example.com' }
  })
  await prisma.bike.upsert({
    where: { code: 'B001' },
    update: {},
    create: { code: 'B001', type: 'Urbana', model: 'Trek FX 2', sizeLabel: 'M', condition: 'Buena' }
  })
  console.log('Seed done')
}
main().finally(()=>prisma.$disconnect())
