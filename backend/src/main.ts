import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './app/users/users.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function createDefaultAdmin(dataSource: DataSource) {
  const repo = dataSource.getRepository(User);
  const existing = await repo.findOne({ where: { email: 'admin@panaderia.com' } });

  if (!existing) {
    const hash = await bcrypt.hash('1234', 10);
    const admin = repo.create({
      name: 'Admin',
      username: 'admin',
      email: 'admin@panaderia.com',
      password: hash,
      role: 'ADMIN',
    });
    await repo.save(admin);
    console.log('Admin user created: admin@panaderia.com / 1234');
  } else {
    console.log('Admin user already exists');
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Esperamos a que la conexión de TypeORM esté lista
  const dataSource = app.get(DataSource);
  await createDefaultAdmin(dataSource);

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Backend listening on http://localhost:${process.env.PORT || 3000}`);
}

bootstrap();
