# Access Control Platform — Project Brief

## Goal

Build a small, locally runnable Node.js system that demonstrates practical backend architecture through multi-tenant authorization, service boundaries, reliable event delivery, caching, and failure handling.

The project follows one complete business scenario rather than trying to implement a full SaaS platform. Some technologies are intentionally included for demonstration; their production trade-offs are documented in [PROJECT_INTENT.md](PROJECT_INTENT.md).

## Business scenario

The system represents a B2B application in which users belong to organizations and work with projects.

A user can have different access in different organizations. For example, the same user may be an administrator in one organization, a regular member in another, and have no access to a third.

The main demonstration is:

1. An authenticated user creates an organization.
2. An administrator changes the role of a seeded member.
3. The user attempts to update a project.
4. The system allows or denies the operation using current tenant-scoped permissions.
5. Committed business changes are published as Kafka events.
6. Successful committed changes appear in a queryable audit history.
7. Selected dependency failures are demonstrated without losing committed business data.

## Architecture

The repository contains three small Node.js services and one Docker Compose environment.

### Access Service

Owns:

- organizations and memberships;
- organization roles and permissions;
- authorization decisions;
- authorization cache invalidation;
- its PostgreSQL data and transactional outbox.

Uses Redis to cache derived authorization data. PostgreSQL remains the source of truth.

### Project Service

Owns:

- projects;
- project mutations;
- its PostgreSQL data and transactional outbox.

Before a protected operation, it synchronously asks the Access Service whether the actor may perform the requested action in the given organization.

If authorization cannot be verified, the operation is denied or returns a service-unavailable response. It never fails open.

### Audit Service

Consumes committed integration events from Kafka and stores an audit projection in MongoDB.

Processing is idempotent by `eventId`, so receiving the same Kafka event more than once does not create duplicate audit records.

The first version audits successful mutations through business events produced by the transactional outbox. Denied authorization attempts remain in structured application logs and may be added to the durable audit stream later.

## Data flow

For a project update:

1. The client sends a JWT and an update request to the Project Service.
2. The Project Service validates the identity and asks the Access Service for an authorization decision.
3. The Access Service reads authorization data from Redis or falls back to PostgreSQL.
4. If allowed, the Project Service updates the project and writes `project.updated` to its outbox in one SQL transaction.
5. An outbox publisher sends the event to Kafka.
6. The Audit Service consumes the event and writes an audit document to MongoDB.

The API response does not wait for the audit projection to finish.

## Role of each technology

| Technology | Responsibility |
| --- | --- |
| Node.js and TypeScript | Service implementation and shared contracts. |
| PostgreSQL | Authoritative transactional business data, constraints, locking, and outbox records. |
| Redis | Disposable authorization cache and cache invalidation demonstration. |
| Kafka | Durable asynchronous delivery of committed integration events. |
| MongoDB | Query-oriented, document-shaped audit projection. |
| Keycloak | Local OpenID Connect identity provider and JWT issuer. |
| Docker Compose | Reproducible local runtime for services and infrastructure. |

The local environment also starts Kafka UI, Mongo Express, and Redis Commander. These development-only tools make event topics, audit documents, and cache entries immediately visible during the demo. They are bound for local access and are not part of the production architecture.

Keycloak realm data and application seeds provide the initial administrator, member, organization membership, and credentials required by the scenario. User registration and invitation flows are not part of the first version.

## Minimal API

```text
# Access Service
POST   /v1/organizations
PATCH  /v1/organizations/:organizationId/members/:userId/role
POST   /internal/authorization/check

# Project Service
POST   /v1/organizations/:organizationId/projects
PATCH  /v1/organizations/:organizationId/projects/:projectId

# Audit Service
GET    /v1/organizations/:organizationId/audit-events
```

Additional health and metrics endpoints are operational interfaces, not business scope.

## Core guarantees

- A valid JWT proves identity but does not grant tenant access by itself.
- Every protected operation is scoped to an organization.
- Changing IDs in a URL cannot expose another organization's data.
- PostgreSQL is authoritative for roles and memberships.
- Redis being unavailable does not result in an allow decision; the Access Service falls back to PostgreSQL.
- A business mutation and its outbox event are committed atomically.
- Kafka delivery is at least once, so consumers are idempotent.
- MongoDB audit data may be eventually consistent and is never used for authorization.
- Authorization cache TTL is configurable and defaults to 60 seconds, providing an explicit upper bound for stale cached data.
- Cache-expiration tests use a shorter test configuration or controlled time and do not wait for the production-like default TTL.

## Failure scenarios to demonstrate

### Kafka is unavailable

The business transaction succeeds and its event remains in the PostgreSQL outbox. After Kafka recovers, the publisher delivers the event.

### The Audit Service receives a duplicate event

The unique `eventId` makes repeated processing harmless and only one audit document exists.

### Redis is unavailable

The Access Service reads current permissions from PostgreSQL. If authoritative data cannot be read, protected access is denied.

### A user changes the organization ID

Tenant-scoped authorization and data access reject the request without exposing another organization's resource.

## Deliberate non-goals

- a complete user-management product;
- durable audit events for denied attempts in the first version;
- custom authentication or password storage;
- dynamic role and policy editors;
- dozens of CRUD endpoints;
- exactly-once delivery claims;
- Kubernetes or cloud deployment;
- production high availability and disaster recovery;
- a complete UI;
- using every available infrastructure feature.

## Definition of done

The project is complete when a reviewer can:

1. start the system with Docker Compose;
2. authenticate using local Keycloak;
3. use seeded administrator and member identities, then change the member's organization role;
4. observe an allowed and a denied project update;
5. inspect authorization data in Redis Commander;
6. observe integration events in Kafka UI;
7. query the resulting audit history in Mongo Express;
8. stop Kafka and verify later outbox recovery;
9. replay an event and verify idempotent audit processing;
10. understand the guarantees and production caveats from the documentation.

The full demonstration should take approximately 15–20 minutes.
