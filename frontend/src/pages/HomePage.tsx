import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
          Welcome to Flo Package Registry
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          A modern, developer-first package registry for all your software packages
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/packages" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
            Browse Packages
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
            Get Started
          </Link>
        </div>

        <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'left' }}>
          <div className="card">
            <h3 className="card-title">🔍 Easy Discovery</h3>
            <p className="card-description">
              Search and browse packages with a clean, intuitive interface. Find what you need quickly.
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">🔒 Secure & Verified</h3>
            <p className="card-description">
              All assets include SHA256 checksums and are served via signed URLs for maximum security.
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">⚡ One-Line Install</h3>
            <p className="card-description">
              Get platform-specific install commands with automatic checksum verification built-in.
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">📦 Multi-Platform</h3>
            <p className="card-description">
              Support for Linux, macOS, Windows, and more. Assets tagged by OS and architecture.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '4rem', backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '0.75rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Quick Start</h2>
          <div className="code-block" style={{ textAlign: 'left' }}>
            <pre>
              <code>
{`# Install a package with mn CLI
mn add owner/package@version

# Or use direct install commands
curl -fsSL https://flo-registry.example/api/v1/packages/owner/name/install/1.0.0/linux/x64 | sh`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
