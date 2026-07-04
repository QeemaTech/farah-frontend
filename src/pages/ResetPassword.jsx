import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (!phone) {
      toast.error('رقم الهاتف مفقود');
      navigate('/forgot-password');
    }
  }, [phone, navigate]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleResetPassword = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      toast.error('يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword(phone, otpCode, newPassword);
      
      // Save token if provided
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      toast.success('تم تغيير كلمة المرور بنجاح');
      navigate('/login');
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorMessage = error.response?.data?.error || 'فشل تغيير كلمة المرور';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
      {/* Header */}
      <div className="absolute content-stretch flex items-center justify-between left-1/2 top-[10px] translate-x-[-50%] w-[350px] z-10">
        <div className="opacity-0 size-[32px]"></div>
        <p className="font-['Cairo:Bold',sans-serif] text-[18px] text-[#121212] text-center">
          إعادة تعيين كلمة المرور
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center size-[32px] bg-white rounded-full shadow-sm"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
            <path d="M15 18L9 12L15 6" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="absolute flex flex-col gap-[24px] items-start left-1/2 top-[90px] translate-x-[-50%] w-[350px] z-10">
        {/* Instructions */}
        <div className="text-center w-full">
          <p className="font-['Cairo:Regular',sans-serif] text-[14px] text-[#666] mb-2">
            أدخل رمز التحقق المرسل إلى {phone}
          </p>
        </div>

        {/* OTP Input */}
        <div className="flex gap-[8px] justify-center w-full" dir="ltr">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-[48px] h-[52px] text-center text-[20px] font-bold border border-[#e6e6e6] rounded-[12px] outline-none focus:border-[#2d2871] transition-colors"
            />
          ))}
        </div>

        {/* New Password */}
        <div className="w-full">
          <label className="font-['Cairo:Medium',sans-serif] text-[14px] text-[#121212] block mb-2 text-right">
            كلمة المرور الجديدة
          </label>
          <div className="bg-white border border-[#e6e6e6] flex h-[52px] items-center px-[16px] rounded-[12px]">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              className="font-['Cairo:Regular',sans-serif] text-[16px] w-full outline-none text-right"
              dir="rtl"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="w-full">
          <label className="font-['Cairo:Medium',sans-serif] text-[14px] text-[#121212] block mb-2 text-right">
            تأكيد كلمة المرور
          </label>
          <div className="bg-white border border-[#e6e6e6] flex h-[52px] items-center px-[16px] rounded-[12px]">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد إدخال كلمة المرور"
              className="font-['Cairo:Regular',sans-serif] text-[16px] w-full outline-none text-right"
              dir="rtl"
            />
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleResetPassword}
          disabled={loading}
          className="bg-[#2d2871] cursor-pointer flex h-[50px] items-center justify-center rounded-[63px] w-full disabled:opacity-50 mt-4"
        >
          <p className="font-['Cairo:Bold',sans-serif] text-[16px] text-white">
            {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </p>
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;
