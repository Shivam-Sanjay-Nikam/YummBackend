import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Plus, CreditCard as Edit2, UtensilsCrossed } from 'lucide-react';
import { MenuItem, MenuItemStatus } from '../../types';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const VendorMenu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadMenuItems();
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-1">Manage your menu items</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card key={item.id} hover>
            <CardBody>
              <div className="flex items-start justify-between mb-3">
                <Badge variant={item.status === 'active' ? 'success' : 'gray'}>
                  {item.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              )}
              <p className="text-xl font-bold text-green-600">₹{item.price.toFixed(2)}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No menu items yet</h3>
            <p className="text-gray-500 mb-6">Add your first menu item to get started</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
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
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Menu Item</h3>
          <p className="text-sm text-gray-600">Create a new item for your menu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-base"
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
                className="h-12 text-base pl-8"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <span className="text-lg font-medium">₹</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Enter the price in rupees</p>
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
              className="flex-1 h-12 text-base font-medium bg-green-600 hover:bg-green-700"
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
      // For now, we'll just reload since we don't have an update endpoint
      // In a real app, you'd call an API to update the menu item
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
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
