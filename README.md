# Access Control Platform

A compact Node.js backend project exploring multi-tenant authorization, service boundaries, reliable event delivery, caching, auditability, and failure handling.

The system follows one B2B access-control scenario across three focused services:

- **Access Service** owns organizations, memberships, roles, and authorization decisions.
- **Project Service** owns projects and requests tenant-scoped authorization from the Access Service.
- **Audit Service** consumes integration events and builds a queryable audit history.

The planned local environment uses PostgreSQL, Redis, Kafka, MongoDB, Keycloak, and Docker Compose. Each technology has a specific responsibility; the project does not assume that this level of infrastructure is necessary for every production system.

## Current status

The root npm workspace and shared TypeScript foundation are initialized. The Access Service has its first executable Fastify boundary, and the local Compose environment now includes PostgreSQL plus a versioned initial schema for organizations and memberships. The application does not connect to PostgreSQL yet; that runtime boundary remains a separate feature.

### Implementation Progress

```text
[###-------] 30%
```

Each filled block represents 10% of the implementation. Update the bar and percentage as the project moves forward.

## Local development

Build and start the Access Service development container:

```shell
docker compose up --build
```

Compose starts PostgreSQL, applies pending Access Service migrations through a one-shot migration container, and starts the Access Service. It mounts the service source directory into the application container, and Node restarts the process when a TypeScript source file changes. Stop the foreground process with `Ctrl+C`, then remove its containers and network when they are no longer needed:

```shell
docker compose down
```

The PostgreSQL port is available only inside the Compose network, and its data is retained in a named volume across ordinary `docker compose down` operations. Re-run pending migrations explicitly with:

```shell
docker compose run --build --rm access-service-migrate
```

The service is available on `127.0.0.1:3000` by default. Set `ACCESS_SERVICE_PORT` before running Compose to select a different host port. Inside the container, the service listens on `0.0.0.0:3000` so Docker can forward host traffic to it. Its current operational endpoint is:

```text
GET /health
```

Run the repository checks in an ephemeral development container:

```shell
docker compose run --build --rm access-service npm run typecheck
docker compose run --rm access-service npm test
```

Build the production image target, which compiles TypeScript and contains only runtime dependencies:

```shell
docker build --target production -t access-control-platform/access-service:local .
```

## Documentation

- [Project brief](docs/PROJECT_BRIEF.md) — scope, architecture, guarantees, failure scenarios, and definition of done.
- [Project intent and production caveats](docs/PROJECT_INTENT.md) — rationale, alternatives, and limitations of the demonstration architecture.

## Intended outcome

A reviewer should be able to run the complete environment locally, follow an allowed and a denied authorization flow, inspect the resulting events and audit data, and observe how the system behaves when selected dependencies are unavailable.
