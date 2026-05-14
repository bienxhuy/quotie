import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { User } from "./User";

@Entity("quotes")
export class Quote extends BaseEntity {
  @Column({ type: "text" })
  text: string;

  @Index()
  @Column()
  ownerId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ownerId" })
  owner: User;

  constructor(text?: string, ownerId?: number) {
    super();
    if (text !== undefined && ownerId !== undefined) {
      this.text = text;
      this.ownerId = ownerId;
    }
  }
}
