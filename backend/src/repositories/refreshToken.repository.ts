import { DataSource, MoreThan, Repository } from "typeorm";
import { RefreshToken } from "../entities/RefreshToken";

export class RefreshTokenRepository {
  private readonly repo: Repository<RefreshToken>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(RefreshToken);
  }

  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    return await this.repo.save(refreshToken);
  }

  async findValidByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return await this.repo.findOne({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ["user"],
    });
  }
  
  async updateLastUsed(id: number): Promise<void> {
    await this.repo.update(id, { lastUsedAt: new Date() });
  }

  async revoke(id: number): Promise<void> {
    await this.repo.update(id, { revoked: true });
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await this.repo.update({ tokenHash }, { revoked: true });
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.repo.update({ userId, revoked: false }, { revoked: true });
  }
}
