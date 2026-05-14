import { DataSource, Repository } from "typeorm";
import { Quote } from "../entities/Quote";

export class QuoteRepository {
  private readonly repo: Repository<Quote>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Quote);
  }

  async save(quote: Quote): Promise<Quote> {
    return this.repo.save(quote);
  }

  async findById(id: number): Promise<Quote | null> {
    return this.repo.findOne({
      where: { id },
      relations: ["owner"],
    });
  }

  async findPaginated(skip: number, take: number): Promise<[Quote[], number]> {
    return this.repo.findAndCount({
      relations: ["owner"],
      order: { createdAt: "DESC" },
      skip,
      take,
    });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}
