export interface Package {
  id: number;
  owner: string;
  name: string;
  description?: string;
  readme?: string;
  repository_url?: string;
  homepage_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Release {
  id: number;
  version: string;
  release_notes?: string;
  published_at?: string;
  created_at: string;
  assets?: Asset[];
}

export interface Asset {
  id: number;
  filename: string;
  size: number;
  mime_type?: string;
  sha256: string;
  platform?: string;
  os?: string;
  arch?: string;
  download_count: number;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
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
