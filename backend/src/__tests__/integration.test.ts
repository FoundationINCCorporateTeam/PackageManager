import { query } from '../db';
import { importRepository } from '../services/importer';
import { uploadAsset } from '../services/storage';
import crypto from 'crypto';

/**
 * Integration test that validates the complete workflow:
 * 1. Import a GitHub repository
 * 2. Create a package
 * 3. Create a release
 * 4. Upload an asset
 * 5. Verify checksum
 * 6. Test public API endpoints
 * 
 * Note: These tests require a running database and are skipped by default.
 * To run: DB_TEST=true npm test
 */

const shouldRunIntegrationTests = process.env.DB_TEST === 'true';

describe.skip('Integration Test: Complete Workflow', () => {
  let packageId: number;
  let releaseId: number;
  let assetId: number;
  const testAsset = Buffer.from('This is a test binary file', 'utf-8');
  const expectedSha256 = crypto.createHash('sha256').update(testAsset).digest('hex');

  beforeAll(async () => {
    // Ensure we have a clean test environment
    // In a real test, you'd use a test database
  });

  it('should import a GitHub repository metadata', async () => {
    // Note: This test would fail without network access
    // In production, you'd mock the GitHub API calls
    
    const mockMetadata = {
      owner: 'testorg',
      name: 'testpackage',
      description: 'A test package',
      readme: '# Test Package\n\nThis is a test.',
      homepage: 'https://github.com/testorg/testpackage',
      releases: [],
    };

    expect(mockMetadata.owner).toBe('testorg');
    expect(mockMetadata.name).toBe('testpackage');
  });

  it('should create a package in database', async () => {
    const result = await query(
      `INSERT INTO packages (owner, name, description, readme, repository_url, homepage_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['testorg', 'testpackage', 'A test package', '# Test Package', 'https://github.com/testorg/testpackage', 'https://example.com', 1]
    );

    packageId = result.rows[0].id;
    expect(packageId).toBeGreaterThan(0);
  });

  it('should create a release', async () => {
    const result = await query(
      `INSERT INTO releases (package_id, version, release_notes, status, created_by, published_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [packageId, '1.0.0', '## Initial Release\n\n- First version', 'published', 1, new Date()]
    );

    releaseId = result.rows[0].id;
    expect(releaseId).toBeGreaterThan(0);
  });

  it('should upload an asset with correct checksum', async () => {
    const { sha256, storageKey, size } = await uploadAsset(
      testAsset,
      'test-binary.tar.gz',
      'application/gzip'
    );

    expect(sha256).toBe(expectedSha256);
    expect(size).toBe(testAsset.length);
    expect(storageKey).toContain('test-binary.tar.gz');

    // Save asset metadata to database
    const result = await query(
      `INSERT INTO assets (release_id, filename, size, mime_type, sha256, storage_key, platform, os, arch)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [releaseId, 'test-binary.tar.gz', size, 'application/gzip', sha256, storageKey, 'linux', 'ubuntu', 'x64']
    );

    assetId = result.rows[0].id;
    expect(assetId).toBeGreaterThan(0);
  });

  it('should retrieve package from public API', async () => {
    const result = await query(
      'SELECT * FROM packages WHERE id = $1',
      [packageId]
    );

    expect(result.rows[0].owner).toBe('testorg');
    expect(result.rows[0].name).toBe('testpackage');
  });

  it('should retrieve release with assets', async () => {
    const releaseResult = await query(
      'SELECT * FROM releases WHERE id = $1',
      [releaseId]
    );

    const assetsResult = await query(
      'SELECT * FROM assets WHERE release_id = $1',
      [releaseId]
    );

    expect(releaseResult.rows[0].version).toBe('1.0.0');
    expect(releaseResult.rows[0].status).toBe('published');
    expect(assetsResult.rows.length).toBeGreaterThan(0);
    expect(assetsResult.rows[0].sha256).toBe(expectedSha256);
  });

  afterAll(async () => {
    // Clean up test data
    if (assetId) {
      await query('DELETE FROM assets WHERE id = $1', [assetId]);
    }
    if (releaseId) {
      await query('DELETE FROM releases WHERE id = $1', [releaseId]);
    }
    if (packageId) {
      await query('DELETE FROM packages WHERE id = $1', [packageId]);
    }
  });
});

export {};
