import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Abstract base class shared by all entities.
 * No @Entity() here — this class is never mapped to its own table.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
