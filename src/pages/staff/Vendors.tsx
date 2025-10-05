import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Store, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Vendor } from '../../types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const StaffVendors: React.FC = () => {
  const { user } = useAuthStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    if (user) {
      loadVendors();
    }
  }, [user]);

  const loadVendors = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await api.data.getVendorsForStaff(user.email);
      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      toast.error('Failed to load vendors');
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowEditModal(true);
  };

  const handleDelete = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVendor) return;
    
    try {
      const { error } = await api.staff.deleteVendor({ vendor_id: selectedVendor.id });
      if (error) throw error;
      
      toast.success('Vendor deleted successfully');
      setShowDeleteModal(false);
      setSelectedVendor(null);
      loadVendors();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete vendor');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">Manage your organization's vendors</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-medium px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
            <CardBody className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Store className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(vendor)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                    aria-label="Edit vendor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(vendor)}
                    className="text-red-600 border-red-200 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    aria-label="Delete vendor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{vendor.name}</h3>
                <p className="text-sm text-gray-600 break-all">{vendor.email}</p>
                {vendor.phone_number && (
                  <p className="text-sm text-gray-500">{vendor.phone_number}</p>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {vendors.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No vendors yet. Add your first vendor!</p>
          </CardBody>
        </Card>
      )}

      <AddVendorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadVendors();
        }}
      />

      <EditVendorModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedVendor(null);
        }}
        vendor={selectedVendor}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedVendor(null);
          loadVendors();
        }}
      />

      <DeleteVendorModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedVendor(null);
        }}
        vendor={selectedVendor}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

const AddVendorModal: React.FC<{
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
      await api.staff.createVendor({
        name,
        email,
        password,
        phone_number: phoneNumber,
      });
      toast.success('Vendor created successfully');
      onSuccess();
      setName('');
      setEmail('');
      setPassword('');
      setPhoneNumber('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Vendor" size="lg">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Vendor Account</h3>
          <p className="text-sm text-gray-600">Add a new vendor to your organization</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pizza Palace"
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
              placeholder="vendor@example.com"
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
              placeholder="+1 (555) 123-4567"
              className="h-12 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">Optional - for contact purposes</p>
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
              className="w-full sm:flex-1 h-12 text-base font-medium bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Creating...' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const EditVendorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onSuccess: () => void;
}> = ({ isOpen, onClose, vendor, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vendor) {
      setName(vendor.name || '');
      setEmail(vendor.email || '');
      setPhoneNumber(vendor.phone_number || '');
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    setLoading(true);

    try {
      await api.staff.updateVendor({
        vendor_id: vendor.id,
        name,
        email,
        phone_number: phoneNumber,
      });
      toast.success('Vendor updated successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Vendor">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Edit Vendor</h3>
          <p className="text-sm text-gray-600">Update vendor information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pizza Palace"
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
              placeholder="vendor@example.com"
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
              className="w-full sm:flex-1 h-12 text-base font-medium bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Updating...' : 'Update Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const DeleteVendorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onConfirm: () => void;
}> = ({ isOpen, onClose, vendor, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Vendor">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Vendor</h3>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{vendor?.name}</strong>? This action cannot be undone.
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
            Delete Vendor
          </Button>
        </div>
      </div>
    </Modal>
  );
};
