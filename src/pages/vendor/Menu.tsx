import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Plus, Edit3, UtensilsCrossed, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { MenuItem, MenuItemStatus } from '../../types';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { confirmManager } from '../../components/ui/ConfirmDialog';
import { useRealtimeMenuItems } from '../../hooks/useRealtimeData';
import toast from 'react-hot-toast';

export const VendorMenu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadMenuItems();
  }, []);

  // Set up real-time subscription for menu items
  useRealtimeMenuItems(() => {
    loadMenuItems();
  });

  const loadMenuItems = async () => {
    if (!user?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      toast.error('Failed to load menu items');
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
  };

  const handleDelete = async (item: MenuItem) => {
    const confirmed = await confirmManager.confirm({
      title: 'Delete Menu Item',
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      await api.vendor.deleteMenuItem({ menu_item_id: item.id });
      toast.success('Menu item deleted successfully');
      loadMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete menu item');
    }
  };

  const handleToggleStatus = async (item: MenuItem) => {
    const newStatus: MenuItemStatus = item.status === 'active' ? 'inactive' : 'active';
    setTogglingStatus(item.id);
    
    try {
      await api.vendor.updateMenuItem({
        menu_item_id: item.id,
        status: newStatus,
      });
      toast.success(`Menu item ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      loadMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update menu item status');
    } finally {
      setTogglingStatus(null);
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your menu items</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {menuItems.map((item) => (
          <Card key={item.id} hover>
            <CardBody className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3">
                <Badge variant={item.status === 'active' ? 'success' : 'gray'}>
                  {item.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    disabled={togglingStatus === item.id}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      item.status === 'active' 
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    } ${togglingStatus === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={`${item.status === 'active' ? 'Deactivate' : 'Activate'} item`}
                  >
                    {togglingStatus === item.id ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-current border-t-transparent"></div>
                    ) : item.status === 'active' ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Edit item"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              )}
              <p className="text-lg sm:text-xl font-bold text-green-600">₹{item.price.toFixed(2)}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <Card>
          <CardBody className="text-center py-8 sm:py-12">
            <UtensilsCrossed className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No menu items yet</h3>
            <p className="text-gray-500 mb-6">Add your first menu item to get started</p>
            <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add Item
            </Button>
          </CardBody>
        </Card>
      )}

      <MenuItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadMenuItems();
        }}
      />

      <EditMenuItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSuccess={() => {
          setEditingItem(null);
          loadMenuItems();
        }}
      />
    </div>
  );
};

const MenuItemModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.vendor.addMenuItem({
        name,
        description: description || undefined,
        price: parseFloat(price),
        image_url: undefined,
        status: 'active',
      });
      toast.success('Menu item added successfully');
      onSuccess();
      setName('');
      setDescription('');
      setPrice('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Menu Item" size="lg">
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Add New Menu Item</h3>
          <p className="text-xs sm:text-sm text-gray-600">Create a new item for your menu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Item Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Deluxe Burger"
              required
              className="h-10 sm:h-12 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A delicious burger with fresh ingredients"
            />
            <p className="text-xs text-gray-500 mt-1">Optional - describe your menu item</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                placeholder="9.99"
                required
                className="h-10 sm:h-12 text-sm sm:text-base pl-8"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <span className="text-lg font-medium">₹</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Enter the price in rupees</p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={loading} 
              className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const EditMenuItemModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onSuccess: () => void;
}> = ({ isOpen, onClose, item, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<MenuItemStatus>('active');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
      setPrice(item.price.toString());
      setStatus(item.status);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setLoading(true);

    try {
      await api.vendor.updateMenuItem({
        menu_item_id: item.id,
        name,
        description: description || undefined,
        price: parseFloat(price),
        image_url: undefined,
        status,
      });
      toast.success('Menu item updated successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update menu item');
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Menu Item">
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <Input
          type="text"
          label="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <Input
          type="number"
          label="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          step="0.01"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MenuItemStatus)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
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
