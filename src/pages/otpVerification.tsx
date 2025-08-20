import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, RotateCcw, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';
import { makeRequest } from '../hook/useApi';
import { EMAIL_SIGNUP_API, EMAIL_VERIFY_OTP_API } from '../apis';

interface OTPVerificationProps {
  email: string;
  formData:any;
  onVerificationComplete: () => void;
  onBackToSignup: () => void;
  handleSubmit: () => void;
  onEmailChange: (newEmail: string) => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  email, 
  onVerificationComplete, 
  onBackToSignup,
  onEmailChange,
  formData

}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length === 5) {
      const newOtp = pastedData.split('').slice(0, 5);
      setOtp(newOtp);
      setError('');
      inputRefs.current[4]?.focus();
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 5) {
      setError('Please enter the complete 5-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');
    
    const { res } = await makeRequest("POST", EMAIL_VERIFY_OTP_API, { email, otp: otpString }, () => { setIsVerifying(false) }, null, null, "urlencoded");
    if (res) {
      onVerificationComplete();
    }
  };

  const resendOtp = async () => {
    setIsResending(true);
    setError('');
    
    const {res} = await makeRequest("POST", EMAIL_SIGNUP_API, formData, ()=>{ setIsResending(false)}, null, null, "urlencoded");
    if(res){
      setIsResending(false);
    }
  
  };

  const updateEmail = async () => {
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsUpdatingEmail(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onEmailChange(newEmail);
      setIsEditingEmail(false);
      setOtp(['', '', '', '', '']);
      setCanResend(false);
      setCountdown(60);
      inputRefs.current[0]?.focus();
      
      console.log('Email updated to:', newEmail);
    } catch (error) {
      setError('Failed to update email. Please try again.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Header Section - Mobile/Tablet */}
        <div className="lg:hidden bg-white px-6 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBackToSignup}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm">Back</span>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Verify Your Email
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 lg:py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8"
          >
            {/* Back button - Desktop */}
            <button 
              onClick={onBackToSignup}
              className="hidden lg:flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-6"
            >
              <ArrowLeft size={20} />
              <span className="text-sm">Back to signup</span>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                We've sent a 5-digit verification code to
              </p>
              
              {/* Email Display/Edit */}
              {isEditingEmail ? (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center"
                      placeholder="Enter new email"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={updateEmail}
                      disabled={isUpdatingEmail}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 text-sm"
                    >
                      {isUpdatingEmail ? 'Updating...' : 'Update'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingEmail(false);
                        setNewEmail(email);
                        setError('');
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                  <span className="text-sm sm:text-base">{email}</span>
                  <button
                    onClick={() => onBackToSignup()}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Edit email"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* OTP Input */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                  Enter verification code
                </label>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-bold border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                        error ? 'border-red-500' : 'border-gray-300'
                      }`}
                      maxLength={1}
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Verify Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={verifyOtp}
                disabled={isVerifying || otp.some(digit => !digit)}
                className="w-full bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </motion.button>

              {/* Resend Section */}
              <div className="text-center space-y-3">
                <p className="text-gray-600 text-sm">
                  Didn't receive the code?
                </p>
                
                {canResend ? (
                  <button
                    onClick={resendOtp}
                    disabled={isResending}
                    className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                ) : (
                  <div className="text-gray-500 text-sm">
                    Resend code in {formatTime(countdown)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Desktop */}
        <div className="hidden lg:flex lg:w-1/3 xl:w-2/5 bg-gradient-to-br from-green-50 to-blue-50 items-center justify-center p-8">
          <div className="text-center max-w-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </motion.div>
            
            <motion.h2 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-4 text-gray-900"
            >
              Almost There!
            </motion.h2>
            
            <motion.p 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 text-lg leading-relaxed mb-8"
            >
              Just one more step to complete your seller account setup and start growing your business.
            </motion.p>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4 text-sm text-gray-500"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Account information verified</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-green-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                </div>
                <span>Email verification in progress...</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                <span>Ready to start selling</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;