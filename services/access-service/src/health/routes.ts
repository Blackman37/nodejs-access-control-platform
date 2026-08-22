import type { FastifyPluginAsync } from "fastify";
import { healthResponseSchema } from "./schemas.ts";

export const registerHealthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async () => ({ status: "ok" }),
  );
};
