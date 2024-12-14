import { NotFoundException } from '@nestjs/common';

export abstract class BaseRepository<T extends { id: number }> {
  protected items: T[] = [];
  private nextId = 0;

  findOneByIdOrFail(id: number): T {
    const item = this.items.find((item) => item.id === id);
    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
    return item;
  }

  findAll(): T[] {
    return this.items;
  }

  create(dto: Omit<T, 'id'>) {
    const id = ++this.nextId;
    const item = { ...dto, id } as T;
    this.items.push(item);

    return item;
  }
}
