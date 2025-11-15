import express from 'express';
import { query } from '../db';
import { getAssetUrl } from '../services/storage';
import { generateInstallCommand, generateInstallScript, generateMnCommand } from '../services/installer';

const router = express.Router();

// GET /api/v1/packages - Search and list packages
router.get('/packages', async (req, res) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
      SELECT p.*, COUNT(*) OVER() as total_count
      FROM packages p
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`, `%${search}%`);
      queryText += ` AND (p.name ILIKE $${params.length - 1} OR p.description ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    const result = await query(queryText, params);

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    res.json({
      packages: result.rows.map((row: any) => ({
        owner: row.owner,
        name: row.name,
        description: row.description,
        repository_url: row.repository_url,
        homepage_url: row.homepage_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// GET /api/v1/packages/:owner/:name - Get package details
router.get('/packages/:owner/:name', async (req, res) => {
  try {
    const { owner, name } = req.params;

    const result = await query(
      'SELECT * FROM packages WHERE owner = $1 AND name = $2',
      [owner, name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const pkg = result.rows[0];

    res.json({
      id: pkg.id,
      owner: pkg.owner,
      name: pkg.name,
      description: pkg.description,
      readme: pkg.readme,
      repository_url: pkg.repository_url,
      homepage_url: pkg.homepage_url,
      created_at: pkg.created_at,
      updated_at: pkg.updated_at,
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// GET /api/v1/packages/:owner/:name/releases - Get package releases
router.get('/packages/:owner/:name/releases', async (req, res) => {
  try {
    const { owner, name } = req.params;

    // Find package
    const pkgResult = await query(
      'SELECT id FROM packages WHERE owner = $1 AND name = $2',
      [owner, name]
    );

    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const packageId = pkgResult.rows[0].id;

    // Get releases
    const releasesResult = await query(
      `SELECT * FROM releases 
       WHERE package_id = $1 AND status = 'published' 
       ORDER BY published_at DESC`,
      [packageId]
    );

    res.json({
      releases: releasesResult.rows.map((row: any) => ({
        id: row.id,
        version: row.version,
        release_notes: row.release_notes,
        published_at: row.published_at,
        created_at: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

// GET /api/v1/packages/:owner/:name/releases/:version - Get specific release
router.get('/packages/:owner/:name/releases/:version', async (req, res) => {
  try {
    const { owner, name, version } = req.params;

    // Find package
    const pkgResult = await query(
      'SELECT id FROM packages WHERE owner = $1 AND name = $2',
      [owner, name]
    );

    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const packageId = pkgResult.rows[0].id;

    // Get release
    const releaseResult = await query(
      `SELECT * FROM releases 
       WHERE package_id = $1 AND version = $2 AND status = 'published'`,
      [packageId, version]
    );

    if (releaseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Release not found' });
    }

    const release = releaseResult.rows[0];

    // Get assets
    const assetsResult = await query(
      'SELECT * FROM assets WHERE release_id = $1 ORDER BY created_at ASC',
      [release.id]
    );

    res.json({
      id: release.id,
      version: release.version,
      release_notes: release.release_notes,
      published_at: release.published_at,
      assets: assetsResult.rows.map((asset: any) => ({
        id: asset.id,
        filename: asset.filename,
        size: asset.size,
        mime_type: asset.mime_type,
        sha256: asset.sha256,
        platform: asset.platform,
        os: asset.os,
        arch: asset.arch,
        download_count: asset.download_count,
        created_at: asset.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching release:', error);
    res.status(500).json({ error: 'Failed to fetch release' });
  }
});

// GET /api/v1/packages/:owner/:name/releases/:version/assets/:id - Download asset
router.get('/packages/:owner/:name/releases/:version/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const assetResult = await query('SELECT * FROM assets WHERE id = $1', [id]);

    if (assetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = assetResult.rows[0];

    // Increment download count
    await query('UPDATE assets SET download_count = download_count + 1 WHERE id = $1', [id]);

    // Generate signed URL and redirect
    const signedUrl = await getAssetUrl(asset.storage_key, 3600);
    res.redirect(signedUrl);
  } catch (error) {
    console.error('Error downloading asset:', error);
    res.status(500).json({ error: 'Failed to download asset' });
  }
});

// GET /api/v1/packages/:owner/:name/install/:version/:platform/:arch - Get install command
router.get('/packages/:owner/:name/install/:version/:platform/:arch', async (req, res) => {
  try {
    const { owner, name, version, platform, arch } = req.params;

    // Find package
    const pkgResult = await query(
      'SELECT id FROM packages WHERE owner = $1 AND name = $2',
      [owner, name]
    );

    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const packageId = pkgResult.rows[0].id;

    // Get release
    const releaseResult = await query(
      `SELECT * FROM releases 
       WHERE package_id = $1 AND version = $2 AND status = 'published'`,
      [packageId, version]
    );

    if (releaseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Release not found' });
    }

    const release = releaseResult.rows[0];

    // Find matching asset
    const assetResult = await query(
      `SELECT * FROM assets 
       WHERE release_id = $1 
       AND (platform = $2 OR platform ILIKE $3)
       AND (arch = $4 OR arch ILIKE $5)
       LIMIT 1`,
      [release.id, platform, `%${platform}%`, arch, `%${arch}%`]
    );

    if (assetResult.rows.length === 0) {
      return res.status(404).json({ error: 'No matching asset found for this platform/arch' });
    }

    const asset = assetResult.rows[0];
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const assetUrl = `${baseUrl}/api/v1/packages/${owner}/${name}/releases/${version}/assets/${asset.id}`;

    // Return install script
    const script = generateInstallScript(
      owner,
      name,
      version,
      platform,
      arch,
      assetUrl,
      asset.sha256,
      asset.filename
    );

    res.type('text/plain').send(script);
  } catch (error) {
    console.error('Error generating install script:', error);
    res.status(500).json({ error: 'Failed to generate install script' });
  }
});

export default router;
