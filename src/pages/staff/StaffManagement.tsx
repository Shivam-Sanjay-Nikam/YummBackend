import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Users, Edit2, Trash2, FileSpreadsheet, Upload, Key, Eye, EyeOff, Search } from 'lucide-react';
import { OrganizationStaff } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { useRealtimeOrganizationStaff } from '../../hooks/useRealtimeData';
import { PageLoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export const StaffManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [staff, setStaff] = useState<OrganizationStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<OrganizationStaff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadStaff();
    }
  }, [user]);

  // Set up real-time subscription for organization staff
  useRealtimeOrganizationStaff(() => {
    if (user) {
      loadStaff();
    }
  });

  const loadStaff = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await api.data.getOrganizationStaff(user.email);
      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      toast.error('Failed to load staff');
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember: OrganizationStaff) => {
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  };

  const handleDelete = (staffMember: OrganizationStaff) => {
    setSelectedStaff(staffMember);
    setShowDeleteModal(true);
  };

  const handleChangePassword = (staffMember: OrganizationStaff) => {
    setSelectedStaff(staffMember);
    setShowPasswordModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStaff) return;
    
    try {
      const { error } = await api.staff.deleteOrganizationStaff({ staff_id: selectedStaff.id });
      if (error) throw error;
      
      toast.success('Staff member deleted successfully');
      setShowDeleteModal(false);
      setSelectedStaff(null);
      loadStaff();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete staff member');
    }
  };

  // Filter staff based on search term
  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <PageLoadingSpinner message="Loading staff members..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage your organization's staff members</p>
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
            Add Staff
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200" />
          <Input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        {filteredStaff.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No staff found' : 'No staff members'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? `No staff members match "${searchTerm}"` 
                  : 'Get started by adding your first staff member'
                }
              </p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
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
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((staffMember) => (
                    <tr key={staffMember.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{staffMember.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{staffMember.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{staffMember.phone_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(staffMember.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(staffMember)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangePassword(staffMember)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Key className="w-4 h-4 mr-1" />
                            Password
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(staffMember)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredStaff.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No staff found' : 'No staff members'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? `No staff members match "${searchTerm}"` 
                  : 'Get started by adding your first staff member'
                }
              </p>
            </div>
          </Card>
        ) : (
          filteredStaff.map((staffMember) => (
          <Card key={staffMember.id} className="hover:shadow-md transition-all duration-300 transform hover:scale-[1.01] animate-fade-in">
            <CardBody className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{staffMember.name}</h3>
                    <p className="text-sm text-gray-600">{staffMember.email}</p>
                    <p className="text-xs text-gray-500">{staffMember.phone_number || 'No phone'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {new Date(staffMember.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(staffMember)}
                  className="flex-1 min-w-0 text-blue-600 border-blue-200 hover:bg-blue-50 text-xs py-2"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleChangePassword(staffMember)}
                  className="flex-1 min-w-0 text-green-600 border-green-200 hover:bg-green-50 text-xs py-2"
                >
                  <Key className="w-4 h-4 mr-1" />
                  Password
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(staffMember)}
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

      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadStaff();
        }}
      />

      <EditStaffModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedStaff(null);
          loadStaff();
          // Dispatch event to update navbar if current user was updated
          if (selectedStaff?.email === user?.email) {
            window.dispatchEvent(new CustomEvent('userUpdated'));
          }
        }}
      />

      <DeleteStaffModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        onConfirm={handleDeleteConfirm}
      />

      <CsvImportModal
        isOpen={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
        onSuccess={() => {
          loadStaff();
          setShowCsvImportModal(false);
        }}
        type="staff"
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        onSuccess={() => {
          setShowPasswordModal(false);
          setSelectedStaff(null);
        }}
      />
    </div>
  );
};

const AddStaffModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.staff.createOrganizationStaff({
        name,
        email,
        password,
        phone_number: phoneNumber,
      });
      toast.success('Staff member created successfully');
      onSuccess();
      setName('');
      setEmail('');
      setPassword('');
      setPhoneNumber('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Staff Member" size="lg">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Staff Account</h3>
          <p className="text-sm text-gray-600">Add a new staff member to your organization</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Staff Name <span className="text-red-500">*</span>
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
              placeholder="staff@example.com"
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
              {loading ? 'Creating...' : 'Create Staff Member'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const EditStaffModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  staff: OrganizationStaff | null;
  onSuccess: () => void;
}> = ({ isOpen, onClose, staff, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setEmail(staff.email || '');
      setPhoneNumber(staff.phone_number || '');
    }
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    setLoading(true);

    try {
      await api.staff.updateOrganizationStaff({
        staff_id: staff.id,
        name,
        email,
        phone_number: phoneNumber,
      });
      toast.success('Staff member updated successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Staff Member">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Edit Staff Member</h3>
          <p className="text-sm text-gray-600">Update staff member information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Staff Name <span className="text-red-500">*</span>
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
              placeholder="staff@example.com"
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
              {loading ? 'Updating...' : 'Update Staff Member'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const DeleteStaffModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  staff: OrganizationStaff | null;
  onConfirm: () => void;
}> = ({ isOpen, onClose, staff, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Staff Member">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Staff Member</h3>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{staff?.name}</strong>? This action cannot be undone.
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
            Delete Staff Member
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
  type: 'staff';
}> = ({ isOpen, onClose, onSuccess }) => {
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
      const requiredHeaders = ['name', 'email', 'password'];

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
          type: 'organization_staff',
          user_email: user.email
        }
      });

      if (error) {
        console.error('CSV import error:', error);
        toast.error(error.message || 'Import failed');
        return;
      }

      if (result && result.success) {
        toast.success(`Successfully imported ${result.count} staff members`);
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
    const headers = ['name', 'email', 'password', 'phone_number'];
    
    const csvContent = headers.join(',') + '\n' + 
      'John Admin,john@company.com,password123,+1234567890\nJane Manager,jane@company.com,password456,+1234567891\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Staff CSV">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Staff from CSV</h3>
          <p className="text-sm text-gray-600">Upload a CSV file to import multiple staff members at once</p>
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
                <p className="text-green-700">• name (staff full name)</p>
                <p className="text-green-700">• email (must be unique)</p>
                <p className="text-green-700">• password (for login)</p>
              </div>
              
              <div>
                <p className="font-semibold text-blue-800 mb-1">Optional columns:</p>
                <p className="text-gray-600">• phone_number (contact number)</p>
              </div>
              
              <div>
                <p className="font-semibold text-blue-800 mb-1">Format example:</p>
                <div className="bg-white border border-blue-200 rounded p-3 font-mono text-xs overflow-x-auto whitespace-pre">
{`name,email,password,phone_number
John Admin,john@company.com,password123,+1234567890
Jane Manager,jane@company.com,password456,+1234567891`}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-yellow-800 font-medium">⚠️ Important Notes:</p>
                <ul className="text-yellow-700 text-xs mt-1 space-y-1">
                  <li>• Email addresses must be unique within your organization</li>
                  <li>• Password will be used for staff login</li>
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
            {loading ? 'Importing...' : 'Import Staff Members'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const ChangePasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  staff: OrganizationStaff | null;
  onSuccess: () => void;
}> = ({ isOpen, onClose, staff, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staff) {
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    // Validate passwords
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
        target_user_id: staff.id,
        new_password: newPassword,
        user_type: 'organization_staff'
      });
      toast.success('Password changed successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h3>
          <p className="text-sm text-gray-600">
            Change password for <span className="font-medium">{staff?.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="h-12 text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters long
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="h-12 text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Important:</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• The user will need to use this new password to log in</li>
              <li>• Make sure to communicate the new password securely</li>
              <li>• This action cannot be undone</li>
            </ul>
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
              className="w-full sm:flex-1 h-12 text-base font-medium bg-green-600 hover:bg-green-700"
            >
              <Key className="w-4 h-4 mr-2" />
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
