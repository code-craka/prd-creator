import { Knex } from 'knex';
import { db } from '../config/database';

/**
 * Generic database utilities to eliminate code duplication
 */

export interface FindOneOptions {
  errorMessage?: string;
  throwIfNotFound?: boolean;
}

export interface FindByIdOptions extends FindOneOptions {
  idField?: string;
}

/**
 * Generic find-by-ID with optional error throwing
 */
export async function findById<T = any>(
  table: string, 
  id: string | number, 
  options: FindByIdOptions = {}
): Promise<T | null> {
  const { 
    idField = 'id', 
    errorMessage = `${table.slice(0, -1)} not found`,
    throwIfNotFound = false 
  } = options;

  const record = await db(table).where(idField, id).first() as T | undefined;

  if (!record && throwIfNotFound) {
    throw new Error(errorMessage);
  }

  return record || null;
}

/**
 * Generic find-one with custom conditions
 */
export async function findOne<T = any>(
  table: string,
  conditions: Record<string, any>,
  options: FindOneOptions = {}
): Promise<T | null> {
  const { 
    errorMessage = `${table.slice(0, -1)} not found`,
    throwIfNotFound = false 
  } = options;

  let query = db(table);
  
  Object.entries(conditions).forEach(([key, value]) => {
    query = query.where(key, value);
  });

  const record = await query.first() as T | undefined;

  if (!record && throwIfNotFound) {
    throw new Error(errorMessage);
  }

  return record || null;
}

/**
 * Generic exists check
 */
export async function exists(
  table: string,
  conditions: Record<string, any>
): Promise<boolean> {
  let query = db(table);
  
  Object.entries(conditions).forEach(([key, value]) => {
    query = query.where(key, value);
  });

  const record = await query.first();
  return !!record;
}

/**
 * Generic count with conditions
 */
export async function count(
  table: string,
  conditions: Record<string, any> = {}
): Promise<number> {
  let query = db(table);
  
  Object.entries(conditions).forEach(([key, value]) => {
    query = query.where(key, value);
  });

  const result = await query.count('* as count').first() as { count: string | number };
  return typeof result.count === 'string' ? parseInt(result.count, 10) : result.count;
}

/**
 * Generic create and return
 */
export async function createAndReturn<T = any>(
  table: string,
  data: Record<string, any>,
  trx?: Knex.Transaction
): Promise<T> {
  const query = trx ? trx(table) : db(table);
  const [created] = await query.insert(data).returning('*');
  return created;
}

/**
 * Generic update and return
 */
export async function updateAndReturn<T = any>(
  table: string,
  id: string | number,
  data: Record<string, any>,
  options: { idField?: string; trx?: Knex.Transaction } = {}
): Promise<T | null> {
  const { idField = 'id', trx } = options;
  const query = trx ? trx(table) : db(table);
  
  const [updated] = await query
    .where(idField, id)
    .update(data)
    .returning('*');
    
  return updated || null;
}

/**
 * Generic soft delete (set deleted_at)
 */
export async function softDelete(
  table: string,
  id: string | number,
  options: { idField?: string; trx?: Knex.Transaction } = {}
): Promise<boolean> {
  const { idField = 'id', trx } = options;
  const query = trx ? trx(table) : db(table);
  
  const affectedRows = await query
    .where(idField, id)
    .update({ 
      deleted_at: new Date(),
      updated_at: new Date()
    });
    
  return affectedRows > 0;
}

/**
 * Generic hard delete
 */
export async function hardDelete(
  table: string,
  id: string | number,
  options: { idField?: string; trx?: Knex.Transaction } = {}
): Promise<boolean> {
  const { idField = 'id', trx } = options;
  const query = trx ? trx(table) : db(table);
  
  const affectedRows = await query.where(idField, id).del();
  return affectedRows > 0;
}

/**
 * Generic pagination
 */
export async function paginate<T = any>(
  table: string,
  page: number = 1,
  limit: number = 20,
  options: {
    conditions?: Record<string, any>;
    orderBy?: { column: string; direction?: 'asc' | 'desc' };
    select?: string | string[];
  } = {}
): Promise<{ data: T[]; total: number; page: number; limit: number; totalPages: number }> {
  const { conditions = {}, orderBy, select = '*' } = options;
  
  let query = db(table);
  let countQuery = db(table);

  // Apply conditions
  Object.entries(conditions).forEach(([key, value]) => {
    query = query.where(key, value);
    countQuery = countQuery.where(key, value);
  });

  // Apply ordering
  if (orderBy) {
    query = query.orderBy(orderBy.column, orderBy.direction || 'asc');
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.select(select).limit(limit).offset(offset);

  // Execute queries
  const [data, totalResult] = await Promise.all([
    query,
    countQuery.count('* as count').first()
  ]);

  const total = totalResult && typeof totalResult.count === 'string' 
    ? parseInt(totalResult.count, 10) 
    : (totalResult?.count as number) || 0;
    
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages
  };
}

/**
 * Generic batch operations
 */
export async function batchInsert<T = any>(
  table: string,
  records: Record<string, any>[],
  options: { 
    chunkSize?: number; 
    trx?: Knex.Transaction;
    returning?: boolean;
  } = {}
): Promise<T[]> {
  const { chunkSize = 100, trx, returning = false } = options;
  const query = trx ? trx(table) : db(table);
  
  if (returning) {
    const results: T[] = [];
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const inserted = await query.insert(chunk).returning('*');
      results.push(...inserted);
    }
    return results;
  } else {
    await query.insert(records);
    return [];
  }
}

/**
 * Increment a numeric field
 */
export async function increment(
  table: string,
  id: string | number,
  field: string,
  amount: number = 1,
  options: { idField?: string; trx?: Knex.Transaction } = {}
): Promise<void> {
  const { idField = 'id', trx } = options;
  const query = trx ? trx(table) : db(table);
  
  await query
    .where(idField, id)
    .increment(field, amount)
    .update({ updated_at: new Date() });
}

/**
 * Decrement a numeric field
 */
export async function decrement(
  table: string,
  id: string | number,
  field: string,
  amount: number = 1,
  options: { idField?: string; trx?: Knex.Transaction } = {}
): Promise<void> {
  const { idField = 'id', trx } = options;
  const query = trx ? trx(table) : db(table);
  
  await query
    .where(idField, id)
    .decrement(field, amount)
    .update({ updated_at: new Date() });
}

/**
 * Transaction wrapper
 */
export async function withTransaction<T>(
  callback: (trx: Knex.Transaction) => Promise<T>
): Promise<T> {
  return await db.transaction(callback);
}

// Type-safe table interfaces for common entities
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface TeamRecord {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PRDRecord {
  id: string;
  title: string;
  content: any;
  user_id: string;
  team_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Typed helpers for common entities
/**
 * Typed database helpers for specific entities
 */
export const userDb = {
  async findById(id: string) {
    return db('users')
      .where('id', id)
      .select(['id', 'email', 'name', 'avatar_url', 'current_team_id', 'created_at', 'updated_at'])
      .first();
  },

  async findByEmail(email: string) {
    return db('users')
      .where('email', email.toLowerCase())
      .select(['id', 'email', 'name', 'avatar_url', 'current_team_id', 'created_at', 'updated_at'])
      .first();
  },

  async findByEmailWithPassword(email: string) {
    return db('users')
      .where('email', email.toLowerCase())
      .select(['id', 'email', 'name', 'password_hash', 'avatar_url', 'current_team_id', 'created_at', 'updated_at'])
      .first();
  },

  async findByIdWithPassword(id: string) {
    return db('users')
      .where('id', id)
      .select(['id', 'email', 'name', 'password_hash', 'avatar_url', 'current_team_id', 'created_at', 'updated_at'])
      .first();
  },

  async create(data: Record<string, unknown>) {
    const [result] = await db('users')
      .insert(data)
      .returning(['id', 'email', 'name', 'avatar_url', 'current_team_id', 'created_at', 'updated_at']);
    return result;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const [result] = await db('users')
      .where('id', id)
      .update(updates)
      .returning(['id', 'email', 'name', 'avatar_url', 'current_team_id', 'created_at', 'updated_at']);
    return result;
  },

  async delete(id: string): Promise<boolean> {
    const deletedCount = await db('users').where('id', id).del();
    return deletedCount > 0;
  },

  async paginate(filters: Record<string, unknown> = {}, page = 1, limit = 10) {
    return paginate('users', page, limit, filters);
  }
};

export const teamDb = {
  async findById(id: string) {
    return db('teams').where('id', id).first();
  },

  async findBySlug(slug: string) {
    return db('teams').where('slug', slug).first();
  },

  async create(data: Record<string, unknown>) {
    const [result] = await db('teams').insert(data).returning('*');
    return result;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const [result] = await db('teams').where('id', id).update(updates).returning('*');
    return result;
  },

  async delete(id: string): Promise<boolean> {
    const deletedCount = await db('teams').where('id', id).del();
    return deletedCount > 0;
  },

  async getUserTeams(userId: string) {
    return db('teams')
      .join('team_members', 'teams.id', 'team_members.team_id')
      .where('team_members.user_id', userId)
      .select(['teams.*', 'team_members.role'])
      .orderBy('teams.created_at', 'desc');
  },

  async findMember(teamId: string, userId: string) {
    return db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .first();
  },

  async addMember(teamId: string, userId: string, role = 'member', invitedBy?: string) {
    const memberData: Record<string, unknown> = {
      team_id: teamId,
      user_id: userId,
      role,
      joined_at: db.fn.now(),
    };
    if (invitedBy) {
      memberData.invited_by = invitedBy;
    }
    
    await db('team_members').insert(memberData);
  }
};

export const prdDb = {
  async findById(id: string) {
    return db('prds').where('id', id).first();
  },

  async findBySlug(slug: string) {
    return db('prds').where('slug', slug).first();
  },

  async create(data: Record<string, unknown>) {
    const [result] = await db('prds').insert(data).returning('*');
    return result;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const [result] = await db('prds').where('id', id).update(updates).returning('*');
    return result;
  },

  async delete(id: string): Promise<boolean> {
    const deletedCount = await db('prds').where('id', id).del();
    return deletedCount > 0;
  },

  async getUserPRDs(userId: string, teamId?: string) {
    let query = db('prds').where('user_id', userId);
    if (teamId) {
      query = query.orWhere('team_id', teamId);
    }
    return query.orderBy('updated_at', 'desc');
  }
};
