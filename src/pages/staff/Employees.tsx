import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { SearchInput } from '../../components/ui/SearchInput';
import { SortDropdown } from '../../components/ui/SortDropdown';
import { FilterBar } from '../../components/ui/FilterBar';
import { Plus, IndianRupee, Users, Edit2, Trash2, Upload, FileSpreadsheet, Key } from 'lucide-react';
import { Employee } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { useRealtimeEmployees } from '../../hooks/useRealtimeData';
import { useSearchAndFilter } from '../../hooks/useSearchAndFilter';
import toast from 'react-hot-toast';

export const StaffEmployees: React.FC = () => {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Search and filter state
  const { state, updateFilter, clearAllFilters, hasActiveFilters } = useSearchAndFilter({
    initialSortBy: 'name',
    initialSortDirection: 'asc'
  });

  useEffect(() => {
    if (user) {
      loadEmployees();
    }
  }, [user]);

  // Set up real-time subscription for employees
  useRealtimeEmployees(() => {
    if (user) {
      loadEmployees();
    }
  });

  const loadEmployees = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await api.data.getEmployees(user.email);
      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      toast.error('Failed to load employees');
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowBalanceModal(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleChangePassword = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowPasswordModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;
    
    try {
      const { error } = await api.staff.deleteEmployee({ employee_id: selectedEmployee.id });
      if (error) throw error;
      
      toast.success('Employee deleted successfully');
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete employee');
    }
  };

  // Filter and sort employees
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = [...employees];

    // Search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(employee => 
        employee.name?.toLowerCase().includes(searchLower) ||
        employee.email?.toLowerCase().includes(searchLower) ||
        employee.special_number?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (state.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (state.sortBy) {
          case 'name':
            aValue = a.name || '';
            bValue = b.name || '';
            break;
          case 'email':
            aValue = a.email || '';
            bValue = b.email || '';
            break;
          case 'balance':
            aValue = a.balance || 0;
            bValue = b.balance || 0;
            break;
          case 'created_at':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return state.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return state.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [employees, state.searchTerm, state.sortBy, state.sortDirection]);

  // Sort options
  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)', direction: 'asc' as const },
    { value: 'name-desc', label: 'Name (Z-A)', direction: 'desc' as const },
    { value: 'balance-desc', label: 'Dues (High to Low)', direction: 'desc' as const }
  ];

  const handleSortChange = (value: string) => {
    if (value.includes('-desc')) {
      const sortBy = value.replace('-desc', '');
      updateFilter('sortBy', sortBy);
      updateFilter('sortDirection', 'desc');
    } else {
      updateFilter('sortBy', value);
      updateFilter('sortDirection', 'asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">Manage your organization's employees</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setShowCsvImportModal(true)}
            variant="outline"
            className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50 font-medium px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Import CSV
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <FilterBar onClear={clearAllFilters} showClearButton={hasActiveFilters}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <SearchInput
              placeholder="Search by name, email, or ID..."
              value={state.searchTerm}
              onChange={(value) => updateFilter('searchTerm', value)}
              size="md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <SortDropdown
              options={sortOptions}
              value={`${state.sortBy}${state.sortDirection === 'desc' ? '-desc' : ''}`}
              onChange={handleSortChange}
              placeholder="↑↓ Sort employees..."
              size="md"
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              Showing {filteredAndSortedEmployees.length} of {employees.length} employees
            </div>
          </div>
        </div>
      </FilterBar>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {state.searchTerm ? 'No employees found' : 'No employees'}
                          </h3>
                          <p className="text-gray-500">
                            {state.searchTerm 
                              ? `No employees match "${state.searchTerm}"` 
                              : 'Get started by adding your first employee'
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{employee.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            ₹{employee.balance.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateBalance(employee)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <IndianRupee className="w-4 h-4 mr-1" />
                              Balance
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(employee)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChangePassword(employee)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <Key className="w-4 h-4 mr-1" />
                              Password
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(employee)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredAndSortedEmployees.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {state.searchTerm ? 'No employees found' : 'No employees'}
              </h3>
              <p className="text-gray-500">
                {state.searchTerm 
                  ? `No employees match "${state.searchTerm}"` 
                  : 'Get started by adding your first employee'
                }
              </p>
            </div>
          </Card>
        ) : (
          filteredAndSortedEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₹{employee.balance.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Balance</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateBalance(employee)}
                    className="flex-1 min-w-0 text-green-600 border-green-200 hover:bg-green-50 text-xs py-2"
                  >
                    <IndianRupee className="w-4 h-4 mr-1" />
                    Balance
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(employee)}
                    className="flex-1 min-w-0 text-blue-600 border-blue-200 hover:bg-blue-50 text-xs py-2"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleChangePassword(employee)}
                    className="flex-1 min-w-0 text-green-600 border-green-200 hover:bg-green-50 text-xs py-2"
                  >
                    <Key className="w-4 h-4 mr-1" />
                    Password
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(employee)}
                    className="flex-1 min-w-0 text-red-600 border-red-200 hover:bg-red-50 text-xs py-2"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadEmployees();
        }}
      />

      <UpdateBalanceModal
        isOpen={showBalanceModal}
        onClose={() => {
          setShowBalanceModal(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onSuccess={() => {
          setShowBalanceModal(false);
          setSelectedEmployee(null);
          loadEmployees();
        }}
      />

      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
          loadEmployees();
        }}
      />

      <DeleteEmployeeModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onConfirm={handleDeleteConfirm}
      />

      <CsvImportModal
        isOpen={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
        onSuccess={() => {
          loadEmployees();
          setShowCsvImportModal(false);
        }}
        type="employees"
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        employee={selectedEmployee}
        onSuccess={() => {
          setShowPasswordModal(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
};

const AddEmployeeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.staff.createEmployee({
        name,
        email,
        password,
        balance: parseFloat(balance),
      });
      toast.success('Employee created successfully');
      onSuccess();
      setName('');
      setEmail('');
      setPassword('');
      setBalance('0');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee" size="lg">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Employee Account</h3>
          <p className="text-sm text-gray-600">Add a new employee to your organization</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@example.com"
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                required
                className="h-12 text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Initial Balance <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                step="0.01"
                placeholder="0.00"
                required
                className="h-12 text-base pl-8"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Starting balance for the employee</p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="w-full sm:flex-1 h-12 text-base font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={loading} 
              className="w-full sm:flex-1 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const UpdateBalanceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}> = ({ isOpen, onClose, employee, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setLoading(true);

    try {
      await api.staff.updateEmployeeBalance({
        employee_id: employee.id,
        new_balance: employee.balance + parseFloat(amount),
      });
      toast.success('Balance updated successfully');
      onSuccess();
      setAmount('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update balance');
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Balance">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Current balance for <span className="font-medium">{employee.name}</span>:
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          ₹{employee.balance.toFixed(2)}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="number"
          label="Amount to Add"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          placeholder="0.00"
          required
        />
        <p className="text-sm text-gray-500">
          Enter a positive number to add funds, or a negative number to deduct.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:flex-1 h-12 text-base font-medium">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="w-full sm:flex-1 h-12 text-base font-medium">
            Update
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const EditEmployeeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}> = ({ isOpen, onClose, employee, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialNumber, setSpecialNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setEmail(employee.email || '');
      setPhoneNumber(employee.phone_number || '');
      setSpecialNumber(employee.special_number || '');
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setLoading(true);

    try {
      await api.staff.updateEmployee({
        employee_id: employee.id,
        name,
        email,
        phone_number: phoneNumber,
        special_number: specialNumber,
      });
      toast.success('Employee updated successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Employee">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Edit Employee</h3>
          <p className="text-sm text-gray-600">Update employee information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@example.com"
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 9876543210"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Special Number
            </label>
            <Input
              type="text"
              value={specialNumber}
              onChange={(e) => setSpecialNumber(e.target.value)}
              placeholder="Special identifier"
              className="h-12 text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="w-full sm:flex-1 h-12 text-base font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={loading} 
              className="w-full sm:flex-1 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Updating...' : 'Update Employee'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const DeleteEmployeeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onConfirm: () => void;
}> = ({ isOpen, onClose, employee, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Employee">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Employee</h3>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{employee?.name}</strong>? This action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="w-full sm:flex-1 h-12 text-base font-medium"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={onConfirm}
            className="w-full sm:flex-1 h-12 text-base font-medium bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Employee
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const CsvImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'employees' | 'vendors';
}> = ({ isOpen, onClose, onSuccess, type }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      parseCsvFile(selectedFile);
    }
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setErrors(['CSV file must have at least a header row and one data row']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = type === 'employees' 
        ? ['name', 'email', 'password']
        : ['name', 'email', 'password'];

      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
        return;
      }

      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = { row: index + 2 };
        
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        
        return row;
      });

      setPreview(data.slice(0, 5)); // Show first 5 rows
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      // Read file content
      const text = await file.text();
      
      // Get current user for authentication
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        toast.error('User not authenticated');
        return;
      }

      // Call the edge function
      const { data: result, error } = await supabase.functions.invoke('import_csv', {
        body: {
          csvData: text,
          type: type,
          user_email: user.email
        }
      });

      if (error) {
        console.error('CSV import error:', error);
        toast.error(error.message || 'Import failed');
        return;
      }

      if (result && result.success) {
        toast.success(`Successfully imported ${result.count} ${type}`);
        if (result.errors && result.errors.length > 0) {
          console.warn('Import warnings:', result.errors);
        }
        onSuccess();
      } else {
        toast.error(result?.error || 'Import failed');
      }
    } catch (error: any) {
      console.error('CSV import error:', error);
      toast.error('Import failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = type === 'employees' 
      ? ['name', 'email', 'password', 'phone_number', 'special_number', 'balance']
      : ['name', 'email', 'password', 'phone_number', 'latitude', 'longitude'];
    
    const csvContent = headers.join(',') + '\n' + 
      (type === 'employees' 
        ? 'John Doe,john@company.com,password123,+1234567890,EMP001,100.00\nJane Smith,jane@company.com,password456,+1234567891,EMP002,150.50\n'
        : 'Pizza Palace,pizza@palace.com,password123,+1234567890,40.7128,-74.0060\nBurger King,burger@king.com,password456,+1234567891,40.7589,-73.9851\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Import ${type.charAt(0).toUpperCase() + type.slice(1)} CSV`}>
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Import {type.charAt(0).toUpperCase() + type.slice(1)} from CSV</h3>
          <p className="text-sm text-gray-600">Upload a CSV file to import multiple {type} at once</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-3">CSV Format Requirements:</h4>
            <div className="text-xs text-blue-700 space-y-3">
              <div>
                <p className="font-semibold text-blue-800 mb-1">Required columns:</p>
                <p className="text-green-700">• name (employee full name)</p>
                <p className="text-green-700">• email (must be unique)</p>
                <p className="text-green-700">• password (for login)</p>
              </div>
              
              <div>
                <p className="font-semibold text-blue-800 mb-1">Optional columns:</p>
                <p className="text-gray-600">• phone_number (contact number)</p>
                <p className="text-gray-600">• special_number (employee ID)</p>
                <p className="text-gray-600">• balance (starting balance, defaults to 0.00)</p>
              </div>
              
              <div>
                <p className="font-semibold text-blue-800 mb-1">Format example:</p>
                <div className="bg-white border border-blue-200 rounded p-3 font-mono text-xs overflow-x-auto whitespace-pre">
{`name,email,password,phone_number,special_number,balance
John Doe,john@company.com,password123,+1234567890,EMP001,100.00
Jane Smith,jane@company.com,password456,+1234567891,EMP002,150.50`}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-yellow-800 font-medium">⚠️ Important Notes:</p>
                <ul className="text-yellow-700 text-xs mt-1 space-y-1">
                  <li>• Email addresses must be unique within your organization</li>
                  <li>• Password will be used for employee login</li>
                  <li>• Balance should be a number (e.g., 100.00)</li>
                  <li>• Phone numbers should include country code (e.g., +1234567890)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Need a template? Download our CSV template
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <Upload className="w-4 h-4 mr-1" />
              Download Template
            </Button>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Preview (first 5 rows):</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(preview[0] || {}).map((key) => (
                        <th key={key} className="text-left py-1 px-2 font-medium text-gray-600">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="py-1 px-2 text-gray-700">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:flex-1 h-12 text-base font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            loading={loading}
            disabled={!file || errors.length > 0}
            className="w-full sm:flex-1 h-12 text-base font-medium bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Importing...' : `Import ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Change Password Modal Component
const ChangePasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}> = ({ isOpen, onClose, employee, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee) return;
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.staff.changePassword({
        target_user_id: employee.id,
        new_password: newPassword,
        user_type: 'employee'
      });
      toast.success('Password changed successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <Key className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Change Password for {employee.name}
          </h3>
          <p className="text-sm text-gray-500">
            Enter a new password for this employee. They will need to use this password to log in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 text-base font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading || !newPassword || !confirmPassword}
              className="flex-1 h-12 text-base font-medium bg-green-600 hover:bg-green-700"
            >
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
