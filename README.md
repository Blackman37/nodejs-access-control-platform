# Access Control Platform

A compact Node.js backend project exploring multi-tenant authorization, service boundaries, reliable event delivery, caching, auditability, and failure handling.

The system follows one B2B access-control scenario across three focused services:

- **Access Service** owns organizations, memberships, roles, and authorization decisions.
- **Project Service** owns projects and requests tenant-scoped authorization from the Access Service.
- **Audit Service** consumes integration events and builds a queryable audit history.

The planned local environment uses PostgreSQL, Redis, Kafka, MongoDB, Keycloak, and Docker Compose. Each technology has a specific responsibility; the project does not assume that this level of infrastructure is necessary for every production system.

## Current status

The root npm workspace and shared TypeScript foundation are initialized. The Access Service now has its first executable Fastify boundary, including a liveness endpoint, structured request logging, validated runtime configuration, graceful shutdown, and HTTP-level tests.

### Implementation Progress

```text
[#---------] 10%
```

Each filled block represents 10% of the implementation. Update the bar and percentage as the project moves forward.

## Local development

Use the Node.js version declared in `.nvmrc`, install the locked dependencies, and start the Access Service:

```shell
nvm use
npm ci
npm run dev:access
```

The service listens on `127.0.0.1:3000` by default. `HOST` and `PORT` can override those values; a container can set `HOST=0.0.0.0` when it must accept traffic through its network interface. Its current operational endpoint is:

```text
GET /health
```

Run the repository checks from the root:

```shell
npm run typecheck
npm run build
npm test
```

## Documentation

- [Project brief](docs/PROJECT_BRIEF.md) — scope, architecture, guarantees, failure scenarios, and definition of done.
- [Project intent and production caveats](docs/PROJECT_INTENT.md) — rationale, alternatives, and limitations of the demonstration architecture.

## Intended outcome

A reviewer should be able to run the complete environment locally, follow an allowed and a denied authorization flow, inspect the resulting events and audit data, and observe how the system behaves when selected dependencies are unavailable.
