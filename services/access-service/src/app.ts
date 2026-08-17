import Fastify from "fastify";
import type { FastifyInstance } from "fastify";

import { registerHealthRoutes } from "./health/routes.ts";

export interface BuildAppOptions {
  logger?: boolean;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  app.register(registerHealthRoutes);

  return app;
}
