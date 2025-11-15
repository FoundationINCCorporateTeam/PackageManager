import { query } from './index';

export const runMigrations = async () => {
  console.log('Running database migrations...');

  // Create users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create packages table
  await query(`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      owner VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      readme TEXT,
      repository_url VARCHAR(500),
      homepage_url VARCHAR(500),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner, name)
    );
  `);

  // Create index for package search
  await query(`
    CREATE INDEX IF NOT EXISTS idx_packages_owner_name ON packages(owner, name);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_packages_search ON packages USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
  `);

  // Create releases table
  await query(`
    CREATE TABLE IF NOT EXISTS releases (
      id SERIAL PRIMARY KEY,
      package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
      version VARCHAR(50) NOT NULL,
      release_notes TEXT,
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      published_at TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(package_id, version)
    );
  `);

  // Create assets table
  await query(`
    CREATE TABLE IF NOT EXISTS assets (
      id SERIAL PRIMARY KEY,
      release_id INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
      filename VARCHAR(255) NOT NULL,
      size BIGINT NOT NULL,
      mime_type VARCHAR(100),
      sha256 VARCHAR(64) NOT NULL,
      storage_key VARCHAR(500) NOT NULL,
      platform VARCHAR(50),
      os VARCHAR(50),
      arch VARCHAR(50),
      download_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create audit_logs table
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id INTEGER,
      metadata JSONB,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create api_keys table for CI publishing
  await query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key_hash VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      scopes JSONB DEFAULT '[]',
      last_used_at TIMESTAMP,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Migrations completed successfully!');
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
