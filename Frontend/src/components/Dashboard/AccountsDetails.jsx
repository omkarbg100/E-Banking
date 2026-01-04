
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccounts } from "../../context/AccountContext";

export default function AccountDetails() {
  const { accountId } = useParams();
  const { accounts } = useAccounts();
  const navigate = useNavigate();

  const account = accounts.find((acc) => acc._id === accountId);

  if (!account) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-white/60">Account not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-cyan-400 hover:underline"
      >
        ← Back
      </button>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-2">
          {account.accountType} Account
        </h2>
        <p className="text-sm text-white/60 mb-4">
          Account No: {account.accountNumber}
        </p>

        <div className="mb-6">
          <p className="text-sm text-white/60">Available Balance</p>
          <p className="text-3xl font-bold text-cyan-400">
            ₹ {account.balance.toLocaleString()}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionButton title="Transfer Money" />
          <ActionButton title="View Transactions" />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ title }) {
  return (
    <button
      className="py-3 rounded-xl bg-white/10 border border-white/10
      hover:bg-white/20 transition font-semibold"
    >
      {title}
    </button>
  );
}

