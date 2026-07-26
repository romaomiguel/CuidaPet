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

/**
 * Script pontual: gera uma senha nova, forte e aleatória para um usuário JÁ EXISTENTE
 * (qualquer role) e grava só o hash no banco. A senha em texto plano só é impressa
 * aqui, uma vez, neste terminal — nunca é salva em arquivo nem enviada a lugar nenhum.
 *
 * Uso: npx ts-node prisma/rotate-user-password.ts <email>
 */
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: npx ts-node prisma/rotate-user-password.ts <email>');
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Nenhum usuário encontrado com o e-mail: ${email}`);
    process.exitCode = 1;
    return;
  }

  const rawPassword = crypto.randomBytes(9).toString('base64url');
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  await prisma.user.update({ where: { email }, data: { password: passwordHash } });

  console.log('Senha trocada com sucesso.');
  console.log('Email:', email);
  console.log('Role:', user.role);
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
