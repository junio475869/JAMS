-- Create the jams user first
CREATE USER jams WITH PASSWORD 'jams_password' SUPERUSER;

-- Create the database with jams as owner
CREATE DATABASE jams_db OWNER jams;

-- Connect to jams_db
\c jams_db

-- Create the public schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Set the search path
SET search_path TO public;

-- Grant all privileges on the schema to jams
GRANT ALL ON SCHEMA public TO jams;

-- Grant all privileges on all tables to jams
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO jams;

-- Grant all privileges on all sequences to jams
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO jams;

-- Set the default privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO jams;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO jams;

-- Make jams the owner of the public schema
ALTER SCHEMA public OWNER TO jams; 