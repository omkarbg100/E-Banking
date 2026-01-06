import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getTransactionsBetweenAccounts } from "../../api/auth.api";

const TransactionConversation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fromAccount = searchParams.get("from");
  const toAccount = searchParams.get("to");

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const res = await getTransactionsBetweenAccounts(
        fromAccount,
        toAccount
      );
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fromAccount, toAccount]);

  return (
    <>

      <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-cyan-400"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold">
            Account {toAccount}
          </h2>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-slate-400">No transactions found</p>
        ) : (
          <div className="flex flex-col gap-3 max-w-xl">
            {transactions.map((txn) => {
              const isDebit = txn.fromAccount === fromAccount;

              return (
                <div
                  key={txn._id}
                  className={`flex ${
                    isDebit ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs rounded-xl p-3 text-sm ${
                      isDebit
                        ? "bg-red-500/20 border border-red-500/30"
                        : "bg-green-500/20 border border-green-500/30"
                    }`}
                  >
                    <p className="font-semibold">
                      {isDebit ? "Sent" : "Received"} ₹{txn.amount}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(txn.createdAt).toLocaleString()}
                    </p>
                    {txn.description && (
                      <p className="text-xs mt-1 italic">
                        {txn.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default TransactionConversation;
