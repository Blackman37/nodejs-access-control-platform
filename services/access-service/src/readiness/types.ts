export type ReadinessState = "ready" | "not_ready";

export type PostgresReadinessCheck = () => Promise<void>;

export type ReadinessResponse<State extends ReadinessState> = {
  status: State;
  dependencies: {
    postgres: State;
  };
};
