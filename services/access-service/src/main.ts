import { buildApp } from "./app.ts";
import { loadHttpConfig } from "./config.ts";

const app = buildApp();

let isShuttingDown = false;

async function shutDown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  app.log.info({ signal }, "shutdown requested");

  try {
    await app.close();
    app.log.info("shutdown complete");
  } catch (error: unknown) {
    app.log.error({ err: error }, "shutdown failed");
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => void shutDown("SIGINT"));
process.once("SIGTERM", () => void shutDown("SIGTERM"));

try {
  const httpConfig = loadHttpConfig(process.env);
  await app.listen(httpConfig);
} catch (error: unknown) {
  app.log.fatal({ err: error }, "startup failed");
  process.exitCode = 1;
  await app.close();
}
