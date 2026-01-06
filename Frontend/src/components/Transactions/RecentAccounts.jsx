import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentTransactionAccounts } from "../../api/auth.api";

const RecentAccounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentAccounts = async () => {
      try {
        const res = await getRecentTransactionAccounts();
        console.log("API response:", res.data);
        setAccounts(res.data.accounts || []);
      } catch (err) {
        console.error("RecentAccounts error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAccounts();
  }, []);

  return (
    <div className="bg-slate-950 text-white">
      <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : accounts.length === 0 ? (
        <p className="text-slate-400">No recent transactions</p>
      ) : (
        <div className="flex flex-row flex-wrap gap-3 max-w-xl">
          {accounts.map((acc) => (
            <button
              key={acc.accountNumber}
              onClick={() =>
                navigate(
                  `/transactions/between?from=${acc.myAccount}&to=${acc.accountNumber}`
                )
              }
              className="flex justify-between flex-wrap items-center bg-slate-900 border border-slate-800 rounded-xl p-4 hover:bg-slate-800 transition"
            >
              <div className="text-left">
                <p className="font-semibold">
                  {acc.accountHolderName}
                </p>
                <p className="font-semibold">
                  Account {acc.accountNumber}
                </p>
                <p className="text-xs text-slate-400">
                  Last txn:{" "}
                  {new Date(acc.lastTransaction).toLocaleString()}
                </p>
              </div>

              <span className="text-cyan-400 text-sm m-4">View →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentAccounts;
