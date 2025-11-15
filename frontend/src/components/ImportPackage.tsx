import React, { useState } from 'react';
import { adminAPI } from '../services/api';
import { RepoMetadata } from '../types';

const ImportPackage: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<RepoMetadata | null>(null);
  const [success, setSuccess] = useState('');

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMetadata(null);

    try {
      const response = await adminAPI.importRepo(repoUrl, token || undefined);
      setMetadata(response.metadata);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import repository');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    if (!metadata) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await adminAPI.createPackage({
        owner: metadata.owner,
        name: metadata.name,
        description: metadata.description,
        readme: metadata.readme,
        repositoryUrl: repoUrl,
        homepageUrl: metadata.homepage,
      });
      setSuccess('Package created successfully!');
      setMetadata(null);
      setRepoUrl('');
      setToken('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Import Package from Repository</h2>

      {error && <div className="error">{error}</div>}
      {success && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--success-color)',
          borderRadius: '0.5rem',
          padding: '1rem',
          color: 'var(--success-color)',
          marginBottom: '1rem',
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleImport} className="card">
        <div className="form-group">
          <label className="form-label">Repository URL</label>
          <input
            type="url"
            className="form-control"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
          />
          <small style={{ color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
            Supported: GitHub, GitLab, Bitbucket
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Access Token (Optional)</label>
          <input
            type="password"
            className="form-control"
            placeholder="For private repos or higher rate limits"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Importing...' : 'Import Repository'}
        </button>
      </form>

      {metadata && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Import Preview</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Owner:</strong> {metadata.owner}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Name:</strong> {metadata.name}
          </div>
          {metadata.description && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Description:</strong> {metadata.description}
            </div>
          )}
          {metadata.homepage && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Homepage:</strong> <a href={metadata.homepage} target="_blank" rel="noopener noreferrer">{metadata.homepage}</a>
            </div>
          )}
          {metadata.readme && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>README:</strong> {metadata.readme.substring(0, 200)}...
            </div>
          )}
          {metadata.releases && metadata.releases.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Found {metadata.releases.length} release(s)</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {metadata.releases.slice(0, 5).map((release, idx) => (
                  <li key={idx}>
                    {release.version} ({release.assets?.length || 0} assets)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-success"
              onClick={handleCreatePackage}
              disabled={loading}
            >
              Create Package
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setMetadata(null)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPackage;
