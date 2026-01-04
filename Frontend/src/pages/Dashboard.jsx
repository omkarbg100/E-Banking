import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  // TEMP data – replace with backend API later
  const accounts = [
    {
      id: 1,
      type: "Savings Account",
      accountNo: "XXXX-1234",
      balance: 45230.75,
    },
    {
      id: 2,
      type: "Current Account",
      accountNo: "XXXX-9876",
      balance: 120000.0,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">
            Welcome, <span className="text-cyan-400">{user?.name}</span>
          </h2>
          <p className="text-white/60 text-sm">Manage your accounts securely</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
        >
          Logout
        </button>
      </div>

      {/* Accounts */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Your Accounts</h3>
          <button
            className="px-4 py-2 rounded-lg bg-linear-to-r from-cyan-400 to-sky-400
            text-slate-900 font-semibold shadow-lg hover:scale-[1.02]"
          >
            + Create Account
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-xl"
            >
              <h4 className="text-lg font-semibold">{acc.type}</h4>
              <p className="text-sm text-white/60 mt-1">
                Account No: {acc.accountNo}
              </p>

              <div className="mt-4">
                <p className="text-sm text-white/60">Available Balance</p>
                <p className="text-2xl font-bold text-cyan-400">
                  ₹ {acc.balance.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <ActionCard title="Transfer Money" desc="Send money to any account" />
          <ActionCard title="Scan QR" desc="Pay instantly using QR code" />
          <ActionCard title="Transaction History" desc="View all transactions" />
        </div>
      </section>
    </div>
  );
}

function ActionCard({ title, desc }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-lg
    hover:bg-white/10 transition cursor-pointer">
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="text-sm text-white/60 mt-2">{desc}</p>
    </div>
  );
}

