import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createPostgresAdapter } from "../../src/pg.ts";

const databaseUrl = process.env.DATABASE_URL;

assert.ok(
    databaseUrl,
    "DATABASE_URL must be set for PostgreSQL integration tests",
);

describe("PostgreSQL adapter", () => {
    it("reports readiness when PostgreSQL is available", async () => {
        const adapter = createPostgresAdapter({ connectionString: databaseUrl })

        try {
            await assert.doesNotReject(async () => adapter.checkReadiness())
        } finally {
            await adapter.close()
        }
    })

    it("reports failures with PostgreSQL misconfig", async () => {
        const adapter = createPostgresAdapter({ connectionString: "something-bad" })

        try {
            await assert.rejects(async () => adapter.checkReadiness())
        } finally {
            await adapter.close()
        }
    })
});
