import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    org_name: '',
    staff_name: '',
    staff_email: '',
    staff_password: '',
    staff_phone: '',
    latitude: 0,
    longitude: 0,
    special_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [specialNumberError, setSpecialNumberError] = useState('');

  useEffect(() => {
    document.title = 'Yuum';
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        toast.success('Location detected successfully!');
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to get your location. Please enter manually.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const generateSpecialNumber = async () => {
    // Generate a random 6-digit number
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    setFormData(prev => ({
      ...prev,
      special_number: randomNumber.toString()
    }));
    setSpecialNumberError('');
    toast.success('Special number generated! Note: This will be validated for uniqueness on submission.');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Validate special number if it's being changed
    if (name === 'special_number') {
      // Only allow digits and limit to 6 characters
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      
      // Validate length
      if (numericValue.length > 0 && numericValue.length < 6) {
        setSpecialNumberError('Special number must be exactly 6 digits');
      } else if (numericValue.length === 6) {
        setSpecialNumberError('');
      } else {
        setSpecialNumberError('');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate special number (required field)
    if (!formData.special_number || formData.special_number.length !== 6) {
      setSpecialNumberError('Special number must be exactly 6 digits');
      toast.error('Please enter a valid 6-digit special number');
      return;
    }
    
    setLoading(true);

    try {
      const result = await api.auth.registerOrganization(formData);
      if (result.error) {
        // Handle special number uniqueness error
        if (result.error.message && result.error.message.includes('Special number already exists')) {
          setSpecialNumberError('This special number is already taken. Please choose a different one.');
        }
        toast.error(result.error.message || 'Failed to register organization');
      } else {
        toast.success('Organization registered successfully! Please sign in.');
        // Redirect to login page
        window.location.href = '/login';
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to register organization';
      // Handle special number uniqueness error
      if (errorMessage.includes('Special number already exists')) {
        setSpecialNumberError('This special number is already taken. Please choose a different one.');
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-2xl relative z-10">
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
          <p className="text-gray-600 text-lg font-medium">Create your organization account</p>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Register Your Organization</h2>
              <p className="text-gray-600">Set up your organization account</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="org_name"
                    value={formData.org_name}
                    onChange={handleInputChange}
                    placeholder="Enter organization name"
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Staff Phone
                  </label>
                  <Input
                    type="tel"
                    name="staff_phone"
                    value={formData.staff_phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Staff Name
                  </label>
                  <Input
                    type="text"
                    name="staff_name"
                    value={formData.staff_name}
                    onChange={handleInputChange}
                    placeholder="Enter your name (optional)"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Staff Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    name="staff_email"
                    value={formData.staff_email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="staff_password"
                    value={formData.staff_password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Location (Latitude & Longitude)
                  </label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {locationLoading ? 'Detecting...' : '📍 Get My Location'}
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Latitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      placeholder="Auto-detected or enter manually"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Longitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      placeholder="Auto-detected or enter manually"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Special Number <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSpecialNumber}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                  >
                    🎲 Generate
                  </button>
                </div>
                <Input
                  type="text"
                  name="special_number"
                  value={formData.special_number}
                  onChange={handleInputChange}
                  placeholder="Enter 6-digit special number"
                  required
                  maxLength={6}
                  className={`h-12 text-base ${specialNumberError ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {specialNumberError && (
                  <p className="text-sm text-red-500 mt-1">{specialNumberError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must be exactly 6 digits and unique across all organizations (e.g., 123456)
                </p>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? 'Creating Organization...' : 'Create Organization'}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <a
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors duration-200"
                >
                  Sign in to your account
                </a>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
