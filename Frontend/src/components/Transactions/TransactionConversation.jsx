import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getTransactionsBetweenAccounts } from "../../api/auth.api";

const TransactionConversation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const toAccount = searchParams.get("to");

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!toAccount) return;

    try {
      setLoading(true);
      const res = await getTransactionsBetweenAccounts(toAccount);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error("Fetch transactions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [toAccount]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex justify-center px-4 py-8">
      <div className="w-full max-w-xl border border-slate-800 rounded-2xl p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-cyan-400"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold">
            Transactions with {toAccount}
          </h2>
        </div>

        {loading ? (
          <p className="text-slate-400 text-center">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-slate-400 text-center">No transactions found</p>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.map((txn) => {
              const isSent = txn.direction === "SENT";

              return (
                <div
                  key={txn._id}
                  className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-xl p-3 text-sm border ${
                      isSent
                        ? "bg-red-500/20 border-red-500/30"
                        : "bg-green-500/20 border-green-500/30"
                    }`}
                  >
                    {/* Amount */}
                    <p className="font-semibold">
                      {isSent ? "Sent" : "Received"} ₹{txn.amount}
                    </p>

                    {/* Account flow */}
                    <p className="text-xs text-slate-300 mt-1">
                      {isSent ? (
                        <>
                          <span className="text-slate-400">From:</span> Your
                          account
                          <br />
                          <span className="text-slate-400">To:</span>{" "}
                          <span className="font-mono">{txn.sentTo}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400">From:</span>{" "}
                          <span className="font-mono">{txn.receivedFrom}</span>
                          <br />
                          <span className="text-slate-400">To:</span> Your
                          account
                        </>
                      )}
                    </p>

                    {/* Description */}
                    {txn.description && (
                      <p className="text-xs italic text-slate-300 mt-1">
                        {txn.description}
                      </p>
                    )}

                    {/* Timestamp */}
                    <p className="text-[10px] text-slate-400 mt-1 text-right">
                      {new Date(txn.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionConversation;
