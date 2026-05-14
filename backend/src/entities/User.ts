import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "./BaseEntity";

export enum UserRole {
  ADMIN = "ADMIN",
  REGULAR = "REGULAR",
}

@Entity("users")
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.REGULAR,
  })
  role: UserRole;

  constructor(email?: string, name?: string, password?: string) {
    super();
    if (email && name && password) {
      this.email = email;
      this.name = name;
      this.password = password;
    }
  }
}
