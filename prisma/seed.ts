import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = 'zufquz4lA#30';

const users = [
  {
    email: 'admin@gmail.com',
    name: 'Administrador',
    role: UserRole.ADMIN,
  },
  {
    email: 'praiamar@gmail.com',
    name: 'Praia Mar',
    role: UserRole.GESTOR,
  },
] as const;

async function main() {
  const password = await bcrypt.hash(PASSWORD, 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        password,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        password,
      },
    });

    console.log(`OK ${user.role} → ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
