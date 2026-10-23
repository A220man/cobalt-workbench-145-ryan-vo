// API Types
export interface ImportCacheEntry {
  id: number;
  specifier: string;
  cache_key: string;
  resolved_url: string | null;
  status: 'resolved' | 'failed' | 'invalidated';
  error_message: string | null;
  created_at: string;
  updated_at: string;
  access_count: number;
}

export interface ImportCacheStats {
  total: number;
  resolved: number;
  failed: number;
  invalidated: number;
}

export interface ImportMap {
  id: number;
  name: string;
  imports: Record<string, string>;
  scopes: Record<string, Record<string, string>> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateImportCacheEntry {
  specifier: string;
  cache_key: string;
  resolved_url?: string;
  status?: 'resolved' | 'failed' | 'invalidated';
  error_message?: string;
}

export interface UpdateImportCacheEntry {
  resolved_url?: string;
  status?: 'resolved' | 'failed' | 'invalidated';
  error_message?: string;
  access_count?: number;
}

export interface CreateImportMap {
  name: string;
  imports: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

export interface UpdateImportMap {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

export interface InvalidateResponse {
  invalidated_count: number;
  specifier?: string;
}