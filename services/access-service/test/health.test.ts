import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import type { FastifyInstance } from "fastify";

import { buildApp } from "../src/app.ts";

describe("GET /health", () => {
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

  it("reports that the process is alive", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
    assert.deepEqual(response.json(), { status: "ok" });
  });
});
