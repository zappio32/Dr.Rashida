import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  const before = await prisma.systemSetting.count();
  try {
    await prisma.$transaction(async tx => {
      const setting = await tx.systemSetting.create({ data: { key: `DB_CHECK_${Date.now()}`, value: { status: 'created' } } });
      await tx.systemSetting.update({ where: { id: setting.id }, data: { value: { status: 'updated' } } });
      await tx.systemSetting.delete({ where: { id: setting.id } });
      throw new Error('ROLLBACK_DB_CHECK');
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'ROLLBACK_DB_CHECK') throw error;
  }
  const after = await prisma.systemSetting.count();
  if (before !== after) throw new Error('Database check left persistent data behind.');
  console.log(`PostgreSQL connection and transactional CRUD check passed. Settings: ${after}`);
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Database check failed.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
