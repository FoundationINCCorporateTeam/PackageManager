import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { Package } from '../types';
import { formatDate } from '../utils/helpers';

const PackageListPage: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await publicAPI.getPackages(search || undefined, page, 20);
      setPackages(response.packages);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPackages();
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Package Catalog</h1>

      <form onSubmit={handleSearch} className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="Search packages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading packages...</div>
      ) : packages.length === 0 ? (
        <div className="loading">No packages found</div>
      ) : (
        <>
          <div className="package-list">
            {packages.map((pkg) => (
              <Link
                key={pkg.id}
                to={`/packages/${pkg.owner}/${pkg.name}`}
                className="package-card"
              >
                <div className="package-name">{pkg.name}</div>
                <div className="package-owner">@{pkg.owner}</div>
                <p className="card-description">{pkg.description || 'No description available'}</p>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Created {formatDate(pkg.created_at)}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PackageListPage;
