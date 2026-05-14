import { DataSource, Repository } from "typeorm";
import { User } from "../entities/User";

export class UserRepository {
  private readonly repo: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(User);
  }

  async save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  async findById(id: number): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }
}
