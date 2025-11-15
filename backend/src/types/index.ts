export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Package {
  id: number;
  owner: string;
  name: string;
  description?: string;
  readme?: string;
  repository_url?: string;
  homepage_url?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface Release {
  id: number;
  package_id: number;
  version: string;
  release_notes?: string;
  status: 'draft' | 'published';
  published_at?: Date;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface Asset {
  id: number;
  release_id: number;
  filename: string;
  size: number;
  mime_type?: string;
  sha256: string;
  storage_key: string;
  platform?: string;
  os?: string;
  arch?: string;
  download_count: number;
  created_at: Date;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: Date;
}

export interface ApiKey {
  id: number;
  user_id: number;
  key_hash: string;
  name: string;
  scopes: string[];
  last_used_at?: Date;
  expires_at?: Date;
  created_at: Date;
}

export interface JWTPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
}

export interface RepoMetadata {
  owner: string;
  name: string;
  description?: string;
  readme?: string;
  homepage?: string;
  releases?: RepoRelease[];
}

export interface RepoRelease {
  version: string;
  notes?: string;
  assets?: RepoAsset[];
}

export interface RepoAsset {
  name: string;
  url: string;
  size: number;
  contentType?: string;
}
