import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  ImportCacheEntry,
  ImportCacheStats,
  ImportMap,
  CreateImportCacheEntry,
  UpdateImportCacheEntry,
  CreateImportMap,
  UpdateImportMap,
  InvalidateResponse,
  PackageDir,
  CreatePackageDir,
  UpdatePackageDir,
  PackageDirResolveResponse,
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
        }
        return Promise.reject(error);
      }
    );
  }

  // Import Cache
  async listCacheEntries(params?: {
    specifier?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ImportCacheEntry[]> {
    const response = await this.client.get<ImportCacheEntry[]>('/import-cache', { params });
    return response.data;
  }

  async getCacheStats(): Promise<ImportCacheStats> {
    const response = await this.client.get<ImportCacheStats>('/import-cache/stats');
    return response.data;
  }

  async getCacheEntry(id: number): Promise<ImportCacheEntry> {
    const response = await this.client.get<ImportCacheEntry>(`/import-cache/${id}`);
    return response.data;
  }

  async createCacheEntry(data: CreateImportCacheEntry): Promise<ImportCacheEntry> {
    const response = await this.client.post<ImportCacheEntry>('/import-cache', data);
    return response.data;
  }

  async updateCacheEntry(id: number, data: UpdateImportCacheEntry): Promise<ImportCacheEntry> {
    const response = await this.client.patch<ImportCacheEntry>(`/import-cache/${id}`, data);
    return response.data;
  }

  async invalidateCacheEntry(id: number): Promise<ImportCacheEntry> {
    const response = await this.client.post<ImportCacheEntry>(`/import-cache/${id}/invalidate`);
    return response.data;
  }

  async invalidateBySpecifier(specifier: string): Promise<InvalidateResponse> {
    const response = await this.client.post<InvalidateResponse>(`/import-cache/invalidate-by-specifier/${encodeURIComponent(specifier)}`);
    return response.data;
  }

  async invalidateAll(): Promise<InvalidateResponse> {
    const response = await this.client.post<InvalidateResponse>('/import-cache/invalidate-all');
    return response.data;
  }

  // Import Maps
  async listImportMaps(params?: { limit?: number; offset?: number }): Promise<ImportMap[]> {
    const response = await this.client.get<ImportMap[]>('/import-maps', { params });
    return response.data;
  }

  async getImportMap(id: number): Promise<ImportMap> {
    const response = await this.client.get<ImportMap>(`/import-maps/${id}`);
    return response.data;
  }

  async createImportMap(data: CreateImportMap): Promise<ImportMap> {
    const response = await this.client.post<ImportMap>('/import-maps', data);
    return response.data;
  }

  async updateImportMap(id: number, data: UpdateImportMap): Promise<ImportMap> {
    const response = await this.client.patch<ImportMap>(`/import-maps/${id}`, data);
    return response.data;
  }

  async deleteImportMap(id: number): Promise<void> {
    await this.client.delete(`/import-maps/${id}`);
  }

  // Package Directories
  async listPackageDirs(params?: { limit?: number; offset?: number }): Promise<PackageDir[]> {
    const response = await this.client.get<PackageDir[]>('/package-dirs', { params });
    return response.data;
  }

  async getPackageDir(id: number): Promise<PackageDir> {
    const response = await this.client.get<PackageDir>(`/package-dirs/${id}`);
    return response.data;
  }

  async getPackageDirByName(name: string): Promise<PackageDir> {
    const response = await this.client.get<PackageDir>(`/package-dirs/by-name/${encodeURIComponent(name)}`);
    return response.data;
  }

  async getPackageDirByPath(path: string): Promise<PackageDir> {
    const response = await this.client.get<PackageDir>(`/package-dirs/by-path/${encodeURIComponent(path)}`);
    return response.data;
  }

  async createPackageDir(data: CreatePackageDir): Promise<PackageDir> {
    const response = await this.client.post<PackageDir>('/package-dirs', data);
    return response.data;
  }

  async updatePackageDir(id: number, data: UpdatePackageDir): Promise<PackageDir> {
    const response = await this.client.patch<PackageDir>(`/package-dirs/${id}`, data);
    return response.data;
  }

  async deletePackageDir(id: number): Promise<void> {
    await this.client.delete(`/package-dirs/${id}`);
  }
  async resolvePackageDir(specifier: string): Promise<PackageDirResolveResponse> {
    const response = await this.client.get<PackageDirResolveResponse>(`/package-dirs/resolve`, { params: { specifier } });
    return response.data;
  }
}

export const api = new ApiClient();
