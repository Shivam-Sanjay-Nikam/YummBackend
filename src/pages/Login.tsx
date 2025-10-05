import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuthStore();

  useEffect(() => {
    document.title = 'Yuum';
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await login(email, password);
    if (result.success) {
      toast.success('Login successful!');
      
      // Redirect to appropriate dashboard based on user role
      const { user } = useAuthStore.getState();
      if (user) {
        switch (user.role) {
          case 'organization_staff':
            window.location.href = '/staff/dashboard';
            break;
          case 'employee':
            window.location.href = '/employee/dashboard';
            break;
          case 'vendor':
            window.location.href = '/vendor/dashboard';
            break;
          default:
            window.location.href = '/';
        }
      }
    } else {
      toast.error(result.error || 'Failed to login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <img 
                src="/YummLogo.png" 
                alt="Yuum Logo" 
                className="h-16 w-16 object-contain drop-shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-lg opacity-30 -z-10"></div>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Yuum
          </h1>
          <p className="text-gray-600 text-lg font-medium">Food ordering made simple</p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 mt-6 transition-colors duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
          </button>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardBody className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your account</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
              </div>
              <Button 
                type="submit" 
                loading={loading} 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an organization?{' '}
                <a
                  href="/register"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors duration-200"
                >
                  Register your organization
                </a>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

