import React from 'react';
import { Navigate, Routes, Route, Link } from 'react-router-dom';
import { User } from '../types';
import ImportPackage from '../components/ImportPackage';
import ManagePackages from '../components/ManagePackages';

interface AdminDashboardProps {
  user: User | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ width: '200px', flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/admin" className="btn btn-secondary" style={{ textAlign: 'left' }}>
              Import Package
            </Link>
            <Link to="/admin/packages" className="btn btn-secondary" style={{ textAlign: 'left' }}>
              Manage Packages
            </Link>
            {user.isAdmin && (
              <Link to="/admin/audit" className="btn btn-secondary" style={{ textAlign: 'left' }}>
                Audit Logs
              </Link>
            )}
          </nav>
        </div>

        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<ImportPackage />} />
            <Route path="/packages" element={<ManagePackages />} />
            <Route path="/audit" element={<AuditLogs />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const AuditLogs: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Audit Logs</h2>
      <p style={{ color: 'var(--text-muted)' }}>Audit log viewing coming soon...</p>
    </div>
  );
};

export default AdminDashboard;
