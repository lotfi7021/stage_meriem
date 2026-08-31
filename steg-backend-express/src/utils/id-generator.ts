import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';

/**
 * Génère le prochain ID séquentiel (ex: CLI-00001) de façon thread-safe
 * en utilisant une transaction avec lock pessimiste.
 */
export async function generateSequentialId<T extends ObjectLiteral>(
  dataSource: DataSource,
  entity: EntityTarget<T>,
  prefix: string,
  idColumn = 'id',
): Promise<string> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const repo = queryRunner.manager.getRepository(entity);

    const last = await repo
      .createQueryBuilder('e')
      .setLock('pessimistic_write')
      .orderBy(`e.${idColumn}`, 'DESC')
      .limit(1)
      .getOne();

    const lastNum = last
      ? parseInt(String(last[idColumn]).split('-')[1] ?? '0', 10)
      : 0;

    const nextNum = lastNum + 1;
    const nextId = `${prefix}-${String(nextNum).padStart(5, '0')}`;

    await queryRunner.commitTransaction();
    return nextId;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
