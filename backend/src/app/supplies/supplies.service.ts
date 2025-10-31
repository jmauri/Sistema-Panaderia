import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supply } from './supply.entity';

@Injectable()
export class SuppliesService {
  constructor(
    @InjectRepository(Supply)
    public repo: Repository<Supply>,
  ) {}

  async findAll() {
    return this.repo.find({
      order: { name: 'ASC' },
    });
  }

  async createOrUpdate(body: any) {
    //Normalizar nombre
    const name = body.name.trim().toUpperCase();

    //Evitar registrar “AGUA”
    if (name === 'AGUA') {
      throw new Error('El agua no se registra como insumo de inventario.');
    }

    //Buscar si ya existe el insumo (comparando en mayúsculas)
    const existing = await this.repo
      .createQueryBuilder('s')
      .where('UPPER(s.name) = :name', { name })
      .getOne();

    if (existing) {
      //Actualiza cantidad si ya existe
      existing.quantity += Number(body.quantity) || 0;
      existing.unit = body.unit;
      existing.type = body.type;
      return this.repo.save(existing);
    }

    //Crea nuevo insumo si no existe
    const nuevo = this.repo.create({
      name,
      type: body.type,
      quantity: Number(body.quantity) || 0,
      unit: body.unit,
    });

    return this.repo.save(nuevo);
  }

  async delete(id: number) {
    return this.repo.delete(id);
  }

  // método utilizado por OrdersService
  async updateQuantity(name: string, delta: number) {
    const normalizedName = name.trim().toUpperCase();

    // Buscar insumo correspondiente
    const supply = await this.repo.findOne({ where: { name: normalizedName } });
    if (!supply) {
      console.warn(`⚠️ No se encontró el insumo "${normalizedName}" para actualizar stock.`);
      return;
    }

    // No descontar agua ni insumos no inventariables
    if (normalizedName === 'AGUA' || supply.nonInventariable) {
      return;
    }

    supply.quantity = Math.max(0, supply.quantity + delta);
    await this.repo.save(supply);
  }
}
