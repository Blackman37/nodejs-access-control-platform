import type { FastifyPluginAsync } from "fastify";

const healthResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["status"],
  properties: {
    status: { type: "string", const: "ok" },
  },
} as const;

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

  // TODO: Add a dependency-aware readiness endpoint when the service gains
  // dependencies that are required to serve traffic safely.
};
