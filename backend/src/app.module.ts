import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './app/users/users.module';
import { AuthModule } from './app/auth/auth.module';
import { RecipesModule } from './app/recipes/recipes.module';
import { OrdersModule } from './app/orders/orders.module';
import { SuppliesModule } from './app/supplies/supplies.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
    }),
    UsersModule,
    AuthModule,
    RecipesModule,
    OrdersModule,
    SuppliesModule,
  ],
})
export class AppModule {}
