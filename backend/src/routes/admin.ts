import express from 'express';
import multer from 'multer';
import { query } from '../db';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { importLimiter, uploadLimiter } from '../middleware/rateLimiter';
import { importRepository } from '../services/importer';
import { uploadAsset } from '../services/storage';
import { validateMimeType, DEFAULT_ALLOWED_MIME_TYPES, sanitizeMarkdown } from '../utils/sanitize';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '100') * 1024 * 1024,
  },
});

// All admin routes require authentication
router.use(authenticateToken);

// POST /api/v1/admin/import - Import a repository
router.post('/import', importLimiter, async (req: AuthRequest, res) => {
  try {
    const { repositoryUrl, token } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    // Import repository metadata
    const metadata = await importRepository(repositoryUrl, token);

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user!.userId, 'import_preview', 'package', { repositoryUrl, metadata }, req.ip]
    );

    res.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error('Error importing repository:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to import repository' 
    });
  }
});

// POST /api/v1/admin/packages - Create a package
router.post('/packages', async (req: AuthRequest, res) => {
  try {
    const { owner, name, description, readme, repositoryUrl, homepageUrl } = req.body;

    if (!owner || !name) {
      return res.status(400).json({ error: 'Owner and name are required' });
    }

    // Check if package already exists
    const existing = await query(
      'SELECT id FROM packages WHERE owner = $1 AND name = $2',
      [owner, name]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Package already exists' });
    }

    const result = await query(
      `INSERT INTO packages (owner, name, description, readme, repository_url, homepage_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [owner, name, description, readme, repositoryUrl, homepageUrl, req.user!.userId]
    );

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user!.userId, 'create_package', 'package', result.rows[0].id, req.ip]
    );

    res.status(201).json({
      success: true,
      package: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// PUT /api/v1/admin/packages/:id - Update a package
router.put('/packages/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { description, readme, repositoryUrl, homepageUrl } = req.body;

    const result = await query(
      `UPDATE packages 
       SET description = COALESCE($1, description),
           readme = COALESCE($2, readme),
           repository_url = COALESCE($3, repository_url),
           homepage_url = COALESCE($4, homepage_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [description, readme, repositoryUrl, homepageUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user!.userId, 'update_package', 'package', id, req.ip]
    );

    res.json({
      success: true,
      package: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// POST /api/v1/admin/packages/:packageId/releases - Create a release
router.post('/packages/:packageId/releases', async (req: AuthRequest, res) => {
  try {
    const { packageId } = req.params;
    const { version, releaseNotes, status = 'draft' } = req.body;

    if (!version) {
      return res.status(400).json({ error: 'Version is required' });
    }

    // Check if release already exists
    const existing = await query(
      'SELECT id FROM releases WHERE package_id = $1 AND version = $2',
      [packageId, version]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Release version already exists' });
    }

    const result = await query(
      `INSERT INTO releases (package_id, version, release_notes, status, created_by, published_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        packageId,
        version,
        releaseNotes,
        status,
        req.user!.userId,
        status === 'published' ? new Date() : null,
      ]
    );

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user!.userId, 'create_release', 'release', result.rows[0].id, { version, status }, req.ip]
    );

    res.status(201).json({
      success: true,
      release: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating release:', error);
    res.status(500).json({ error: 'Failed to create release' });
  }
});

// PUT /api/v1/admin/releases/:id - Update a release
router.put('/releases/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { releaseNotes, status } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (releaseNotes !== undefined) {
      params.push(releaseNotes);
      updates.push(`release_notes = $${params.length}`);
    }

    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${params.length}`);
      
      if (status === 'published') {
        params.push(new Date());
        updates.push(`published_at = $${params.length}`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await query(
      `UPDATE releases SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Release not found' });
    }

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user!.userId, 'update_release', 'release', id, { status }, req.ip]
    );

    res.json({
      success: true,
      release: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating release:', error);
    res.status(500).json({ error: 'Failed to update release' });
  }
});

// POST /api/v1/admin/releases/:releaseId/assets - Upload asset
router.post('/releases/:releaseId/assets', uploadLimiter, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { releaseId } = req.params;
    const { platform, os, arch } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Validate MIME type
    if (req.file.mimetype && !validateMimeType(req.file.mimetype, DEFAULT_ALLOWED_MIME_TYPES)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Upload to storage
    const { storageKey, sha256, size } = await uploadAsset(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Save asset metadata
    const result = await query(
      `INSERT INTO assets (release_id, filename, size, mime_type, sha256, storage_key, platform, os, arch)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [releaseId, req.file.originalname, size, req.file.mimetype, sha256, storageKey, platform, os, arch]
    );

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user!.userId,
        'upload_asset',
        'asset',
        result.rows[0].id,
        { filename: req.file.originalname, size, platform, os, arch },
        req.ip,
      ]
    );

    res.status(201).json({
      success: true,
      asset: result.rows[0],
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
});

// DELETE /api/v1/admin/assets/:id - Delete asset
router.delete('/assets/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user!.userId, 'delete_asset', 'asset', id, req.ip]
    );

    res.json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// GET /api/v1/admin/audit-logs - Get audit logs (admin only)
router.get('/audit-logs', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    const result = await query(
      `SELECT a.*, u.username 
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limitNum, offset]
    );

    const countResult = await query('SELECT COUNT(*) as total FROM audit_logs');
    const total = parseInt(countResult.rows[0].total);

    res.json({
      logs: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
