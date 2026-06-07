import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@cuidapet.com';
  const password = await bcrypt.hash('admin123', 10);

  const existingAdmin = await prisma.user.findUnique({ where: { email } });

  if (existingAdmin) {
    console.log('Admin user already exists!');
    return;
  }

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email,
      password,
      role: 'admin',
    },
  });

  console.log('Admin user created successfully:', {
    email: admin.email,
    password: 'admin123'
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
