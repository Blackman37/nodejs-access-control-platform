export const readyResponseSchema = {
    type: "object",
    additionalProperties: false,
    required: ["status", "dependencies"],
    properties: {
        status: {
            type: "string",
            const: "ready"
        },
        dependencies: {
            type: "object",
            properties: {
                postgres: {
                    type: "string",
                    const: "ready"
                }
            },
            required: ["postgres"],
            additionalProperties: false,
        }
    },
} as const;

export const notReadyResponseSchema = {
    type: "object",
    additionalProperties: false,
    required: ["status", "dependencies"],
    properties: {
        status: {
            type: "string",
            const: "not_ready"
        },
        dependencies: {
            type: "object",
            properties: {
                postgres: {
                    type: "string",
                    const: "not_ready"
                }
            },
            required: ["postgres"],
            additionalProperties: false,
        }
    },
} as const;