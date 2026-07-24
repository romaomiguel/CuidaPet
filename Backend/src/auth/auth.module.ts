import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error(
            '[AuthModule] JWT_SECRET não está definido. ' +
            'Configure a variável de ambiente antes de iniciar o servidor.',
          );
        }
        return {
          secret,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          signOptions: { expiresIn: (process.env.ACCESS_TOKEN_TTL ?? '15m') as any },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
