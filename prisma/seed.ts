import { PrismaClient, Role, TaskStatus } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. tạo user
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'loc@example.com' },
    update: {},
    create: { email: 'loc@example.com', password: hashedPassword },
  });

  // 2. tạo workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'My Workspace',
    },
  });

  // 3. membership
  await prisma.membership.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      role: Role.OWNER,
    },
  });

  // 4. task
  const task = await prisma.task.create({
    data: {
      title: 'First Task',
      workspaceId: workspace.id,
      status: TaskStatus.TODO,
    },
  });

  // 5. assign
  await prisma.taskAssignee.create({
    data: {
      taskId: task.id,
      userId: user.id,
    },
  });
}

main()
  .then(() => {
    console.log('Seed done');
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
