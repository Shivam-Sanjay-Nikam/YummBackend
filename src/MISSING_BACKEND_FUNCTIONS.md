# Missing Backend Functions

This document lists the backend Edge Functions that need to be implemented to complete the frontend-backend integration.

## Required Edge Functions

### 1. get_vendors
**Purpose**: Fetch vendors data with proper authentication and role-based access
**Endpoint**: `POST /functions/v1/get_vendors`
**Request Body**:
```json
{
  "user_email": "user@example.com"
}
```
**Response**:
```json
{
  "data": [
    {
      "id": "vendor-id",
      "name": "Vendor Name",
      "email": "vendor@example.com",
      "org_id": "org-id",
      "active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```
**Authentication**: Requires Authorization header with Bearer token
**Role-based Access**:
- `organization_staff`: Can see all vendors in their organization
- `employee`: Can see active vendors in their organization
- `vendor`: Can only see themselves

### 2. get_menu_items
**Purpose**: Fetch menu items for a specific vendor with proper authentication
**Endpoint**: `POST /functions/v1/get_menu_items`
**Request Body**:
```json
{
  "vendor_id": "vendor-id"
}
```
**Response**:
```json
{
  "data": [
    {
      "id": "menu-item-id",
      "name": "Menu Item Name",
      "description": "Description",
      "price": 10.50,
      "vendor_id": "vendor-id",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```
**Authentication**: Requires Authorization header with Bearer token
**Role-based Access**:
- `vendor`: Can only see their own menu items
- `employee`/`organization_staff`: Can see active menu items from vendors in their organization

### 3. get_orders
**Purpose**: Fetch orders data with proper authentication and role-based filtering
**Endpoint**: `POST /functions/v1/get_orders`
**Request Body**:
```json
{
  "user_role": "employee|vendor|organization_staff",
  "user_email": "user@example.com"
}
```
**Response**:
```json
{
  "data": [
    {
      "id": "order-id",
      "employee_id": "employee-id",
      "vendor_id": "vendor-id",
      "menu_item_id": "menu-item-id",
      "quantity": 2,
      "total_price": 21.00,
      "status": "placed",
      "created_at": "2024-01-01T00:00:00Z",
      "employee": {
        "name": "Employee Name"
      },
      "vendor": {
        "name": "Vendor Name"
      },
      "menu_item": {
        "name": "Menu Item Name",
        "price": 10.50
      }
    }
  ]
}
```
**Authentication**: Requires Authorization header with Bearer token
**Role-based Access**:
- `employee`: Can see their own orders
- `vendor`: Can see orders for their menu items
- `organization_staff`: Can see all orders in their organization

### 4. get_employees
**Purpose**: Fetch employees data with proper authentication and role-based access
**Endpoint**: `POST /functions/v1/get_employees`
**Request Body**:
```json
{
  "user_email": "user@example.com"
}
```
**Response**:
```json
{
  "data": [
    {
      "id": "employee-id",
      "name": "Employee Name",
      "email": "employee@example.com",
      "org_id": "org-id",
      "balance": 100.00,
      "active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```
**Authentication**: Requires Authorization header with Bearer token
**Role-based Access**:
- `organization_staff`: Can see all employees in their organization
- `employee`: Can only see themselves
- `vendor`: Cannot access employee data

### 5. get_organization_staff
**Purpose**: Fetch organization staff data with proper authentication
**Endpoint**: `POST /functions/v1/get_organization_staff`
**Request Body**:
```json
{
  "user_email": "user@example.com"
}
```
**Response**:
```json
{
  "data": [
    {
      "id": "staff-id",
      "name": "Staff Name",
      "email": "staff@example.com",
      "org_id": "org-id",
      "role": "organization_staff",
      "active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```
**Authentication**: Requires Authorization header with Bearer token
**Role-based Access**:
- `organization_staff`: Can see all staff in their organization
- `employee`/`vendor`: Cannot access staff data

### 6. get_organization
**Purpose**: Fetch organization data with proper authentication
**Endpoint**: `POST /functions/v1/get_organization`
**Request Body**:
```json
{
  "user_email": "user@example.com"
}
```
**Response**:
```json
{
  "data": {
    "id": "org-id",
    "name": "Organization Name",
    "email": "org@example.com",
    "phone": "+1234567890",
    "address": "Organization Address",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```
**Authentication**: Requires Authorization header with Bearer token
**Role-based Access**:
- All authenticated users can see their organization data

## Implementation Notes

1. **Authentication**: All functions should use the existing `authenticateUser` function from `shared/auth.ts`
2. **CORS**: All functions should include proper CORS headers using `corsHeaders` from `shared/utils.ts`
3. **Error Handling**: All functions should return proper error responses with appropriate HTTP status codes
4. **Role-based Access**: Implement proper role-based access control using the user's role from authentication
5. **Database Queries**: Use the Supabase client to query the database with proper filtering based on user role and organization

## Current Status

The frontend is now configured to use these backend functions instead of direct database queries. Once these functions are implemented and deployed, the application will be fully functional with proper backend-frontend integration.

## Testing

After implementing these functions, test them using the existing test suite to ensure they work correctly with the frontend integration.
