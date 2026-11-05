import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { describe, it, beforeAll, afterAll, expect } from "vitest";
import supertest from "supertest";
import { ProductModule } from "./product.module";

describe("ProductController (integration)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProductModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /products responde 200 com array de seis itens", async () => {
    const res = await supertest(app.getHttpServer()).get("/products").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(6);
  });

  it("GET /products/:id com id válido responde 200 com a poção", async () => {
    const listRes = await supertest(app.getHttpServer()).get("/products").expect(200);
    const firstId = listRes.body[0].id as string;
    const res = await supertest(app.getHttpServer()).get(`/products/${firstId}`).expect(200);
    expect(res.body.id).toBe(firstId);
  });

  it("GET /products/:id com id desconhecido responde 404", async () => {
    await supertest(app.getHttpServer())
      .get("/products/00000000-0000-0000-0000-000000000000")
      .expect(404);
  });
});
