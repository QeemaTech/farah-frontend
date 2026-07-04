import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '../components/PaymentForm';
import { paymentAPI } from '../services/api';
import { toast } from 'react-toastify';

// Load Stripe (replace with your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, amount } = location.state || {};

  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!booking || !amount) {
      toast.error('معلومات الدفع مفقودة');
      navigate('/wallet');
      return;
    }

    // Create payment intent
    const createIntent = async () => {
      try {
        const response = await paymentAPI.createPaymentIntent(booking.id, amount);
        setClientSecret(response.data.paymentIntent.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast.error('فشل إنشاء عملية الدفع');
      } finally {
        setLoading(false);
      }
    };

    createIntent();
  }, [booking, amount, navigate]);

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2d2871',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-['Cairo:Medium',sans-serif] text-[16px]">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-y-auto relative rounded-[32px] w-full max-w-[390px] min-h-screen mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="opacity-0 size-[32px]"></div>
        <p className="font-['Cairo:Bold',sans-serif] text-[18px] text-[#121212]">
          الدفع
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

      {/* Booking Summary */}
      <div className="bg-gray-50 p-4 rounded-[12px] mb-6">
        <p className="font-['Cairo:Bold',sans-serif] text-[16px] text-[#121212] mb-2">
          ملخص الحجز
        </p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-['Cairo:Regular',sans-serif] text-[14px] text-[#666]">
              رقم الحجز
            </span>
            <span className="font-['Cairo:Medium',sans-serif] text-[14px]">
              {booking?.bookingNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-['Cairo:Regular',sans-serif] text-[14px] text-[#666]">
              المبلغ الإجمالي
            </span>
            <span className="font-['Cairo:Bold',sans-serif] text-[16px] text-[#2d2871]">
              {amount} ريال
            </span>
          </div>
        </div>
      </div>

      {/* Stripe Payment Form */}
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm 
            clientSecret={clientSecret} 
            bookingId={booking.id}
            amount={amount}
          />
        </Elements>
      )}
    </div>
  );
}

export default Payment;
