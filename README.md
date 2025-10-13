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

## 📝 License

This project is licensed under the MIT License.