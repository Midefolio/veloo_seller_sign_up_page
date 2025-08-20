"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Phone, Mail, AlertCircle, Shield, ChevronDown, MapPin, User, Building,  ArrowLeft, ShoppingBag, HouseIcon, CogIcon } from 'lucide-react';
import OTPVerification from './otpVerification';
import { makeRequest } from '../hook/useApi';
import { EMAIL_SIGNUP_API } from '../apis';

// Type definitions
interface FormData {
  firstName: string;
  lastName: string;
  businessEmail: string;
  password: string;
  phoneNumber: string;
  businessType: string;
  state: string;
  location: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  businessEmail?: string;
  password?: string;
  phoneNumber?: string;
  businessType?: string;
  state?: string;
  location?: string;
  agreeToTerms?: string;
}

interface PasswordStrength {
  score: number;
  strength: string;
  color: string;
  feedback: string[];
}

const businessTypes = [
  { value: 'shop', label: 'Shop', icon: <ShoppingBag size={20} /> },
  { value: 'restaurant', label: 'Restaurant', icon: <HouseIcon size={20} /> },
  { value: 'service-provider', label: 'Service Provider', icon: <CogIcon size={20} /> }
];

const locations = [
  { value: 'ilorin', label: 'Ilorin' },
  { value: 'malete', label: 'Malete' }
];

// Constants for localStorage keys
const STORAGE_KEYS = {
  SHOW_OTP_VERIFICATION: 'veloo_show_otp_verification',
  VERIFIED_EMAIL: 'veloo_verified_email',
  FORM_DATA: 'veloo_form_data'
};

const SellerSignup: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState<boolean>(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showOtpVerification, setShowOtpVerification] = useState<boolean>(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    businessEmail: '',
    password: '',
    phoneNumber: '',
    businessType: '',
    state: 'kwara',
    location: '',
    agreeToTerms: false,
  });

  // Load state from localStorage on component mount
  useEffect(() => {
    const loadStoredState = () => {
      try {
        // Check if OTP verification should be shown
        const storedShowOtp = localStorage.getItem(STORAGE_KEYS.SHOW_OTP_VERIFICATION);
        const storedEmail = localStorage.getItem(STORAGE_KEYS.VERIFIED_EMAIL);
        const storedFormData = localStorage.getItem(STORAGE_KEYS.FORM_DATA);

        if (storedShowOtp === 'true' && storedEmail) {
          setShowOtpVerification(true);
          setVerifiedEmail(storedEmail);
        }

        if (storedFormData) {
          const parsedFormData = JSON.parse(storedFormData);
          setFormData(parsedFormData);
        }
      } catch (error) {
        console.error('Error loading state from localStorage:', error);
        // Clear corrupted data
        clearStoredVerificationState();
      }
    };

    loadStoredState();
  }, []);

  // Save verification state to localStorage
  const saveVerificationState = (email: string, formDataToSave: FormData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOW_OTP_VERIFICATION, 'true');
      localStorage.setItem(STORAGE_KEYS.VERIFIED_EMAIL, email);
      localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(formDataToSave));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  };

  // Clear verification state from localStorage
  const clearStoredVerificationState = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SHOW_OTP_VERIFICATION);
      localStorage.removeItem(STORAGE_KEYS.VERIFIED_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.FORM_DATA);
    } catch (error) {
      console.error('Error clearing state from localStorage:', error);
    }
  };

  const checkPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];
    
    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('One lowercase letter');
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('One uppercase letter');
    
    if (/\d/.test(password)) score++;
    else feedback.push('One number');
    
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    else feedback.push('One special character');
    
    let strength = 'Very Weak';
    let color = 'bg-red-500';
    
    if (score >= 5) {
      strength = 'Very Strong';
      color = 'bg-green-500';
    } else if (score >= 4) {
      strength = 'Strong';
      color = 'bg-yellow-500';
    } else if (score >= 3) {
      strength = 'Medium';
      color = 'bg-yellow-400';
    } else if (score >= 2) {
      strength = 'Weak';
      color = 'bg-orange-500';
    }
    
    return { score, strength, color, feedback };
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.businessEmail.trim()) newErrors.businessEmail = 'Business email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.businessEmail)) newErrors.businessEmail = 'Invalid email format';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else {
      const passwordStrength = checkPasswordStrength(formData.password);
      if (passwordStrength.score < 3) {
        newErrors.password = 'Password is too weak';
      }
    }
    
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^[\d\s-()]{7,}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Invalid phone number';
    
    if (!formData.businessType) newErrors.businessType = 'Business type is required';
    if (!formData.location) newErrors.location = 'Location is required';
    
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return;
    setIsLoading(true);

    const {res} = await makeRequest("POST", EMAIL_SIGNUP_API, formData, ()=>{ setIsLoading(false)}, null, null, "urlencoded");
    if(res){
      setVerifiedEmail(formData.businessEmail);
      setShowOtpVerification(true);
      // Save state to localStorage
      saveVerificationState(formData.businessEmail, formData);
      setIsLoading(false);
    }
  };

  const selectedBusinessType = businessTypes.find(type => type.value === formData.businessType);
  const selectedLocation = locations.find(loc => loc.value === formData.location);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowBusinessTypeDropdown(false);
      setShowLocationDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleVerificationComplete = () => {
    // Clear stored state when verification is complete
    clearStoredVerificationState();
    window.open('http://app.seller.velooapp.com');
  };

  const handleBackToSignup = () => {
    // Clear stored state when going back to signup
    clearStoredVerificationState();
    setShowOtpVerification(false);
    setVerifiedEmail('');
  };

  const handleEmailChange = (newEmail: string) => {
    setVerifiedEmail(newEmail);
    const updatedFormData = { ...formData, businessEmail: newEmail };
    setFormData(updatedFormData);
    // Update localStorage with new email
    saveVerificationState(newEmail, updatedFormData);
  };

  return (
  <div className="min-h-screen">
    {showOtpVerification ? (
      <OTPVerification 
        email={verifiedEmail}
        onVerificationComplete={handleVerificationComplete}
        onBackToSignup={handleBackToSignup}
        onEmailChange={handleEmailChange}
        handleSubmit={handleSubmit}
        formData={formData}
      />
    ) : (
     
      <div className="flex flex-col bg-gray-50 lg:flex-row min-h-screen">
        
        {/* Header Section - Mobile/Tablet */}
        <div className="lg:hidden bg-white px-6 sm:px-6 py-6 boder-b border-gray-200">
          <div className="text-ceter">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-3xl font-bold text-gray-900"
            >
              Sell on Veloo
            </motion.h1>
            <motion.p 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-xs sm:text-base"
            >
              Start selling and grow your business today
            </motion.p>
            <p className='pt-5 text-xs p-2 flex gap-2 items-center px-0'> <ArrowLeft size={20}/> Back</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 -mt-5 md:mt-unset flex tems-center justify-center sm:px-6 lg:py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md lg:max-w-lg xl:max-w-xl bg-white rounded-2xl shaow-lg p-6 sm:p-8"
          >       
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 sm:space-y-5"
            >
            <p className='hidden md:flex cursor-pointer text-sm p-2  gap-2 items-center px-0'> <ArrowLeft size={20}/> Back</p>
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm sm:text-base ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="John"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm sm:text-base ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Business Email */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm sm:text-base ${
                      errors.businessEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your.business@example.com"
                  />
                </div>
                {errors.businessEmail && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {errors.businessEmail}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 h-10 sm:h-12 border border-gray-300 rounded-lg bg-gray-50 min-w-[80px] sm:min-w-[100px] justify-center">
                    <span className="text-sm sm:text-lg">🇳🇬</span>
                    <span className="text-xs sm text-xs:md:text-sm font-medium">+234</span>
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className={`w-full pl-9 sm:pl-10 pr-4 h-10 sm:h-12 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm sm:text-base ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="803 123 4567"
                    />
                  </div>
                </div>
                {errors.phoneNumber && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Business Type
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBusinessTypeDropdown(!showBusinessTypeDropdown);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-left text-sm sm:text-base ${
                      errors.businessType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      {selectedBusinessType ? (
                        <>
                          <span className="text-sm sm:text-lg">{selectedBusinessType.icon}</span>
                          <span className="text-sm sm:text-base">{selectedBusinessType.label}</span>
                        </>
                      ) : (
                        <span className="text-gray-500 text-sm sm:text-base">Select your business type</span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  </button>
                  
                  {showBusinessTypeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden"
                    >
                      {businessTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInputChange('businessType', type.value);
                            setShowBusinessTypeDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:py-3 hover:bg-gray-50 text-left transition-colors text-sm sm:text-base"
                        >
                          <span className="text-sm sm:text-lg">{type.icon}</span>
                          <span className="font-medium">{type.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
                {errors.businessType && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {errors.businessType}
                  </p>
                )}
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* State */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <div className="flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <span className="text-gray-700 text-sm sm:text-base">Kwara</span>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLocationDropdown(!showLocationDropdown);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-left text-sm sm:text-base ${
                        errors.location ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        {selectedLocation ? (
                          <span className="text-sm sm:text-base">{selectedLocation.label}</span>
                        ) : (
                          <span className="text-gray-500 text-sm sm:text-base">Select location</span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    </button>
                    
                    {showLocationDropdown && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden"
                      >
                        {locations.map((location) => (
                          <button
                            key={location.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInputChange('location', location.value);
                              setShowLocationDropdown(false);
                            }}
                            className="w-full flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:py-3 hover:bg-gray-50 text-left transition-colors text-sm sm:text-base"
                          >
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            <span className="font-medium">{location.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                  {errors.location && (
                    <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {errors.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm sm:text-base ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                
                {/* Password Strength */}
                {formData.password && (
                  <div className="mt-2 space-y-2">
                    {(() => {
                      const strength = checkPasswordStrength(formData.password);
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                            <span className="text-xs sm:text-sm text-gray-600">Strength: </span>
                            <span className={`text-xs sm text-xs:md:text-sm font-medium ${
                              strength.score >= 4 ? 'text-green-600' : 
                              strength.score >= 3 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {strength.strength}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                              style={{ width: `${(strength.score / 5) * 100}%` }}
                            />
                          </div>
                          {strength.feedback.length > 0 && (
                            <p className="text-xs sm:text-sm text-gray-500">
                              Missing: {strength.feedback.join(', ')}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                    className={`mt-1 w-4 h-4 text-green-600 border-2 rounded focus:ring-green-500 focus:ring-2 ${
                      errors.agreeToTerms ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    I agree to Veloo's{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {errors.agreeToTerms}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                {isLoading ? 'Creating Account...' : 'Create Seller Account'}
              </motion.button>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  Already have an account?{' '}
                  <button onClick={()=>{window.open('https://app.sellers.velooapp.com/login')}} className="text-green-600 hover:text-green-700 font-medium transition-colors">
                    Sign in here
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side Header - Desktop */}
        <div className="hidden lg:flex lg:w-1/3 xl:w-2/5 bg-gradient-to-br from-blue-50 to-purple-50 items-center justify-center p-8">
          <div className="text-center max-w-md">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl xl:text-5xl font-bold mb-4 text-gray-900"
            >
              Sell on Veloo
            </motion.h1>
            <motion.p 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-lg xl:text-xl leading-relaxed"
            >
              Start selling and grow your business today. Join thousands of successful sellers.
            </motion.p>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <div className="text-6xl xl:text-7xl mb-4">🚀</div>
              <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
                <div>
                  <div className="font-semibold text-gray-700">Easy Setup</div>
                  <div>Quick registration</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Reach More</div>
                  <div>Grow your audience</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Earn More</div>
                  <div>Increase revenue</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

    )}
  </div>
  );
};

export default SellerSignup;