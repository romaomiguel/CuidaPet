import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { PetsittersModule } from './petsitters/petsitters.module';
import { PartnersModule } from './partners/partners.module';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ChatModule } from './chat/chat.module';
import { LocationCheckInsModule } from './location-checkins/location-checkins.module';
import { SupportMessagesModule } from './support-messages/support-messages.module';
import { ServiceSuggestionsModule } from './service-suggestions/service-suggestions.module';

@Module({
  imports: [
    // Limite GLOBAL, generoso o bastante pra navegação normal (várias chamadas por
    // página: listagens, perfil, buscas). Rotas mais sensíveis (auth, uploads, match)
    // sobrescrevem esse valor via @Throttle({ default: {...} }) nos próprios controllers.
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    StorageModule,
    UsersModule,
    PetsittersModule,
    PartnersModule,
    AuthModule,
    PetsModule,
    BookingsModule,
    ReviewsModule,
    ChatModule,
    LocationCheckInsModule,
    SupportMessagesModule,
    ServiceSuggestionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guard global — sem isso, ThrottlerModule.forRoot só registra a config, não aplica
    // em nenhuma rota. Antes só o AuthController tinha throttling (via @UseGuards local).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
