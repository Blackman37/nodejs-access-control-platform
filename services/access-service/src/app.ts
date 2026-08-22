import Fastify from "fastify";
import type { FastifyInstance } from "fastify";

import { registerHealthRoutes } from "./health/routes.ts";
import { registerReadinessRoutes } from "./readiness/routes.ts";
import type { PostgresReadinessCheck } from "./readiness/types.ts";

export interface BuildAppOptions {
  logger?: boolean;
  postgresReadinessCheck: PostgresReadinessCheck;
}

export function buildApp(options: BuildAppOptions): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true
  });

  app.register(registerHealthRoutes);
  app.register(registerReadinessRoutes, {
    postgresReadinessCheck: options.postgresReadinessCheck
  });

  return app;
}
