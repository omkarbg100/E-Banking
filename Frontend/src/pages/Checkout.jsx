import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGetOrder, apiVerifyPayment } from "../api/auth.api";

const Checkout = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [fromAccount, setFromAccount] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiGetOrder(orderId);
        setOrder(res.data.order);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load order. Invalid or expired orderId.");
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setError("");
    setProcessing(true);
    
    try {
      const res = await apiVerifyPayment({
        orderId,
        method: "ACCOUNT_BALANCE",
        fromAccount
      });
      
      setSuccess(true);
      
      // Handle redirect
      if (order.redirectUrl) {
        setTimeout(() => {
          const url = new URL(order.redirectUrl);
          url.searchParams.append("payment_id", res.data.payment.paymentId);
          url.searchParams.append("order_id", orderId);
          window.location.href = url.toString();
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Payment verification failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Securely loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="bg-slate-900 border border-red-500/50 p-8 rounded-2xl max-w-md w-full text-center">
           <h2 className="text-2xl text-red-400 font-bold mb-2">Checkout Error</h2>
           <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Header Decor */}
        <div className="h-2 w-full bg-linear-to-r from-cyan-500 to-blue-500"></div>

        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              E-Banking <span className="text-cyan-400">Pay</span>
            </h1>
            <p className="text-slate-400 text-sm">Secure Payment Gateway</p>
          </div>

          {!success ? (
            <>
              <div className="bg-slate-800/50 rounded-2xl p-5 mb-8 border border-slate-700/50 text-center">
                <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Paying To</p>
                <h2 className="text-xl font-bold text-white mb-4">{order.merchantName}</h2>
                <div className="text-4xl font-black text-cyan-400 flex items-center justify-center gap-1">
                  <span className="text-2xl">{order.currency === 'INR' ? '₹' : order.currency}</span>
                  {order.amount.toLocaleString()}
                </div>
              </div>

              {order.status === "PAID" ? (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center font-medium">
                  This order has already been paid.
                </div>
              ) : (
                <form onSubmit={handlePayment} className="flex flex-col gap-4">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Your Account Number</label>
                    <input
                      type="text"
                      required
                      value={fromAccount}
                      onChange={(e) => setFromAccount(e.target.value)}
                      placeholder="e.g. 1234567890"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 transition outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full mt-4 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-cyan-500/20 disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      `Pay ₹${order.amount}`
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-500">
               <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-full text-white flex items-center justify-center text-2xl">
                     ✓
                  </div>
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
               <p className="text-slate-400 mb-6">Your payment of ₹{order.amount} to {order.merchantName} was secure and successful.</p>
               
               {order.redirectUrl ? (
                 <p className="text-cyan-400 text-sm animate-pulse">Redirecting you back to merchant...</p>
               ) : (
                 <button onClick={() => window.close()} className="text-slate-400 hover:text-white underline text-sm">Close Window</button>
               )}
            </div>
          )}

          <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <span>🔒 Secured by E-Banking API</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
