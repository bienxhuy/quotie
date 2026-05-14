import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1773334316920 implements MigrationInterface {
    name = 'Migration1773334316920'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "PK_7d8bee0204106019488c4c50ffa"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "userId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "PK_7d8bee0204106019488c4c50ffa"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" character varying NOT NULL`);
    }

}
