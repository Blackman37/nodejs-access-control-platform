export interface HttpConfig {
  host: string;
  port: number;
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
