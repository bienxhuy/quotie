import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuotesTable1776384000000 implements MigrationInterface {
  name = "CreateQuotesTable1776384000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "quotes" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "text" text NOT NULL, "ownerId" integer NOT NULL, CONSTRAINT "PK_4c2c66f0d862f95f5f7c27f0f2c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d41385f7c58f2e31b58c0d5f2" ON "quotes" ("ownerId")`
    );
    await queryRunner.query(
      `ALTER TABLE "quotes" ADD CONSTRAINT "FK_6d41385f7c58f2e31b58c0d5f29" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quotes" DROP CONSTRAINT "FK_6d41385f7c58f2e31b58c0d5f29"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_6d41385f7c58f2e31b58c0d5f2"`);
    await queryRunner.query(`DROP TABLE "quotes"`);
  }
}
