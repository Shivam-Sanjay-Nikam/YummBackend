import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, IndianRupee, Users } from 'lucide-react';
import { Employee } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const StaffEmployees: React.FC = () => {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (user) {
      loadEmployees();
    }
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">Manage your organization's employees</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Employee
        </Button>
      </div>

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
                {employees.map((employee) => (
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateBalance(employee)}
                      >
                        <IndianRupee className="w-4 h-4 mr-1" />
                        Update Balance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No employees yet. Add your first employee!</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

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

          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 text-base font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={loading} 
              className="flex-1 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
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
        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Update
          </Button>
        </div>
      </form>
    </Modal>
  );
};
