import { useState } from 'react';
import {useNavigate } from 'react-router-dom';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentAPI } from '../services/api';
import { toast } from 'react-toastify';

function PaymentForm({ clientSecret, bookingId, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'فشلت عملية الدفع');
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await paymentAPI.confirmPayment(paymentIntent.id, bookingId);
        
        toast.success('تمت عملية الدفع بنجاح');
        navigate('/wallet', { 
          state: { paymentSuccess: true, bookingId } 
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('حدث خطأ أثناء الدفع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-[#2d2871] w-full h-[50px] rounded-[63px] text-white font-['Cairo:Bold',sans-serif] text-[16px] disabled:opacity-50"
      >
        {loading ? 'جاري المعالجة...' : `دفع ${amount} ريال`}
      </button>

      <p className="font-['Cairo:Regular',sans-serif] text-[12px] text-[#666] text-center">
        سيتم تحصيل المبلغ من بطاقتك بشكل آمن
      </p>
    </form>
  );
}

export default PaymentForm;
