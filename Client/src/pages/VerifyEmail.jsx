import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/Api';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const VerifyEmail = () => {
  // State for each digit of the verification code
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasCheckedCookie, setHasCheckedCookie] = useState(false);
  const navigate = useNavigate();
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const redirectAttempted = useRef(false);
  
  // Get userId from cookies
  const userId = Cookies.get('userId');
  
  useEffect(() => {
    // Give the cookie time to be set before checking
    const timer = setTimeout(() => {
      const userId = Cookies.get('userId');
      console.log('Delayed cookie check:', userId);
      
      if (!userId && !redirectAttempted.current) {
        // Only redirect once
        redirectAttempted.current = true;
        console.log('No userId found, redirecting to register');
        navigate('/register');
        toast.error('Please register first', {
          style: {
            background: '#f44336',
            color: '#fff',
            padding: '16px',
            borderRadius: '0px'
          },
          id: 'register-first', // Add an ID to prevent duplicate toasts
        });
      }
      
      setHasCheckedCookie(true);
    }, 800); // Wait longer to ensure cookie is properly set
    
    return () => clearTimeout(timer);
  }, [navigate]);

  // Start countdown timer for resend code button
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) clearInterval(timer);
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);
  
  // Handle input changes and auto-focus to next input
  const handleCodeChange = (index, value) => {
    // Allow only numbers
    if (!/^\d*$/.test(value)) return;
    
    // Create a new array with the updated digit
    const newCodeDigits = [...codeDigits];
    newCodeDigits[index] = value;
    setCodeDigits(newCodeDigits);
    
    // Auto-focus to next input if value is entered
    if (value !== '' && index < 5) {
      inputRefs[index + 1].current.focus();
    }
    
    // Auto-submit if all digits are filled
    if (value !== '' && index === 5 && newCodeDigits.every(digit => digit !== '')) {
      // Give a small delay before submitting to allow the UI to update
      setTimeout(() => {
        handleSubmit({ preventDefault: () => {} });
      }, 300);
    }
  };
  
  // Handle backspace key to go to previous input
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && codeDigits[index] === '' && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };
  
  // Handle pasting verification code
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    
    if (pastedText.length === 0) return;
    
    const newCodeDigits = [...codeDigits];
    
    // Fill in as many digits as we have from the pasted text
    for (let i = 0; i < Math.min(pastedText.length, 6); i++) {
      newCodeDigits[i] = pastedText[i];
    }
    
    setCodeDigits(newCodeDigits);
    
    // Focus the appropriate input after pasting
    if (pastedText.length < 6) {
      inputRefs[pastedText.length].current.focus();
    } else {
      inputRefs[5].current.focus();
      // Auto-submit if all digits are filled
      setTimeout(() => {
        handleSubmit({ preventDefault: () => {} });
      }, 300);
    }
  };
  
  const handleResendCode = async () => {
    if (!userId) {
      toast.error('Missing user information. Please register again.', {
        style: {
          background: '#f44336',
          color: '#fff',
          padding: '16px',
          borderRadius: '0px'
        }
      });
      navigate('/register');
      return;
    }
    
    setResendLoading(true);
    try {
      await api.post('/api/auth/resend-verification', { userId });
      
      toast.success('Verification code resent successfully!', {
        style: {
          background: '#4CAF50',
          color: '#fff',
          padding: '16px',
          borderRadius: '0px'
        }
      });
      
      // Set 60 seconds countdown before allowing another resend
      setCountdown(60);
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend code', {
        style: {
          background: '#f44336',
          color: '#fff',
          padding: '16px',
          borderRadius: '0px'
        }
      });
    } finally {
      setResendLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('Missing user information. Please register again.', {
        style: {
          background: '#f44336',
          color: '#fff',
          padding: '16px',
          borderRadius: '0px'
        }
      });
      navigate('/register');
      return;
    }
    
    // Combine the 6 digits into a single verification code
    const verificationCode = codeDigits.join('');
    
    if (verificationCode.length !== 6) {
      toast.error('Please enter all 6 digits of the verification code', {
        style: {
          background: '#f44336',
          color: '#fff',
          padding: '16px',
          borderRadius: '0px'
        }
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.post('/api/auth/verify-email', {
        userId,
        verificationToken: verificationCode
      });
      
      // Clear userId from cookies
      Cookies.remove('userId');
      
      toast.success('Email verified successfully!', {
        style: {
          background: '#4CAF50',
          color: '#fff',
          padding: '16px',
          borderRadius: '0px'
        }
      });
      
      // Wait for toast to be visible
      setTimeout(() => {
        navigate('/acceuil');
      }, 1500);
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid verification code', {
        style: {
          background: '#f44336',
          color: '#fff',
          padding: '16px',
          borderRadius: '0px'
        }
      });
      
      // Clear the inputs on error
      setCodeDigits(['', '', '', '', '', '']);
      // Focus the first input
      inputRefs[0].current.focus();
      
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state if we're checking the cookie or userId is undefined
  if (!hasCheckedCookie) {
    return (
      <div className="min-h-screen bg-base-200 font-poppins flex items-center justify-center">
        <div className="card flex-shrink-0 w-full max-w-md shadow-xl bg-base-100">
          <div className="card-body p-6 lg:p-8 text-center">
            <h2 className="text-2xl font-bold mb-6">Loading...</h2>
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show redirecting state if no userId
  if (!userId) {
    return (
      <div className="min-h-screen bg-base-200 font-poppins flex items-center justify-center">
        <div className="card flex-shrink-0 w-full max-w-md shadow-xl bg-base-100">
          <div className="card-body p-6 lg:p-8 text-center">
            <h2 className="text-2xl font-bold mb-6">Redirecting...</h2>
            <p className="mb-6">Please wait or <button onClick={() => navigate('/register')} className="link link-primary">return to registration</button></p>
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-base-200 font-poppins flex items-center justify-center">
      <div className="card flex-shrink-0 w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-primary">Verify Your Email</h2>
          <p className="text-center text-white mb-6">
            We've sent a verification code to your email address. Please enter it below to verify your account.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white font-medium">Verification Code</span>
              </label>
              
              {/* PIN Code Input */}
              <div className="flex justify-center space-x-2 mt-2">
                {codeDigits.map((digit, index) => (
                  <div key={index}>
                    <label htmlFor={`code-${index + 1}`} className="sr-only">Digit {index + 1}</label>
                    <input
                      type="text"
                      maxLength="1"
                      id={`code-${index + 1}`}
                      ref={inputRefs[index]}
                      className="block w-12 h-12 py-3 text-xl font-extrabold text-center text-primary bg-base-200 border border-base-300 rounded-lg focus:ring-primary focus:border-primary"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : null}
                      required
                    />
                  </div>
                ))}
              </div>
              
              <p className="mt-2 text-sm text-gray-300 text-center">
                Please enter the 6-digit code we sent to your email.
              </p>
            </div>
            
            <button
              type="submit"
              className={`btn btn-primary btn-md w-full ${
                isLoading ? 'loading' : ''
              }`}
              disabled={isLoading || codeDigits.some(digit => digit === '')}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm mb-2 text-gray-300">Didn't receive a code?</p>
            <button
              onClick={handleResendCode}
              className="btn btn-outline btn-sm"
              disabled={resendLoading || countdown > 0}
            >
              {countdown > 0 
                ? `Resend code (${countdown}s)` 
                : resendLoading 
                  ? 'Sending...' 
                  : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;