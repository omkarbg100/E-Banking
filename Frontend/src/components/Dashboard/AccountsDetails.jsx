import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyTransactions } from "../../api/auth.api";
import { useAccounts } from "../../context/AccountContext";

export default function AccountDetails() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { accounts } = useAccounts();

  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [error, setError] = useState("");

  const account = accounts.find((a) => a._id === accountId);

  // 🔹 Fetch transactions
  useEffect(() => {
    let isMounted = true; // prevent state update after unmount

    const fetchTransactions = async () => {
      setLoadingTx(true);
      setError("");

      try {
        const res = await getMyTransactions();

        if (isMounted) {
          setTransactions(res.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Failed to load transactions"
          );
        }
      } finally {
        if (isMounted) {
          setLoadingTx(false);
        }
      }
    };

    fetchTransactions();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!account) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Account not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 md:px-8 py-6">
      {/* 🔙 Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-cyan-400 text-sm hover:underline"
      >
        ← Back to Dashboard
      </button>

      {/* 🏦 Account Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md mb-8 max-w-3xl">
        <h2 className="text-2xl font-bold mb-1">
          {account.accountType} Account
        </h2>

        <p className="text-slate-400 text-sm mb-4">
          Account No: ****{account.accountNumber.slice(-4)}
        </p>

        <div>
          <p className="text-sm text-slate-400">Available Balance</p>
          <p className="text-3xl font-bold text-cyan-400">
            ₹ {account.balance.toLocaleString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          <ActionBtn
            label="Transfer Money"
            onClick={() => navigate("/transactions")}
          />
          <ActionBtn label="Scan QR" onClick={() => navigate("/scan-qr")} />
        </div>
      </div>

      {/* 📜 Transactions */}
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>

        {loadingTx && (
          <p className="text-slate-400 text-sm">Loading transactions...</p>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!loadingTx && transactions.length === 0 && (
          <p className="text-slate-400 text-sm">No transactions found</p>
        )}

        <div className="flex flex-col gap-3">
          {transactions.map((txn) => {
            const isDebit = txn.fromAccount === account.accountNumber;

            return (
              <div
                key={txn._id}
                className="
                  flex items-center justify-between
                  bg-slate-900
                  border border-slate-800
                  rounded-xl
                  p-4
                  hover:bg-slate-800
                  transition
                "
              >
                <div>
                  <p className="font-medium">
                    {isDebit ? "Money Sent" : "Money Received"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isDebit
                      ? `To ${txn.toAccount}`
                      : `From ${txn.fromAccount}`}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      isDebit ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {isDebit ? "-" : "+"}₹{txn.amount}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(txn.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* 🔘 Small Action Button */
function ActionBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        px-5 py-2
        rounded-xl
        bg-slate-800
        border border-slate-700
        hover:bg-slate-700
        transition
        text-sm font-semibold
      "
    >
      {label}
    </button>
  );
}
