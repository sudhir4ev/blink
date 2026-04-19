-- Langfuse profile expects a dedicated DB; safe to re-run (e.g. psql -f).
SELECT 'CREATE DATABASE langfuse'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'langfuse')\gexec
