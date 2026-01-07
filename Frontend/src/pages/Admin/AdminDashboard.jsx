import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export default function AdminDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllAccounts();
  }, []);

  const fetchAllAccounts = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${BASE_URL}/admin/accounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAccounts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-cyan-400">
          Admin Dashboard
        </h2>

        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-cyan-400 hover:underline"
        >
          Back to User Dashboard
        </button>
      </div>

      {/* States */}
      {loading && <p className="text-white/60">Loading accounts...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Accounts Table */}
      {!loading && accounts.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Account No</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Balance</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {accounts.map((acc) => (
                <tr
                  key={acc._id}
                  className="border-t border-white/10 hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {acc.user?.name || "N/A"}
                    </p>
                    <p className="text-xs text-white/60">
                      {acc.user?.email}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    ****{acc.accountNumber.slice(-4)}
                  </td>

                  <td className="px-4 py-3">
                    {acc.accountType}
                  </td>

                  <td className="px-4 py-3 font-semibold text-cyan-400">
                    ₹ {acc.balance.toLocaleString()}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium
                        ${
                          acc.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                    >
                      {acc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && accounts.length === 0 && (
        <p className="text-white/60">No accounts found</p>
      )}
    </div>
  );
}
