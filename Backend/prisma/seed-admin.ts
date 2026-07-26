import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@cuidapet.com';

  const existingAdmin = await prisma.user.findUnique({ where: { email } });

  if (existingAdmin) {
    console.log('Admin user already exists — nada foi alterado.');
    return;
  }

  // Senha aleatória forte, gerada a cada execução — nunca fixa no código.
  // Só é exibida UMA VEZ aqui no console; não fica salva em lugar nenhum além do hash no banco.
  const rawPassword = crypto.randomBytes(18).toString('base64url');
  const password = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email,
      password,
      role: 'admin',
    },
  });

  console.log('Admin user created successfully.');
  console.log('Email:', admin.email);
  console.log('Senha (copie agora, não será mostrada de novo):', rawPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
