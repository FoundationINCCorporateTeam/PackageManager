import React, { useState, useEffect } from 'react';
import { publicAPI, adminAPI } from '../services/api';
import { Package } from '../types';

const ManagePackages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseData, setReleaseData] = useState({ version: '', releaseNotes: '', status: 'draft' as 'draft' | 'published' });
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [assetMeta, setAssetMeta] = useState({ platform: '', os: '', arch: '' });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await publicAPI.getPackages(undefined, 1, 100);
      setPackages(response.packages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;

    try {
      await adminAPI.createRelease(selectedPackage.id, releaseData);
      setShowReleaseModal(false);
      setReleaseData({ version: '', releaseNotes: '', status: 'draft' });
      alert('Release created successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create release');
    }
  };

  const handleUploadAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetFile) return;

    try {
      // Upload logic would go here - need to select a release first
      alert('Asset upload functionality - select a release first');
      setAssetFile(null);
      setAssetMeta({ platform: '', os: '', arch: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload asset');
    }
  };

  if (loading) {
    return <div className="loading">Loading packages...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Manage Packages</h2>

      {error && <div className="error">{error}</div>}

      {packages.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No packages found. Import a repository to get started.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {packages.map((pkg) => (
            <div key={pkg.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 className="card-title">{pkg.owner}/{pkg.name}</h3>
                  <p className="card-description">{pkg.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setShowReleaseModal(true);
                    }}
                  >
                    Create Release
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Release Modal */}
      {showReleaseModal && selectedPackage && (
        <div className="modal-overlay" onClick={() => setShowReleaseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Release for {selectedPackage.name}</h3>
              <button className="modal-close" onClick={() => setShowReleaseModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateRelease}>
              <div className="form-group">
                <label className="form-label">Version</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="1.0.0"
                  value={releaseData.version}
                  onChange={(e) => setReleaseData({ ...releaseData, version: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Release Notes (Markdown)</label>
                <textarea
                  className="form-control"
                  placeholder="## What's New&#10;- Feature 1&#10;- Bug fix 2"
                  value={releaseData.releaseNotes}
                  onChange={(e) => setReleaseData({ ...releaseData, releaseNotes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={releaseData.status}
                  onChange={(e) => setReleaseData({ ...releaseData, status: e.target.value as 'draft' | 'published' })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">Create Release</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReleaseModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Asset Modal */}
      {showAssetModal && (
        <div className="modal-overlay" onClick={() => setShowAssetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Asset</h3>
              <button className="modal-close" onClick={() => setShowAssetModal(false)}>×</button>
            </div>

            <form onSubmit={handleUploadAsset}>
              <div className="form-group">
                <label className="form-label">File</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => setAssetFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Platform</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="linux, windows, darwin"
                  value={assetMeta.platform}
                  onChange={(e) => setAssetMeta({ ...assetMeta, platform: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">OS</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ubuntu, debian, windows10"
                  value={assetMeta.os}
                  onChange={(e) => setAssetMeta({ ...assetMeta, os: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Architecture</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="x64, arm64, x86"
                  value={assetMeta.arch}
                  onChange={(e) => setAssetMeta({ ...assetMeta, arch: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">Upload</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssetModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePackages;
