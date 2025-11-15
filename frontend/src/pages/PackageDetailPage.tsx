import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { publicAPI } from '../services/api';
import { Package, Release } from '../types';
import { formatDate } from '../utils/helpers';

const PackageDetailPage: React.FC = () => {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPackageData = useCallback(async () => {
    if (!owner || !name) return;

    setLoading(true);
    setError('');

    try {
      const [pkgData, releasesData] = await Promise.all([
        publicAPI.getPackage(owner, name),
        publicAPI.getReleases(owner, name),
      ]);

      setPkg(pkgData);
      setReleases(releasesData.releases);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load package');
    } finally {
      setLoading(false);
    }
  }, [owner, name]);

  useEffect(() => {
    loadPackageData();
  }, [loadPackageData]);

  if (loading) {
    return <div className="container"><div className="loading">Loading package...</div></div>;
  }

  if (error || !pkg) {
    return (
      <div className="container">
        <div className="error">{error || 'Package not found'}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{pkg.name}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>@{pkg.owner}</p>
      </div>

      {pkg.description && (
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          {pkg.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {pkg.repository_url && (
          <a
            href={pkg.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            📦 Repository
          </a>
        )}
        {pkg.homepage_url && (
          <a
            href={pkg.homepage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            🏠 Homepage
          </a>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '1rem' }}>README</h2>
          <div className="card">
            {pkg.readme ? (
              <div style={{ overflow: 'auto' }}>
                <ReactMarkdown>{pkg.readme}</ReactMarkdown>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No README available</p>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: '1rem' }}>Releases</h2>
          {releases.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No releases yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {releases.map((release) => (
                <Link
                  key={release.id}
                  to={`/packages/${owner}/${name}/releases/${release.version}`}
                  className="card"
                  style={{ textDecoration: 'none', padding: '1rem' }}
                >
                  <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>
                    v{release.version}
                  </div>
                  {release.published_at && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {formatDate(release.published_at)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageDetailPage;
