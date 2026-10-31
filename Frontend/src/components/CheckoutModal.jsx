import React, { useState } from 'react';
import axios from 'axios';

const CheckoutModal = ({ isOpen, onClose, orderId, amount, onSuccess }) => {
    const [method, setMethod] = useState('ACCOUNT_BALANCE');
    const [fromAccount, setFromAccount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handlePay = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL || "/api"}/pg/verify`,
                { orderId, method, fromAccount },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-100 transition-transform">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-cyan-500 flex items-center justify-center text-slate-900 font-bold">E</div>
                        <h2 className="font-bold text-gray-200">E-Banking Pay SDK</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
                </div>
                
                <div className="p-6">
                    <div className="text-center mb-6">
                        <p className="text-slate-400 text-sm">Amount to pay</p>
                        <p className="text-4xl font-black text-cyan-400 mt-1">₹{amount}</p>
                    </div>

                    {error && <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 tracking-wider uppercase font-semibold">Payment Method</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition"
                                value={method} onChange={(e) => setMethod(e.target.value)}
                            >
                                <option value="ACCOUNT_BALANCE">Linked Bank Account</option>
                                <option value="UPI">UPI Payment</option>
                            </select>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 tracking-wider uppercase font-semibold">Your Account Information</label>
                            <input 
                                type="text"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500 placeholder-slate-500 transition"
                                placeholder={method === 'UPI' ? "Enter your UPI ID" : "Enter Account Number"}
                                value={fromAccount}
                                onChange={(e) => setFromAccount(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-slate-800/80 border-t border-slate-700">
                    <button 
                        onClick={handlePay}
                        disabled={loading || !fromAccount}
                        className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl transition disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {loading ? 'Processing Secure Payment...' : `💳 Pay ₹${amount} Securely`}
                    </button>
                    <p className="text-center text-[10px] text-slate-500 mt-3 font-semibold uppercase tracking-wider">Secured by E-Banking API</p>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
