# 🚀 Yumm Frontend - Production-Ready React Application

## 📋 Overview

This is a complete frontend application for the Yumm food ordering system. It's built with React, TypeScript, and integrates with a Supabase backend through Edge Functions.

## ✨ Features

### 🔐 **Authentication System**
- Production-ready Supabase authentication
- No more 429 refresh token errors
- Proper session management with exponential backoff
- Role-based access control (Staff, Employee, Vendor)

### 🗄️ **Backend Integration**
- All data operations use backend Edge Functions
- No direct database queries from frontend
- Proper error handling and user feedback
- Clean separation of concerns

### 🛡️ **Error Handling**
- React Error Boundary for graceful error handling
- Comprehensive try-catch blocks
- User-friendly error messages
- Graceful fallback for failed operations

### 📱 **User Interface**
- Modern, responsive design with Tailwind CSS
- Mobile-friendly navigation
- Real-time data updates
- Intuitive user experience

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables
Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=your_supabase_functions_url
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components
│   └── ui/             # UI components
├── pages/              # Page components
│   ├── employee/       # Employee pages
│   ├── staff/          # Staff pages
│   └── vendor/         # Vendor pages
├── services/           # API services
├── store/              # State management
├── lib/                # Utilities and configurations
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

backend/
├── supabase/
│   ├── functions/      # Supabase Edge Functions (47 functions)
│   ├── migrations/     # Database migrations
│   └── shared/         # Shared utilities and types
└── tests/              # Backend tests and documentation

tests/
├── integration-test.js      # Comprehensive integration test
├── run-integration-test.js  # Test runner with setup/teardown
├── setup-env.js            # Environment setup helper
├── test-config.js          # Test configuration
└── README.md              # Test documentation
```

## 🔧 Key Components

### **Authentication**
- `src/lib/supabaseClient.ts` - Production-ready Supabase client
- `src/lib/auth.ts` - Safe authentication helpers
- `src/store/authStore.ts` - Authentication state management

### **API Integration**
- `src/services/api.ts` - All API calls use backend Edge Functions
- No direct database queries
- Proper error handling and authentication

### **Error Handling**
- `src/components/ErrorBoundary.tsx` - React error boundary
- Comprehensive error handling throughout the application

## 📋 Required Backend Functions

The application requires the following backend Edge Functions to be implemented:

1. `get_vendors` - Fetch vendors with role-based access
2. `get_menu_items` - Fetch menu items with authentication
3. `get_orders` - Fetch orders with proper filtering
4. `get_employees` - Fetch employees with organization filtering
5. `get_organization_staff` - Fetch staff with access control
6. `get_organization` - Fetch organization data

Complete specifications are documented in `src/MISSING_BACKEND_FUNCTIONS.md`.

## 🎯 User Roles

### **Organization Staff**
- Manage employees and vendors
- View organization analytics
- Manage organization settings

### **Employees**
- Browse vendor menus
- Place orders
- View order history
- Manage cart

### **Vendors**
- Manage menu items
- View and update orders
- Manage vendor settings

## 🚀 Production Ready

This frontend application is production-ready with:
- ✅ No refresh token issues
- ✅ No direct database queries
- ✅ Proper error handling
- ✅ Clean architecture
- ✅ Comprehensive documentation

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

### Testing
- `npm run test:integration` - Run comprehensive integration tests
- `npm run test:integration:verbose` - Run tests with verbose output
- `npm run test:integration:clean` - Run tests with cleanup
- `npm run test:setup-env` - Create environment template
- `npm run test:validate-env` - Validate environment variables

### Code Style
- ESLint configuration for code quality
- TypeScript for type safety
- Tailwind CSS for styling
- Component-based architecture

## Testing

### Integration Tests

The project includes comprehensive integration tests that verify the complete application flow:

1. **Organization Registration** - New organization signs up with staff member
2. **Staff Authentication** - Staff member logs in successfully
3. **Employee Management** - Staff creates a new employee account
4. **Vendor Management** - Staff creates a new vendor account
5. **Vendor Authentication** - Vendor logs in successfully
6. **Menu Management** - Vendor creates menu items
7. **Employee Authentication** - Employee logs in successfully
8. **Vendor Discovery** - Employee can view available vendors
9. **Menu Browsing** - Employee can view vendor menu items
10. **Order Placement** - Employee places an order
11. **Order Management** - Order appears in employee's order list
12. **Order Status Updates** - Vendor updates order status
13. **Order Cancellation** - Employee requests order cancellation
14. **Cancellation Handling** - Vendor handles cancellation request

### Running Tests

#### Prerequisites
1. Set up environment variables (see [Environment Setup](#environment-setup))
2. Ensure your Supabase project is running
3. Apply all database migrations

#### Quick Start
```bash
# Set up environment template
npm run test:setup-env

# Validate environment variables
npm run test:validate-env

# Run integration tests
npm run test:integration

# Run with verbose output
npm run test:integration:verbose

# Run with cleanup
npm run test:integration:clean
```

#### Environment Setup
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Test Features
- **Automatic Cleanup** - Test data is automatically created and cleaned up
- **Comprehensive Coverage** - Tests all major application workflows
- **Error Handling** - Verifies proper error responses and handling
- **Real-time Updates** - Tests data consistency across user sessions
- **Role-based Access** - Verifies different user roles can access appropriate functions

### Test Results
The integration test provides detailed output showing:
- ✅ **Passed Tests** - Successfully completed test steps
- ❌ **Failed Tests** - Failed test steps with error details
- 📈 **Success Rate** - Percentage of tests that passed
- ⏱️ **Execution Time** - Total time taken to run all tests

For detailed test documentation, see [tests/README.md](tests/README.md).

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

## 📝 License

This project is licensed under the MIT License.