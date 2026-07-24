import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

/**
 * Script pontual: gera uma senha nova, forte e aleatória para um admin JÁ EXISTENTE
 * e grava só o hash no banco. A senha em texto plano só é impressa aqui, uma vez,
 * neste terminal — nunca é salva em arquivo nem enviada a lugar nenhum.
 *
 * Uso: npx ts-node prisma/rotate-admin-password.ts [email]
 * Se omitir o email, usa admin@cuidapet.com.
 */
async function main() {
  const email = process.argv[2] ?? 'admin@cuidapet.com';

  const admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    console.error(`Nenhum usuário encontrado com o e-mail: ${email}`);
    process.exitCode = 1;
    return;
  }
  if (admin.role !== 'admin') {
    console.error(`O usuário ${email} não tem role 'admin' (role atual: ${admin.role}). Abortando.`);
    process.exitCode = 1;
    return;
  }

  const rawPassword = crypto.randomBytes(18).toString('base64url');
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  await prisma.user.update({ where: { email }, data: { password: passwordHash } });

  console.log('Senha trocada com sucesso.');
  console.log('Email:', email);
  console.log('Senha nova (copie agora, não será mostrada de novo):', rawPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
