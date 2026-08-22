import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadHttpConfig, loadPostgresConfig } from "../src/config.ts";

describe("loadHttpConfig", () => {
  it("uses safe local defaults", () => {
    assert.deepEqual(loadHttpConfig({}), {
      host: "127.0.0.1",
      port: 3000,
    });
  });

  it("accepts an explicitly configured host and port", () => {
    assert.deepEqual(
      loadHttpConfig({
        HOST: "127.0.0.1",
        PORT: "8080",
      }),
      {
        host: "127.0.0.1",
        port: 8080,
      },
    );
  });

  for (const port of ["", "0", "1.5", "65536", "not-a-port"]) {
    it(`rejects invalid port ${JSON.stringify(port)}`, () => {
      assert.throws(
        () => loadHttpConfig({ PORT: port }),
        /PORT must be an integer between 1 and 65535/,
      );
    });
  }

  it("rejects an empty host", () => {
    assert.throws(() => loadHttpConfig({ HOST: "  " }), /HOST must not be empty/);
  });
});

describe("loadPostgresConfig", () => {
  it("loads the PostgreSQL connection string", () => {
    assert.deepEqual(
      loadPostgresConfig({
        DATABASE_URL: "postgresql://user:password@postgres:5432/access_service",
      }),
      {
        connectionString:
          "postgresql://user:password@postgres:5432/access_service",
      },
    );
  });

  it("rejects a missing PostgreSQL connection string", () => {
    assert.throws(
      () => loadPostgresConfig({}),
      /DATABASE_URL must not be empty/,
    );
  });

  it("rejects an empty PostgreSQL connection string", () => {
    assert.throws(
      () => loadPostgresConfig({ DATABASE_URL: "  " }),
      /DATABASE_URL must not be empty/,
    );
  });
});
