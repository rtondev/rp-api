const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const PASSWORD = 'zufquz4lA#30';

const categories = [
  {
    name: 'Hospedagem',
    description: 'Hotéis, pousadas e hospedagens',
    icon: 'Bed',
  },
  {
    name: 'Alimentação',
    description: 'Restaurantes, bares e cafés',
    icon: 'ForkKnife',
  },
  {
    name: 'Ponto Turístico',
    description: 'Atrações e pontos de interesse',
    icon: 'MapPin',
  },
  {
    name: 'Cultura',
    description: 'Museus, teatros e espaços culturais',
    icon: 'MaskHappy',
  },
  {
    name: 'Natureza',
    description: 'Parques, praias e trilhas',
    icon: 'Tree',
  },
];

const users = [
  {
    email: 'admin@gmail.com',
    name: 'Administrador',
    role: 'ADMIN',
  },
  {
    email: 'praiamar@gmail.com',
    name: 'Praia Mar',
    role: 'GESTOR',
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
        icon: category.icon,
      },
      create: category,
    });

    console.log(`OK categoria → ${category.name}`);
  }

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
