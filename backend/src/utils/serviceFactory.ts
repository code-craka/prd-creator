import { Pool } from 'pg';

// Base service interface
export interface BaseService {
  readonly serviceName: string;
}

// Service configuration options
export interface ServiceConfig {
  serviceName: string;
  dependencies?: {
    db?: Pool;
    [key: string]: any;
  };
}

// Abstract base service class
export abstract class BaseServiceClass implements BaseService {
  public readonly serviceName: string;
  protected readonly db?: Pool;

  constructor(config: ServiceConfig) {
    this.serviceName = config.serviceName;
    this.db = config.dependencies?.db;
  }

  // Common error handling
  protected handleError(error: any, operation: string): never {
    console.error(`[${this.serviceName}] Error in ${operation}:`, error);
    throw error;
  }

  // Common logging
  protected log(message: string, data?: any): void {
    console.log(`[${this.serviceName}] ${message}`, data || '');
  }

  // Common validation helper
  protected validateRequired(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName} is required`);
    }
  }
}

// Service factory function
export function createService<T extends BaseServiceClass>(
  ServiceClass: new (config: ServiceConfig) => T,
  config: ServiceConfig
): T {
  const service = new ServiceClass(config);
  
  // Add common service lifecycle hooks if needed
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ServiceFactory] Created service: ${config.serviceName}`);
  }
  
  return service;
}

// Service registry for dependency injection
class ServiceRegistry {
  private services = new Map<string, BaseService>();

  register<T extends BaseService>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T extends BaseService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found in registry`);
    }
    return service as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  list(): string[] {
    return Array.from(this.services.keys());
  }
}

export const serviceRegistry = new ServiceRegistry();

// Decorator for auto-registering services
export function RegisterService(name: string) {
  return function <T extends new (...args: any[]) => BaseServiceClass>(constructor: T): T {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        serviceRegistry.register(name, this);
      }
    } as T;
  };
}

// Common service patterns
export const ServicePatterns = {
  // CRUD operations pattern
  createCRUDMethods: <T>(tableName: string) => ({
    async create(data: Partial<T>): Promise<T> {
      // Implementation would be in the actual service
      throw new Error('Method must be implemented by service');
    },
    
    async findById(id: string): Promise<T | null> {
      throw new Error('Method must be implemented by service');
    },
    
    async update(id: string, data: Partial<T>): Promise<T> {
      throw new Error('Method must be implemented by service');
    },
    
    async delete(id: string): Promise<void> {
      throw new Error('Method must be implemented by service');
    },
    
    async findAll(filters?: any): Promise<T[]> {
      throw new Error('Method must be implemented by service');
    }
  }),

  // Pagination pattern
  createPaginationMethods: () => ({
    async paginate<T>(
      query: string, 
      params: any[], 
      page: number = 1, 
      limit: number = 20
    ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
      throw new Error('Method must be implemented by service');
    }
  })
};