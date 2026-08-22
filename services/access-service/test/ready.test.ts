import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../src/app.ts";

describe("GET /ready", () => {
  describe("when PostgreSQL is available", () => {
    let app: FastifyInstance;
    before(async () => {
      app = buildApp({
        logger: false,
        postgresReadinessCheck: async () => undefined
      });
      await app.ready();
    });

    after(async () => {
      await app.close();
    });

    it("reports ready when PostgreSQL check succeeds", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/ready",
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
      assert.deepEqual(response.json(), {
        status: "ready",
        dependencies: {
          postgres: "ready"
        }
      });
    });
  })

  describe("when PostgreSQL is unavailable", () => {
    let app: FastifyInstance;
    before(async () => {
      app = buildApp({
        logger: false,
        postgresReadinessCheck: async () => {
          throw new Error("PostgreSQL unavailable");
        }
      });
      await app.ready();
    });

    after(async () => {
      await app.close();
    });

    it("reports fail when PostgreSQL check fails", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/ready",
      });

      assert.equal(response.statusCode, 503);
      assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
      assert.deepEqual(response.json(), {
        status: "not_ready",
        dependencies: {
          postgres: "not_ready"
        }
      });
    });
  })
});
