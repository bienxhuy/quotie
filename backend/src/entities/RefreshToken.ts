import { Entity, Column, ManyToOne, JoinColumn, Index, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { User } from "./User";

@Entity("refresh_tokens")
export class RefreshToken extends BaseEntity {
  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Index()
  @Column()
  tokenHash: string;

  @Column({ type: "timestamptz" })
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @Column({ type: "timestamptz", nullable: true })
  lastUsedAt: Date | null;

  constructor(userId?: number, tokenHash?: string, expiresAt?: Date) {
    super();
    if (userId && tokenHash && expiresAt) {
      this.userId = userId;
      this.tokenHash = tokenHash;
      this.expiresAt = expiresAt;
      this.revoked = false;
      this.lastUsedAt = null;
    }
  }
}
