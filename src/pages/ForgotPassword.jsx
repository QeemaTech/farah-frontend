import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import { countryCodes, getDefaultCountry } from '../utils/countryCodes';

function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(getDefaultCountry());
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phone || phone.trim() === '') {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }

    const fullPhone = `${selectedCountry.code}${phone.replace(/\s/g, '')}`;
    setLoading(true);

    try {
      await authAPI.forgotPassword(fullPhone);
      toast.success('تم  إرسال رمز التحقق بنجاح');
      navigate('/reset-password', { state: { phone: fullPhone } });
    } catch (error) {
      console.error('Error sending reset OTP:', error);
      const errorMessage = error.response?.data?.error || 'فشل إرسال رمز التحقق';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
      {/* Header */}
      <div className="absolute content-stretch flex items-center justify-between left-1/2 top-[10px] translate-x-[-50%] w-[350px] z-10">
        <div className="content-stretch flex items-center justify-center opacity-0 relative shrink-0 size-[32px]"></div>
        <p className="font-['Cairo:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px] text-center">
          نسيت كلمة المرور
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center relative shrink-0 size-[32px] bg-white rounded-full shadow-sm"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
            <path d="M15 18L9 12L15 6" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[24px] items-start left-1/2 top-[90px] translate-x-[-50%] w-[350px] z-10">
        {/* Instructions */}
        <div className="text-center w-full">
          <p className="font-['Cairo:Regular',sans-serif] text-[14px] text-[#666]">
            أدخل رقم هاتفك وسنرسل لك رمز التحقق لإعادة تعيين كلمة المرور
          </p>
        </div>

        {/* Phone Input */}
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full">
          {/* Country Code (simplified) */}
          <div className="bg-white border border-[#e6e6e6] content-stretch flex h-[52px] items-center justify-center p-[12px] relative rounded-[12px] shrink-0 w-[80px]">
            <span className="text-2xl">{selectedCountry.flag}</span>
          </div>

          {/* Phone Number Input */}
          <div className="bg-white border border-[#e6e6e6] content-stretch flex flex-[1_0_0] h-[52px] items-center px-[16px] py-[12px] relative rounded-[12px]">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0000000000"
              className="font-['Cairo:Regular',sans-serif] text-[16px] w-full outline-none text-right"
              dir="rtl"
            />
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendOTP}
          disabled={loading}
          className="bg-[#2d2871] content-stretch cursor-pointer flex h-[50px] items-center justify-center p-[10px] relative rounded-[63px] w-full disabled:opacity-50"
        >
          <p className="font-['Cairo:Bold',sans-serif] text-[16px] text-white">
            {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
          </p>
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
