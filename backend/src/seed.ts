import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './app/users/users.entity';
import * as bcrypt from 'bcrypt';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'panaderia_db',
  entities: [User],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  const existing = await repo.findOne({ where: { email: 'admin@panaderia.com' } });
  if (!existing) {
    const hash = await bcrypt.hash('1234', 10);
    const admin = repo.create({ name: 'Admin', username: 'admin', email: 'admin@panaderia.com', password: hash, role: 'ADMIN' });
    await repo.save(admin);
    console.log('Admin user created: admin@panaderia.com / 1234');
  } else {
    console.log('Admin user already exists');
  }
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
