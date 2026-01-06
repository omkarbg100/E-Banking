import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccounts } from "../context/AccountContext";
import QRCode from "react-qr-code";

export default function QrPage() {
  const navigate = useNavigate();
  const { accounts } = useAccounts();

  const [selectedAccount, setSelectedAccount] = useState(
    accounts?.[0] || null
  );
  const [showAccounts, setShowAccounts] = useState(false);

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-white/60">No account available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-cyan-400 hover:underline"
        >
          ← Back
        </button>
        <h2 className="text-lg font-semibold">My QR Code</h2>
      </div>

      {/* QR Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-lg">
          <QRCode
            value={selectedAccount.accountNumber}
            size={220}
          />
        </div>

        <p className="mt-4 text-sm text-white/70 text-center">
          Scan to receive money
        </p>
      </div>

      {/* Selected Account */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 mb-4">
        <p className="text-sm text-white/60 mb-1">Receiving Account</p>
        <p className="font-semibold">
          {selectedAccount.accountType} Account
        </p>
        <p className="text-sm text-white/60">
          A/C ****{selectedAccount.accountNumber.slice(-4)}
        </p>

        <button
          onClick={() => setShowAccounts(!showAccounts)}
          className="mt-4 text-sm text-cyan-400 hover:underline"
        >
          Change account
        </button>
      </div>

      {/* Account Switcher */}
      {showAccounts && (
        <div className="rounded-2xl bg-slate-900 border border-white/10 p-4 space-y-3">
          {accounts.map((acc) => (
            <button
              key={acc._id}
              onClick={() => {
                setSelectedAccount(acc);
                setShowAccounts(false);
              }}
              className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
            >
              <p className="font-medium">
                {acc.accountType} Account
              </p>
              <p className="text-sm text-white/60">
                ****{acc.accountNumber.slice(-4)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
