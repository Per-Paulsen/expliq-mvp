-- Enable Row Level Security on all tables.
-- No policies are created: Prisma connects as the postgres role (bypasses RLS).
-- This locks out PostgREST / anon access to all tables.

-- Note: _prisma_migrations is excluded (Prisma internal table, not exposed via PostgREST).
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConnectorConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Automation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
