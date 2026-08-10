# Project Intent and Production Caveats

## A note to reviewers

This repository is a focused architecture demonstration, not a claim that every included technology is required for a small access-control product.

The project deliberately places several infrastructure concerns into one small, observable workflow so that their behavior can be inspected locally: tenant-aware authorization, transactional state changes, caching, asynchronous event delivery, idempotent processing, audit projections, and dependency failures.

In a real system, each additional service and data store would need to be justified by measured scale, availability requirements, team ownership, compliance needs, and operational capacity. For the expected size of this demo, a modular monolith backed only by PostgreSQL would likely be the simplest production starting point.

The engineering goal is therefore not to present this architecture as universally correct. It is to show that its costs, guarantees, limitations, and simpler alternatives are understood.

## Key architecture questions

### Why use multiple services?

The services demonstrate explicit ownership boundaries and both synchronous and asynchronous communication:

- the Access Service owns memberships, roles, and authorization decisions;
- the Project Service owns projects and asks the Access Service for authorization;
- the Audit Service consumes committed events and builds an audit projection.

At this scale, deploying these modules as one process would be simpler and probably more appropriate. Separate services become justified when they require independent scaling, release cycles, availability characteristics, security boundaries, or team ownership. This demo uses them to make those trade-offs visible, not because microservices are automatically better.

### Why use PostgreSQL?

PostgreSQL is the authoritative store for transactional business state. Relationships, unique constraints, foreign keys, locking, and atomic transactions are important for tenant isolation and invariants such as preserving at least one organization owner.

The project does not distribute one business transaction across multiple databases. Each service owns its writes and communicates committed facts through events.

### Why use Redis for authorization?

Redis demonstrates a shared cache that can reduce repeated authorization reads across multiple Access Service instances.

It stores derived authorization inputs such as membership status and roles. It is not the source of truth and does not independently grant access. Entries have a short TTL and are invalidated when permissions change. If Redis is unavailable, the service falls back to PostgreSQL. If authoritative permission data cannot be read, the operation is denied.

For the expected traffic of this project, direct PostgreSQL reads or an in-process cache could be sufficient. Redis would be justified in production only after latency, database load, or multi-instance consistency requirements make the added operational complexity worthwhile.

### Does Redis make authorization immediately consistent?

No. Cache invalidation is not an atomic extension of the PostgreSQL transaction. A stale permission may exist for a short, explicitly bounded period.

The demo combines synchronous best-effort invalidation, event-driven invalidation, and a short TTL. It documents the maximum accepted stale-allow window instead of claiming instant global revocation. A production design with stricter revocation requirements might bypass positive caches for sensitive operations, use versioned authorization state, or choose a different consistency model.

### Why use Kafka?

Kafka demonstrates durable asynchronous integration, consumer independence, ordering within a partition, replay, and at-least-once delivery.

It allows an API request to commit its business state without waiting for audit projection or notification processing. Consumers can be temporarily unavailable and catch up later.

For a small application, an in-process queue, PostgreSQL-backed job runner, or simpler message broker could be a better production choice. Kafka is justified only when its throughput, retention, replay, integration, or consumer-scaling characteristics are actually needed.

### Why is an outbox needed?

Updating PostgreSQL and publishing to Kafka are two separate operations. Without an outbox, the database update could succeed while the Kafka publish fails, silently losing the event.

The application writes the business change and an outbox row in one PostgreSQL transaction. A separate publisher later sends the event to Kafka.

This provides at-least-once delivery, not exactly-once delivery. A crash can cause the same event to be published more than once, so every consumer must be idempotent.

### Why use MongoDB for audit data?

MongoDB is used as a query-oriented audit projection because audit events are append-heavy, naturally document-shaped, and may contain event-specific metadata. It also demonstrates polyglot persistence: selecting different storage models for different access patterns.

MongoDB is not included because it is assumed to be universally faster. PostgreSQL with `JSONB` would be a credible and likely simpler choice for this project. In production, MongoDB would need to earn its operational cost through audit volume, schema variability, query patterns, retention needs, or independent scaling.

The MongoDB projection is never consulted for authorization. It can lag behind the source event stream and must therefore not be treated as current business state.

### Why is the Audit Service idempotent?

Kafka and the outbox provide at-least-once delivery, so duplicate events are normal rather than exceptional. The Audit Service uses the event ID as a unique identifier. Processing the same event again does not create a second audit record.

This demonstrates exactly-once business effects built on top of at-least-once transport; it does not claim exactly-once delivery across the entire system.

### Why use Keycloak?

Keycloak keeps password storage, token issuance, refresh sessions, and OpenID Connect flows outside the application. The backend validates identity tokens but owns tenant membership and authorization.

This separation emphasizes that authentication and authorization are different concerns. A production system might use a managed identity provider instead of operating Keycloak directly.

### Why not put roles directly into the JWT?

Tenant and project roles can change while an access token remains valid. Treating token roles as authoritative would extend stale access until token expiration.

The token identifies the actor. Current memberships and permissions are evaluated by the Access Service. Token claims may be used as hints or coarse scopes, but not as the sole source of tenant authorization.

### Is this architecture production-ready?

No. It is production-minded, meaning important failure modes and consistency boundaries are implemented and tested, but production readiness also requires organization-specific work such as:

- capacity planning and load testing;
- high availability and disaster recovery;
- backups and restore verification;
- secret management and key rotation;
- TLS and service-to-service authentication;
- hardened container images and dependency scanning;
- network policies and infrastructure isolation;
- SLOs, alerting, and on-call runbooks;
- privacy, retention, and compliance review;
- Kafka partition and retention planning;
- database maintenance and migration procedures;
- independent security assessment.

These concerns are documented as limitations rather than simulated superficially.

## What the demo should prove

The completed demo should provide concrete evidence that:

1. changing business state and creating its integration event is atomic;
2. a Kafka outage does not lose a committed business event;
3. duplicate event delivery does not duplicate the audit side effect;
4. Redis improves the normal path but is not required for correctness;
5. authorization fails safely when authoritative data cannot be checked;
6. changing an organization ID cannot cross tenant boundaries;
7. role revocation respects a documented cache-staleness bound;
8. each service owns its data and exposes an explicit contract;
9. logs and correlation IDs make the complete workflow traceable;
10. simpler architectural alternatives and their trade-offs are documented.

## Evaluation principle

Review this project based on the clarity of its boundaries, correctness under failure, quality of its tests, and honesty of its trade-offs—not on the number of technologies it contains.
