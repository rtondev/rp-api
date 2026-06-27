import {
  Prisma,
  PrismaClient,
  SignalType,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { backfillMissingSignalCodes } from '../src/common/utils/signal-code.util';

const prisma = new PrismaClient();

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
    description: 'Museus, teatros e eventos culturais',
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
    email: 'admin@rotapotiguar.com',
    name: 'Admin Demo',
    role: UserRole.ADMIN,
    password: '123456',
  },
  {
    email: 'gestor@rotapotiguar.com',
    name: 'Gestor Demo',
    role: UserRole.GESTOR,
    password: '123456',
  },
  {
    email: 'turista@rotapotiguar.com',
    phone: '5583999990001',
    name: 'Turista Demo',
    role: UserRole.TURISTA,
    password: '123456',
  },
];

type PlaceSeed = {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  categoryName: string;
  imageUrl?: string;
  available?: boolean;
  links?: { label: string; url: string }[];
  openingHours?: Record<string, unknown>;
};

const beachHours = { alwaysOpen: true };

const restaurantHours = {
  monday: { open: '11:00', close: '22:00' },
  tuesday: { open: '11:00', close: '22:00' },
  wednesday: { open: '11:00', close: '22:00' },
  thursday: { open: '11:00', close: '22:00' },
  friday: { open: '11:00', close: '23:00' },
  saturday: { open: '11:00', close: '23:00' },
  sunday: { open: '11:00', close: '21:00' },
};

const museumHours = {
  monday: { closed: true },
  tuesday: { open: '09:00', close: '17:00' },
  wednesday: { open: '09:00', close: '17:00' },
  thursday: { open: '09:00', close: '17:00' },
  friday: { open: '09:00', close: '17:00' },
  saturday: { open: '09:00', close: '17:00' },
  sunday: { open: '09:00', close: '13:00' },
};

const hotelHours = {
  monday: { open: '00:00', close: '23:59' },
  tuesday: { open: '00:00', close: '23:59' },
  wednesday: { open: '00:00', close: '23:59' },
  thursday: { open: '00:00', close: '23:59' },
  friday: { open: '00:00', close: '23:59' },
  saturday: { open: '00:00', close: '23:59' },
  sunday: { open: '00:00', close: '23:59' },
};

const places: PlaceSeed[] = [
  {
    title: 'Praia de Ponta Negra',
    description:
      'A praia mais famosa de Natal, com o icônico Morro do Careca ao fundo. Areia clara, quiosques, passeios de buggy e pôr do sol imperdível.',
    latitude: -5.8806,
    longitude: -35.189,
    address: 'Ponta Negra, Natal - RN',
    categoryName: 'Natureza',
    openingHours: beachHours,
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    links: [
      { label: 'Google Maps', url: 'https://maps.google.com/?q=Praia+de+Ponta+Negra+Natal' },
    ],
  },
  {
    title: 'Camarões Ponta Negra',
    description:
      'Rede de restaurantes referência em frutos do mar no RN. Ambiente descontraído à beira-mar, ideal para provar a culinária potiguar.',
    latitude: -5.8812,
    longitude: -35.1865,
    address: 'Av. Eng. Roberto Freire, 3050 - Ponta Negra, Natal - RN',
    categoryName: 'Alimentação',
    openingHours: restaurantHours,
    imageUrl:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    links: [
      { label: 'Site', url: 'https://www.camaroes.com.br' },
    ],
  },
  {
    title: 'Praiamar Natal Hotel',
    description:
      'Hotel clássico de frente para o mar em Ponta Negra, conhecido como referência de hospedagem na orla. Piscina, restaurante e vista para o Morro do Careca.',
    latitude: -5.8798,
    longitude: -35.1878,
    address: 'Av. Sen. Dinarte Mariz, 1191 - Ponta Negra, Natal - RN',
    categoryName: 'Hospedagem',
    openingHours: hotelHours,
    imageUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  },
  {
    title: 'Forte dos Reis Magos',
    description:
      'Fortaleza em formato de estrela construída no século XVI. Marco histórico de Natal e um dos cartões-postais do estado.',
    latitude: -5.7631,
    longitude: -35.1944,
    address: 'Praia do Forte, Natal - RN',
    categoryName: 'Ponto Turístico',
    openingHours: museumHours,
    imageUrl:
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
    links: [
      { label: 'Ingressos', url: 'https://www.fortedosreismagos.com.br' },
    ],
  },
  {
    title: 'Morro do Careca',
    description:
      'Duna emblemática de Ponta Negra, símbolo de Natal. Área de preservação ambiental com trilhas e mirantes.',
    latitude: -5.8833,
    longitude: -35.1833,
    address: 'Ponta Negra, Natal - RN',
    categoryName: 'Natureza',
    openingHours: beachHours,
    imageUrl:
      'https://images.unsplash.com/photo-1509316785289-025f5b846983?w=800&q=80',
  },
  {
    title: 'Centro Histórico de Natal',
    description:
      'Conjunto de edifícios históricos no alto da cidade, com Igreja de São Antônio, Câmara Cascudo e vistas do Rio Potengi.',
    latitude: -5.7947,
    longitude: -35.2114,
    address: 'Rua Chile, Cidade Alta, Natal - RN',
    categoryName: 'Cultura',
    openingHours: museumHours,
    imageUrl:
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80',
  },
  {
    title: 'Parque Estadual Dunas de Natal',
    description:
      'Maior parque urbano de dunas do Brasil. Trilhas ecológicas, fauna nativa e contato direto com o bioma costeiro.',
    latitude: -5.8394,
    longitude: -35.2017,
    address: 'Av. Alm. Alexandrino de Alencar, 1391 - Tirol, Natal - RN',
    categoryName: 'Natureza',
    openingHours: beachHours,
    imageUrl:
      'https://images.unsplash.com/photo-1441974231530-c3167be5e971?w=800&q=80',
  },
  {
    title: 'Arena das Dunas',
    description:
      'Estádio e centro de eventos que recebe jogos, shows e grandes festivais, incluindo o Carnatal.',
    latitude: -5.8247,
    longitude: -35.2369,
    address: 'Av. Prudente de Morais, 5001 - Lagoa Nova, Natal - RN',
    categoryName: 'Ponto Turístico',
    openingHours: museumHours,
    imageUrl:
      'https://images.unsplash.com/photo-1459865264687-595d652ade2e?w=800&q=80',
  },
  {
    title: 'Praia do Meio',
    description:
      'Praia urbana entre a Ponta Negra e a Areia Preta, com calçadão, ciclovia e quiosques ao longo da orla.',
    latitude: -5.7892,
    longitude: -35.1986,
    address: 'Praia do Meio, Natal - RN',
    categoryName: 'Natureza',
    openingHours: beachHours,
    imageUrl:
      'https://images.unsplash.com/photo-1473496163314-42ba877370f8?w=800&q=80',
  },
  {
    title: 'Camarões Potiguar',
    description:
      'Unidade do Camarões no bairro de Tirol, opção prática para quem está no centro ou na zona sul da cidade.',
    latitude: -5.8123,
    longitude: -35.2078,
    address: 'Av. Eng. Roberto Freire, 1110 - Capim Macio, Natal - RN',
    categoryName: 'Alimentação',
    openingHours: restaurantHours,
    imageUrl:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  },
];

type PlaceSignalSeed = {
  placeTitle: string;
  type: SignalType;
  priority: number;
  rating?: number;
  message: string;
  response?: string;
  respondedBy?: 'gestor' | 'admin';
};

const placeSignals: PlaceSignalSeed[] = [
  {
    placeTitle: 'Camarões Ponta Negra',
    type: SignalType.ELOGIO,
    priority: 0,
    rating: 5,
    message:
      'Comida excelente e atendimento rápido! A moqueca de camarão é imperdível.',
    response:
      'Muito obrigado pelo elogio! Ficamos felizes em receber você. Volte sempre!',
    respondedBy: 'gestor',
  },
  {
    placeTitle: 'Praiamar Natal Hotel',
    type: SignalType.SINALIZACAO,
    priority: 3,
    message:
      'Fila grande no check-in no fim de semana. Sugiro mais atendentes na recepção.',
  },
  {
    placeTitle: 'Forte dos Reis Magos',
    type: SignalType.SINALIZACAO,
    priority: 2,
    message:
      'Horário de funcionamento no site estava desatualizado. Quase perdi a visita.',
    response:
      'Obrigado por avisar! Atualizamos as informações no site e reforçamos a sinalização na entrada.',
    respondedBy: 'gestor',
  },
  {
    placeTitle: 'Parque Estadual Dunas de Natal',
    type: SignalType.ELOGIO,
    priority: 0,
    rating: 4,
    message: 'Trilha bem conservada e guias muito atenciosos. Experiência incrível!',
  },
  {
    placeTitle: 'Praia de Ponta Negra',
    type: SignalType.ELOGIO,
    priority: 0,
    rating: 5,
    message: 'Pôr do sol lindo e estrutura ótima na orla!',
  },
  {
    placeTitle: 'Forte dos Reis Magos',
    type: SignalType.ELOGIO,
    priority: 0,
    rating: 5,
    message: 'História fascinante e vista linda do mar.',
  },
  {
    placeTitle: 'Praia de Ponta Negra',
    type: SignalType.SINALIZACAO,
    priority: 4,
    message:
      'Lixeira transbordando próximo aos quiosques na altura da Via Costeira. Precisa de coleta urgente.',
  },
];

async function upsertCategory(category: (typeof categories)[number]) {
  return prisma.category.upsert({
    where: { name: category.name },
    update: {
      description: category.description,
      icon: category.icon,
    },
    create: category,
  });
}

async function upsertUser(user: (typeof users)[number]) {
  const password = await bcrypt.hash(user.password, 10);
  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      role: user.role,
      password,
      phone: 'phone' in user ? user.phone : undefined,
    },
    create: {
      email: user.email,
      name: user.name,
      role: user.role,
      password,
      phone: 'phone' in user ? user.phone : undefined,
    },
  });
}

async function upsertPlace(
  gestorId: string,
  categoryId: string,
  place: PlaceSeed,
) {
  const existing = await prisma.place.findFirst({
    where: { title: place.title },
  });

  const data = {
    title: place.title,
    description: place.description,
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address,
    imageUrl: place.imageUrl,
    available: place.available ?? true,
    links: place.links ?? [],
    openingHours: (place.openingHours ?? {}) as Prisma.InputJsonValue,
    categoryId,
    createdById: gestorId,
  };

  if (existing) {
    return prisma.place.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.place.create({ data });
}

async function seedPlaceSignals(
  turistaId: string,
  gestorId: string,
  adminId: string,
  placeMap: Record<string, string>,
) {
  for (const signal of placeSignals) {
    const placeId = placeMap[signal.placeTitle];
    if (!placeId) continue;

    await prisma.placeSignal.deleteMany({
      where: { placeId, userId: turistaId, message: signal.message },
    });

    const respondedById =
      signal.respondedBy === 'admin'
        ? adminId
        : signal.respondedBy === 'gestor'
          ? gestorId
          : undefined;

    await prisma.placeSignal.create({
      data: {
        placeId,
        userId: turistaId,
        type: signal.type,
        priority: signal.priority,
        rating: signal.rating,
        message: signal.message,
        response: signal.response,
        respondedAt: signal.response ? new Date() : undefined,
        respondedById: signal.response ? respondedById : undefined,
      },
    });
  }
}

async function seedFavorites(
  turistaId: string,
  placeTitles: string[],
  placeMap: Record<string, string>,
) {
  for (const title of placeTitles) {
    const placeId = placeMap[title];
    if (!placeId) continue;

    await prisma.favorite.upsert({
      where: {
        userId_placeId: { userId: turistaId, placeId },
      },
      update: {},
      create: { userId: turistaId, placeId },
    });
  }
}

async function main() {
  const categoryRecords = await Promise.all(
    categories.map((category) => upsertCategory(category)),
  );
  const categoryMap = Object.fromEntries(
    categoryRecords.map((category) => [category.name, category.id]),
  );

  const userRecords = await Promise.all(users.map((user) => upsertUser(user)));
  const userMap = Object.fromEntries(
    userRecords.map((user) => [user.email, user]),
  );

  await prisma.user.deleteMany({
    where: { email: 'guia@rotapotiguar.com' },
  });

  const gestor = userMap['gestor@rotapotiguar.com'];
  const admin = userMap['admin@rotapotiguar.com'];
  const turista = userMap['turista@rotapotiguar.com'];

  const placeRecords = await Promise.all(
    places.map((place) =>
      upsertPlace(
        gestor.id,
        categoryMap[place.categoryName],
        place,
      ),
    ),
  );
  const placeMap = Object.fromEntries(
    placeRecords.map((place) => [place.title, place.id]),
  );

  await seedPlaceSignals(turista.id, gestor.id, admin.id, placeMap);

  await seedFavorites(turista.id, [
    'Praia de Ponta Negra',
    'Camarões Ponta Negra',
    'Forte dos Reis Magos',
  ], placeMap);

  await backfillMissingSignalCodes(prisma);

  console.log('Seed concluído:');
  console.log(`  ${categoryRecords.length} categorias`);
  console.log(`  ${userRecords.length} usuários`);
  console.log(`  ${placeRecords.length} locais (cadastrados pelo gestor)`);
  console.log(`  ${placeSignals.length} sinalizações de locais`);
  console.log('  3 favoritos');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
