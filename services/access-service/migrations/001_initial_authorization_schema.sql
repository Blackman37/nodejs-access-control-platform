-- Up Migration

CREATE TABLE organizations (
  id uuid PRIMARY KEY
);

CREATE TABLE organization_memberships (
  organization_id uuid NOT NULL,
  actor_id text NOT NULL,
  role text NOT NULL,
  CONSTRAINT organization_memberships_pkey PRIMARY KEY (organization_id, actor_id),
  CONSTRAINT organization_memberships_organization_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE CASCADE,
  CONSTRAINT organization_memberships_role_check
    CHECK (role IN ('owner', 'admin', 'member'))
);

-- Down Migration

DROP TABLE organization_memberships;
DROP TABLE organizations;
