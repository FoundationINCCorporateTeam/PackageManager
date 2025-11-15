import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { publicAPI } from '../services/api';
import { Release } from '../types';
import { formatBytes, formatDate, copyToClipboard } from '../utils/helpers';

const ReleaseDetailPage: React.FC = () => {
  const { owner, name, version } = useParams<{ owner: string; name: string; version: string }>();
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const loadRelease = useCallback(async () => {
    if (!owner || !name || !version) return;

    setLoading(true);
    setError('');

    try {
      const data = await publicAPI.getRelease(owner, name, version);
      setRelease(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load release');
    } finally {
      setLoading(false);
    }
  }, [owner, name, version]);

  useEffect(() => {
    loadRelease();
  }, [loadRelease]);

  const handleCopy = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedCommand(id);
      setTimeout(() => setCopiedCommand(null), 2000);
    }
  };

  const generateInstallCommand = (platform: string, arch: string) => {
    const url = publicAPI.getInstallScript(owner!, name!, version!, platform, arch);
    
    if (platform.toLowerCase().includes('linux') || platform.toLowerCase().includes('darwin')) {
      return `curl -fsSL ${url} | sh`;
    } else if (platform.toLowerCase().includes('windows')) {
      return `iwr -useb ${url} | iex`;
    }
    return `curl -fsSL ${url} | sh`;
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading release...</div></div>;
  }

  if (error || !release) {
    return (
      <div className="container">
        <div className="error">{error || 'Release not found'}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link to={`/packages/${owner}/${name}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
          ← Back to {owner}/{name}
        </Link>
      </div>

      <h1 style={{ marginBottom: '0.5rem' }}>
        {owner}/{name} v{release.version}
      </h1>
      {release.published_at && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Published on {formatDate(release.published_at)}
        </p>
      )}

      {release.release_notes && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Release Notes</h2>
          <div className="card">
            <ReactMarkdown>{release.release_notes}</ReactMarkdown>
          </div>
        </div>
      )}

      <div>
        <h2 style={{ marginBottom: '1rem' }}>Assets</h2>
        
        {!release.assets || release.assets.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No assets available</p>
        ) : (
          <div className="asset-list">
            {release.assets.map((asset) => (
              <div key={asset.id} className="asset-item">
                <div className="asset-info">
                  <div className="asset-name">{asset.filename}</div>
                  <div className="asset-meta">
                    {asset.platform && <span>Platform: {asset.platform}</span>}
                    {asset.os && <span> | OS: {asset.os}</span>}
                    {asset.arch && <span> | Arch: {asset.arch}</span>}
                    <br />
                    Size: {formatBytes(asset.size)} | Downloads: {asset.download_count}
                    <br />
                    SHA256: <code style={{ fontSize: '0.75rem' }}>{asset.sha256}</code>
                  </div>
                </div>
                <div className="asset-actions">
                  <a
                    href={publicAPI.downloadAsset(owner!, name!, version!, asset.id)}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {release.assets && release.assets.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Install Commands</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Quick install commands for common platforms:
            </p>
            
            {/* Show unique platform/arch combinations */}
            {Array.from(new Set(release.assets.map(a => `${a.platform}/${a.arch}`)))
              .filter(combo => combo !== '/')
              .map((combo) => {
                const [platform, arch] = combo.split('/');
                const command = generateInstallCommand(platform, arch);
                const commandId = `${platform}-${arch}`;
                
                return (
                  <div key={combo} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      {platform} ({arch})
                    </div>
                    <div className="code-block">
                      <pre><code>{command}</code></pre>
                      <button
                        className={`copy-button ${copiedCommand === commandId ? 'copied' : ''}`}
                        onClick={() => handleCopy(command, commandId)}
                      >
                        {copiedCommand === commandId ? '✓ Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                );
              })}

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Using mn CLI
              </div>
              <div className="code-block">
                <pre><code>mn add {owner}/{name}@{version}</code></pre>
                <button
                  className={`copy-button ${copiedCommand === 'mn' ? 'copied' : ''}`}
                  onClick={() => handleCopy(`mn add ${owner}/${name}@${version}`, 'mn')}
                >
                  {copiedCommand === 'mn' ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReleaseDetailPage;
