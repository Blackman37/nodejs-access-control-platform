import { buildApp } from "./app.ts";
import { loadHttpConfig, loadPostgresConfig } from "./config.ts";
import { createPostgresAdapter } from "./pg.ts";

async function main(): Promise<void> {
  const httpConfig = loadHttpConfig(process.env);
  const postgresConfig = loadPostgresConfig(process.env);
  let isShuttingDown = false;

  const pgAdapter = createPostgresAdapter(postgresConfig);

  const app = buildApp({
    postgresReadinessCheck: pgAdapter.checkReadiness,
  });

  let closePromise: Promise<void> | undefined;

  function closeResources(): Promise<void> {
    closePromise ??= (async () => {
      try {
        await app.close();
      } finally {
        await pgAdapter.close();
      }
    })();

    return closePromise;
  }

  async function shutDown(signal: NodeJS.Signals): Promise<void> {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    app.log.info({ signal }, "shutdown requested");

    try {
      await closeResources();
      app.log.info("shutdown complete");
    } catch (error: unknown) {
      app.log.error({ err: error }, "shutdown failed");
      process.exitCode = 1;
    }
  }

  process.once("SIGINT", () => void shutDown("SIGINT"));
  process.once("SIGTERM", () => void shutDown("SIGTERM"));

  try {
    await app.listen(httpConfig);
  } catch (error: unknown) {
    app.log.fatal({ err: error }, "startup failed");
    process.exitCode = 1;

    try {
      await closeResources();
    } catch (cleanupError: unknown) {
      app.log.error({ err: cleanupError }, "startup cleanup failed");
    }
  }
}

void main().catch((error: unknown) => {
  console.error("startup failed", error);
  process.exitCode = 1;
});
