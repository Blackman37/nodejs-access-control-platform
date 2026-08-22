import type { FastifyPluginAsync } from "fastify";
import { notReadyResponseSchema, readyResponseSchema } from "./schemas.ts";
import type { PostgresReadinessCheck, ReadinessResponse } from "./types.ts";

interface ReadinessRouteOptions {
  postgresReadinessCheck: PostgresReadinessCheck;
}

export const registerReadinessRoutes: FastifyPluginAsync<ReadinessRouteOptions> =
  async (app, options) => {
    app.get(
      "/ready",
      {
        schema: {
          response: {
            200: readyResponseSchema,
            503: notReadyResponseSchema,
          },
        },
      },
      async (_req, res) => {
        try {
          await options.postgresReadinessCheck();

          return {
            status: "ready",
            dependencies: {
              postgres: "ready",
            },
          } satisfies ReadinessResponse<"ready">;
        } catch (error: unknown) {
          app.log.warn({ err: error }, "PostgreSQL readiness check failed");

          return res.code(503).send({
            status: "not_ready",
            dependencies: {
              postgres: "not_ready",
            },
          } satisfies ReadinessResponse<"not_ready">);
        }
      },
    );
  };
