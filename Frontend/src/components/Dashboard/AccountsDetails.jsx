import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyTransactions } from "../../api/auth.api";
import { useAccounts } from "../../context/AccountContext";

export default function AccountDetails() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { accounts } = useAccounts();

  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [errorTx, setErrorTx] = useState("");

  const account = accounts.find((a) => a._id === accountId);

  // Fetch Transactions
  const fetchTransactions = async () => {
    setLoadingTx(true);
    setErrorTx("");
    try {
      const res = await getMyTransactions();
      setTransactions(res.data || []);
    } catch (err) {
      setErrorTx(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (!account)
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Account not found</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 md:px-8 py-6 flex flex-col gap-6">

      {/* 🔙 Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-cyan-400 text-sm hover:underline w-fit"
      >
        ← Back to Dashboard
      </button>

      {/* 🏦 Account Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md max-w-4xl">
        <h2 className="text-2xl font-bold mb-1">{account.accountType} Account</h2>
        <p className="text-slate-400 text-sm mb-4">Account No: {account.accountNumber}</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Available Balance</p>
            <p className="text-3xl font-bold text-cyan-400">₹ {account.balance.toLocaleString()}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(account.accountNumber)}
            className="px-3 py-1 text-sm rounded-lg border border-slate-700 hover:bg-slate-800 transition"
          >
            Copy Account Number
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <ActionBtn label="Transfer Money" onClick={() => navigate("/transactions")} />
          <ActionBtn label="Scan QR" onClick={() => navigate("/scan-qr")} />
          <ActionBtn
            label="Developer Dashboard"
            onClick={() => navigate(`/developer?accountNumber=${account.accountNumber}`)}
          />
          <ActionBtn label="Refresh Transactions" onClick={fetchTransactions} />
        </div>
      </div>

      {/* Transactions */}
      <div className="max-w-4xl flex flex-col gap-3">
        <h3 className="text-xl font-semibold mb-3">Recent Transactions</h3>
        {loadingTx && <p className="text-slate-400 text-sm">Loading transactions...</p>}
        {errorTx && <p className="text-red-400 text-sm">{errorTx}</p>}
        {!loadingTx && transactions.length === 0 && (
          <p className="text-slate-400 text-sm">No transactions found</p>
        )}

        {transactions.map((txn) => {
          const isDebit = txn.fromAccount === account.accountNumber;
          return (
            <div
              key={txn._id}
              className={`flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 hover:bg-slate-800 transition`}
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium">{isDebit ? "Money Sent" : "Money Received"}</p>
                <p className="text-xs text-slate-400">{isDebit ? `To: ${txn.toAccount}` : `From: ${txn.fromAccount}`}</p>
                <p className="text-xs text-slate-400">
                  Type: {txn.type} | Initiated By: {txn.initiatedBy} | Status: {txn.status}
                </p>
                {txn.description && <p className="text-xs text-slate-400 italic">{txn.description}</p>}
              </div>
              <div className="text-right mt-2 md:mt-0">
                <p className={`font-semibold ${isDebit ? "text-red-400" : "text-green-400"}`}>
                  {isDebit ? "-" : "+"}₹{txn.amount}
                </p>
                <p className="text-xs text-slate-400">{new Date(txn.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Action Button */
function ActionBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition text-sm font-semibold"
    >
      {label}
    </button>
  );
}
