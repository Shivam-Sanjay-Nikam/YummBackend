# Yuum Backend - Food Ordering System

A comprehensive food ordering system built with React, TypeScript, and Supabase.

## Features

### For Organization Staff
- **Dashboard**: Overview of orders, employees, and vendors
- **Employee Management**: Create and manage employee accounts, update balances
- **Vendor Management**: Create and manage vendor accounts

### For Employees
- **Browse Vendors**: View available vendors and their menu items
- **Shopping Cart**: Add items to cart and manage quantities
- **Order Management**: Place orders and track order status
- **Order History**: View past orders and request cancellations

### For Vendors
- **Order Management**: View and manage incoming orders
- **Menu Management**: Add and manage menu items
- **Order Status Updates**: Update order status and handle cancellation requests

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **UI Components**: Custom components with Headless UI

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Navbar, Sidebar, Layout)
│   └── ui/             # Basic UI components (Button, Card, Input, etc.)
├── hooks/              # Custom React hooks
├── lib/                # External library configurations
├── pages/              # Page components
│   ├── employee/       # Employee-specific pages
│   ├── staff/          # Staff-specific pages
│   ├── vendor/         # Vendor-specific pages
│   └── Login.tsx       # Authentication page
├── services/           # API services and external integrations
├── store/              # State management (Zustand stores)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yuum-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_BASE_URL=your_supabase_functions_url
   ```

4. **Deploy Backend (if not already done)**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Deploy migrations and functions
   supabase db push
   supabase functions deploy
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Usage

### 1. Register Organization
- Visit the application
- Click "Register here" on the login page
- Fill in organization details and admin credentials
- This creates the first staff member

### 2. Staff Operations
- Login with staff credentials
- **Dashboard**: View organization overview
- **Employees**: Create employee accounts and manage balances
- **Vendors**: Create vendor accounts

### 3. Employee Operations
- Login with employee credentials
- **Browse**: View available vendors and menu items
- **Cart**: Add items and manage quantities
- **Orders**: Place orders and track status

### 4. Vendor Operations
- Login with vendor credentials
- **Orders**: View and manage incoming orders
- **Menu**: Add and manage menu items

## API Endpoints

The application uses Supabase Edge Functions for backend operations:

- `POST /register_organization` - Register new organization
- `POST /create_employee` - Create employee account
- `POST /create_vendor` - Create vendor account
- `POST /place_order` - Place new order
- `POST /cancel_order_request` - Request order cancellation
- `POST /handle_cancel_request` - Handle cancellation requests
- `POST /vendor_add_menu_item` - Add menu item
- `PUT /update_employee_balance` - Update employee balance

## Database Schema

### Core Tables
- `organizations` - Organization information
- `organization_staff` - Staff members
- `employees` - Employee accounts
- `vendors` - Vendor accounts
- `menu_items` - Vendor menu items
- `orders` - Order records
- `order_items` - Individual order items

### Key Features
- **Real-time Updates**: All tables support real-time subscriptions
- **Row Level Security**: Data access controlled by user roles
- **Foreign Key Constraints**: Maintains data integrity
- **Audit Trails**: Created/updated timestamps on all records

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

### Code Style
- ESLint configuration for code quality
- TypeScript for type safety
- Tailwind CSS for styling
- Component-based architecture

## Deployment

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Update environment variables for production

### Backend Deployment
1. Deploy migrations: `supabase db push`
2. Deploy functions: `supabase functions deploy`
3. Configure production environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.