export interface HttpConfig {
  host: string;
  port: number;
}

export interface PostgresConfig {
  connectionString: string;
}

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;

export function loadHttpConfig(environment: NodeJS.ProcessEnv): HttpConfig {
  const host = environment.HOST ?? DEFAULT_HOST;
  const portValue = environment.PORT;

  if (host.trim() === "") {
    throw new Error("HOST must not be empty");
  }

  if (portValue === undefined) {
    return { host, port: DEFAULT_PORT };
  }

  if (!/^\d+$/.test(portValue)) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  const port = Number(portValue);

  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return { host, port };
}

export function loadPostgresConfig(environment: NodeJS.ProcessEnv): PostgresConfig {
  const connectionString = environment.DATABASE_URL;

  if (typeof connectionString !== "string" || connectionString.trim() === "") {
    throw new Error("DATABASE_URL must not be empty");
  }

  return { connectionString };
}
