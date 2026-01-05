import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function TransactionSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const data = location.state || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* ===== Header ===== */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-cyan-400 text-lg"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">Payment Successful</h2>
        </div>

        {/* ===== Success Card ===== */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          {/* Check Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Amount */}
          <h3 className="text-2xl font-bold text-green-400 mb-1">
            ₹ {data.amount}
          </h3>
          <p className="text-white/60 text-sm mb-4">
            Transaction Completed Successfully
          </p>

          {/* Details */}
          <div className="text-left text-sm space-y-2 mt-4">
            <div className="flex justify-between">
              <span className="text-white/60">From</span>
              <span>****{data.fromAccount?.slice(-4)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/60">To</span>
              <span>****{data.toAccount?.slice(-4)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/60">Status</span>
              <span className="text-green-400">SUCCESS</span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/60">Reference ID</span>
              <span className="text-xs">
                TXN{Date.now().toString().slice(-8)}
              </span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => navigate("/dashboard")}
            className="
              mt-6 w-full py-3 rounded-xl font-semibold
              bg-linear-to-r from-cyan-400 to-sky-400
              text-slate-900
              hover:scale-[1.02]
              transition
            "
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
