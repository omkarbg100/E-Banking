import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccounts } from "../../context/AccountContext";
import { transferMoney } from "../../api/auth.api";

export default function Transaction() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts, fetchAccounts } = useAccounts();

  // If coming from QR scan
  const scannedAccount = location.state?.qrData || "";

  const [form, setForm] = useState({
    fromAccount: "",
    toAccount: scannedAccount,
    amount: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ================= FETCH ACCOUNTS ================= */
  useEffect(() => {
    fetchAccounts();
  }, []);

  /* ================= AUTO SELECT FIRST ACCOUNT ================= */
  useEffect(() => {
    if (accounts.length > 0 && !form.fromAccount) {
      setForm((prev) => ({
        ...prev,
        fromAccount: accounts[0].accountNumber,
      }));
    }
  }, [accounts]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  /* ================= HANDLE SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        fromAccount: form.fromAccount,
        toAccount: form.toAccount,
        amount: Number(form.amount),
      };

      const res = await transferMoney(payload);
      console.log("Transfer Response:", res.data);
      setSuccess(res.data.message || "Transfer successful");

      // Optional: refresh balances
      // fetchAccounts();

      setTimeout(() => {
        navigate("/transactions/success", {
          state: payload,
        });
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-cyan-400 text-lg"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">Send Money</h2>
      </div>

      {/* ================= FORM ================= */}
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5"
      >
        {/* ERROR */}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            {success}
          </div>
        )}

        {/* FROM ACCOUNT */}
        <div>
          <label className="text-sm text-white/70">From Account</label>
          <select
            name="fromAccount"
            value={form.fromAccount}
            onChange={handleChange}
            required
            className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
          >
            {accounts.map((acc) => (
              <option key={acc._id} value={acc.accountNumber}>
                {acc.accountType} • ****{acc.accountNumber.slice(-4)} • ₹
                {acc.balance}
              </option>
            ))}
          </select>
        </div>

        {/* TO ACCOUNT */}
        <div>
          <label className="text-sm text-white/70">To (Account Number)</label>
          <input
            type="text"
            name="toAccount"
            value={form.toAccount}
            onChange={handleChange}
            required
            placeholder="Enter account number"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
          />
        </div>

        {/* AMOUNT */}
        <div>
          <label className="text-sm text-white/70">Amount</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            min="1"
            required
            placeholder="₹ Enter amount"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white"
          />
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full py-3 rounded-xl font-semibold
            bg-linear-to-r from-cyan-400 to-sky-400
            text-slate-900
            hover:scale-[1.02]
            transition
            disabled:opacity-60
          "
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </form>
    </div>
  );
}
