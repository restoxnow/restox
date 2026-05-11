-- migration_026: purge all retailer rows with connection_type = 'credentials'
-- Credential-based retailer connections are no longer supported.
-- Restox connects via OAuth only; storing third-party credentials is prohibited.

delete from retailers where connection_type = 'credentials';
