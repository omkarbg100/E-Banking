import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAccount } from "../../api/auth.api";
import { useAccounts } from "../../context/AccountContext";

export default function CreateAccount() {
  const [accountType, setAccountType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { fetchAccounts } = useAccounts();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountType) {
      setError("Please select an account type");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createAccount({ accountType });
      await fetchAccounts(); // 🔥 refresh account list
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 text-center">
          Create New <span className="text-cyan-400">Account</span>
        </h2>
        <p className="text-center text-white/60 mb-6">
          Choose the type of account you want to open
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type */}
          <div>
            <label className="text-sm text-white/70 block mb-2">
              Account Type
            </label>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAccountType("SAVINGS")}
                className={`p-4 rounded-xl border transition ${
                  accountType === "SAVINGS"
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-white/10 hover:bg-white/10"
                }`}
              >
                <p className="font-semibold">Savings</p>
                <p className="text-xs text-white/60">
                  Daily usage & personal savings
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAccountType("CURRENT")}
                className={`p-4 rounded-xl border transition ${
                  accountType === "CURRENT"
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-white/10 hover:bg-white/10"
                }`}
              >
                <p className="font-semibold">Current</p>
                <p className="text-xs text-white/60">
                  Business & high transactions
                </p>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold
              bg-linear-to-r from-cyan-400 to-sky-400
              text-slate-900 hover:scale-[1.02] transition
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
