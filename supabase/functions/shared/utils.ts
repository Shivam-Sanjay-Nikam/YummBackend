// Shared utility functions
import { ApiResponse } from './types.ts';

export function createResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): Response {
  const response: ApiResponse<T> = {
    success,
    data,
    error,
    message,
  };

  return new Response(JSON.stringify(response), {
    status: success ? 200 : 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

export function createErrorResponse(error: string, status: number = 400): Response {
  return createResponse(false, undefined, error, undefined);
}

export function createSuccessResponse<T>(data: T, message?: string): Response {
  return createResponse(true, data, message);
}

export function parseUrlParams(url: string): { [key: string]: string } {
  const urlObj = new URL(url);
  const params: { [key: string]: string } = {};
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

export function extractPathSegments(url: string): string[] {
  const urlObj = new URL(url);
  return urlObj.pathname.split('/').filter(segment => segment !== '');
}

export function validateUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function parsePaginationParams(params: { [key: string]: string }) {
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 10;
  
  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)), // Cap at 100 records per page
  };
}

export function parseFilters(params: { [key: string]: string }) {
  const filters: { [key: string]: any } = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (key !== 'page' && key !== 'limit' && key !== 'search' && value) {
      // Try to parse as number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        filters[key] = numValue;
      } else {
        filters[key] = value;
      }
    }
  });
  
  return filters;
}

export function getSearchColumns(tableName: string): string[] {
  const searchableColumns: { [key: string]: string[] } = {
    organizations: ['name', 'special_number'],
    organization_staff: ['name', 'email', 'phone_number'],
    employees: ['name', 'email', 'phone_number', 'special_number'],
    vendors: ['name', 'email', 'phone_number'],
    menu_items: ['name'],
    orders: ['status'],
    order_items: [],
  };
  
  return searchableColumns[tableName] || [];
}

export function handleCors(request: Request): Response | null {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  
  return null;
}
