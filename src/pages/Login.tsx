import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await api.auth.login(email, password);
      if (error) {
        toast.error(error.message || 'Failed to login');
      } else if (data.user) {
        toast.success('Login successful!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center space-x-2 mb-4">
            <ShoppingBag className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Yuum</h1>
          <p className="text-gray-600">Food ordering made simple</p>
        </div>

        <Card>
          <CardBody>
            {!showRegister ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  <Input
                    type="password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button type="submit" loading={loading} className="w-full">
                    Sign In
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Need to register your organization?{' '}
                    <button
                      onClick={() => setShowRegister(true)}
                      className="text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Register here
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <RegisterForm onBack={() => setShowRegister(false)} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

const RegisterForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.auth.registerOrganization({
        org_name: orgName,
        staff_name: 'Admin', // Default admin name
        staff_email: email,
        staff_password: password,
      });
      
      if (response.success) {
        toast.success('Organization registered successfully! Please sign in.');
        onBack();
      } else {
        toast.error(response.error || 'Failed to register');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Register Organization</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          type="text"
          label="Organization Name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Acme Corp"
          required
        />
        <Input
          type="email"
          label="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
        />
        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Register
        </Button>
      </form>
      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          Back to Sign In
        </button>
      </div>
    </>
  );
};
