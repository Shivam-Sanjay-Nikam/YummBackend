// Shared CRUD operations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Database, TableName, TableRow, TableInsert, TableUpdate, ApiResponse, PaginationParams, FilterParams } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export class CrudService<T extends TableName> {
  private tableName: T;

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  // Create a new record
  async create(data: TableInsert<T>): Promise<ApiResponse<TableRow<T>>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: result,
        message: 'Record created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get a record by ID
  async getById(id: string): Promise<ApiResponse<TableRow<T>>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get all records with optional filtering and pagination
  async getAll(
    filters: FilterParams = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<TableRow<T>[]>> {
    try {
      let query = supabase.from(this.tableName).select('*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply pagination
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update a record by ID
  async update(id: string, data: TableUpdate<T>): Promise<ApiResponse<TableRow<T>>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: result,
        message: 'Record updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete a record by ID
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Record deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Search records with text search
  async search(
    searchTerm: string,
    searchColumns: string[],
    filters: FilterParams = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<TableRow<T>[]>> {
    try {
      let query = supabase.from(this.tableName).select('*');

      // Apply text search across specified columns
      if (searchTerm && searchColumns.length > 0) {
        const searchConditions = searchColumns
          .map(column => `${column}.ilike.%${searchTerm}%`)
          .join(',');
        query = query.or(searchConditions);
      }

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply pagination
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Factory function to create CRUD service instances
export function createCrudService<T extends TableName>(tableName: T): CrudService<T> {
  return new CrudService(tableName);
}
