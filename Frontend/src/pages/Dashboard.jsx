import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAccounts } from "../context/AccountContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { accounts, fetchAccounts, loadingAccounts, error } = useAccounts();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-8">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-10">
        {/* LEFT: Profile */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold text-lg">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          {/* User Info */}
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              Hi, <span className="text-cyan-400">{user?.name}</span>
            </h2>
            <p className="text-white/60 text-sm">Your banking dashboard</p>
          </div>
        </div>

        {/* RIGHT: Scan QR */}
        <button
          onClick={() => navigate("/scan-qr")}
          className="
      flex items-center gap-2
      px-4 py-2
      rounded-xl
      bg-linear-to-r from-cyan-400 to-sky-400
      text-slate-900
      font-semibold
      shadow-lg
      hover:scale-[1.03]
      transition
    "
        >
          {/* QR Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h5v5H3V3zM16 3h5v5h-5V3zM3 16h5v5H3v-5zM16 16h2v2h-2v-2zM20 16h1v1h-1v-1zM16 20h5v1h-5v-1zM20 20h1v1h-1v-1zM9 3h1v5H9V3zM3 9h5v1H3V9zM9 9h1v1H9V9zM9 11h5v1H9v-1zM9 13h1v1H9v-1zM11 9h1v5h-1V9zM13 9h1v1h-1V9zM13 11h5v1h-5v-1zM13 13h1v1h-1v-1zM9 16h1v5H9v-5z"
            />
          </svg>
          Scan QR
        </button>
      </div>

      {/* ================= ACCOUNTS ================= */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Accounts</h3>
          <button
            onClick={() => navigate("/dashboard/accounts/create")}
            className="px-4 py-2 rounded-lg bg-linear-to-r from-cyan-400 to-sky-400
            text-slate-900 font-semibold"
          >
            + Create
          </button>
        </div>

        {loadingAccounts && (
          <p className="text-white/60">Loading accounts...</p>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* NORMAL GRID – NO CENTERING */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div
              key={acc._id}
              onClick={() => navigate(`/accounts/${acc._id}`)}
              className="
                cursor-pointer
                rounded-2xl
                bg-white/5
                border border-white/10
                p-6
                hover:bg-white/10
                transition
              "
            >
              <h4 className="text-lg font-semibold">
                {acc.accountType} Account
              </h4>
              <p className="text-sm text-white/60 mt-1">
                A/C No: ****{acc.accountNumber.slice(-4)}
              </p>

              <div className="mt-4">
                <p className="text-sm text-white/60">Balance</p>
                <p className="text-2xl font-bold text-cyan-400">
                  ₹ {acc.balance.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= QUICK ACTIONS ================= */}
      <section className="mb-12">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

        {/* FLEX + WRAP (LIKE GPay) */}
        <div className="flex flex-wrap gap-4">
          <div
            onClick={() => navigate("/transactions")}
            className="
    min-w-37.5
    rounded-xl
    bg-white/5
    border border-white/10
    p-4
    text-center
    hover:bg-white/10
    transition
    cursor-pointer
  "
          >
            <p className="text-sm font-medium">Transfer Money</p>
          </div>

          {[
            "Mobile Recharge",
            "DTH Recharge",
            "FASTag Recharge",
            "Electricity Bill",
          ].map((item) => (
            <div
              key={item}
              className="
                min-w-37.5
                rounded-xl
                bg-white/5
                border border-white/10
                p-4
                text-center
                hover:bg-white/10
                transition
                cursor-pointer
              "
            >
              <p className="text-sm font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= REWARDS & OFFERS ================= */}
      <section className="mb-12">
        <h3 className="text-lg font-semibold mb-4">Rewards & Offers</h3>

        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-70 rounded-2xl bg-white/5 border border-white/10 p-6">
            <h4 className="text-lg font-semibold text-cyan-400">
              🎁 Cashback Rewards
            </h4>
            <p className="text-sm text-white/70 mt-2">
              Earn cashback on bill payments and recharges.
            </p>
          </div>

          <div className="flex-1 min-w-70 rounded-2xl bg-white/5 border border-white/10 p-6">
            <h4 className="text-lg font-semibold text-cyan-400">
              🔥 Exclusive Offers
            </h4>
            <p className="text-sm text-white/70 mt-2">
              Special discounts for premium users.
            </p>
          </div>
        </div>
      </section>

      {/* ================= REFER A FRIEND (NOT CARDY) ================= */}
      <section className="mb-12">
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/5 p-6">
          <h3 className="text-xl font-bold text-cyan-400">
            Refer a Friend & Earn ₹200 Cashback
          </h3>
          <p className="text-white/70 mt-2 max-w-2xl">
            Invite your friends to E-Banking. When they create an account and
            complete their first transaction, you get ₹200 cashback directly
            into your account.
          </p>

          <button
            className="mt-4 px-6 py-2 rounded-lg font-semibold
            bg-linear-to-r from-cyan-400 to-sky-400
            text-slate-900"
          >
            Refer Now
          </button>
        </div>
      </section>

      {/* ================= TRANSACTIONS ================= */}
      <div>
        <button
          onClick={() => navigate("/transactions")}
          className="px-6 py-3 rounded-lg bg-white/5 border border-white/10
          hover:bg-white/10 transition"
        >
          View Recent Transactions →
        </button>
      </div>
    </div>
  );
}
