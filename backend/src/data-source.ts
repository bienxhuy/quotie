import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

import { User } from "./entities/User";
import { RefreshToken } from "./entities/RefreshToken";
import { Quote } from "./entities/Quote";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_NAME ?? "demosutdb",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [User, RefreshToken, Quote],
  migrations: [path.join(__dirname, "migrations/*.{ts,js}")],
});