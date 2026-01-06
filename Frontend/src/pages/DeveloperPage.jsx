import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getMyDeveloperAccount,
  createDeveloperAccount,
} from "../api/auth.api";
import HomeNav from "../components/home/HomeNav";

const DeveloperPage = () => {
  const navigate = useNavigate();

  const [developer, setDeveloper] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    developerName: "",
    accountNumber: "",
  });

  const [error, setError] = useState("");
  const [linkedAccount, setLinkedAccount] = useState(null);

  const [searchParams] = useSearchParams();
  const accountNumber = searchParams.get("accountNumber");

  // Fetch developer account
  const fetchDeveloper = async () => {
    try {
      const res = await getMyDeveloperAccount();
      setDeveloper(res.data.developer);
      setQrCode(res.data.qrCode);

      if (!res.data.developer && accountNumber) {
        setForm((prev) => ({ ...prev, accountNumber }));
      }

      setLinkedAccount({ accountNumber });
    } catch {
      setDeveloper(null);
      if (accountNumber) {
        setForm((prev) => ({ ...prev, accountNumber }));
        setLinkedAccount({ accountNumber });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeveloper();
  }, []);

  // Create developer account
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await createDeveloperAccount(form);
      setDeveloper(res.data.developer);
      setQrCode(res.data.qrCode);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-lg">
        Loading Developer Dashboard...
      </div>
    );
  }

  return (
    /* Full-page dark wrapper */
    <div>
    <div className="min-h-screen w-full bg-linear-to-b from-slate-900 via-slate-950 to-slate-900 text-white flex justify-center py-10 px-4">
      {/* Content container */}
      <div className="w-full max-w-3xl flex flex-col gap-6">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition w-fit"
        >
          <span className="text-lg">←</span>
          <span className="text-sm">Back</span>
        </button>

        {/* Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg text-center">
          <h1 className="text-3xl font-bold text-cyan-400 mb-1">
            🚀 Developer Dashboard
          </h1>
          <p className="text-slate-400">
            Create and manage your developer payment account
          </p>
        </div>

        {/* Developer exists */}
        {developer ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col gap-4 hover:scale-[1.01] transition">
            <p>
              <strong>Developer Name:</strong>{" "}
              <span className="text-slate-300">{developer.developerName}</span>
            </p>
            <p>
              <strong>Merchant ID:</strong>{" "}
              <span className="text-slate-300">{developer.merchantId}</span>
            </p>
            <p>
              <strong>Public Key:</strong>{" "}
              <span className="text-slate-300 break-all">
                {developer.publicKey}
              </span>
            </p>
            <p>
              <strong>Linked Bank Account:</strong>{" "}
              <span className="text-slate-300">{developer.accountNumber}</span>
            </p>

            {qrCode && (
              <div className="mt-3">
                <h4 className="font-semibold mb-2">Payment QR</h4>
                <img
                  src={qrCode}
                  alt="Payment QR"
                  className="rounded-lg border border-slate-700 w-48"
                />
              </div>
            )}

            <a
              href="/developer-docs"
              target="_blank"
              rel="noreferrer"
              className="mt-3 text-cyan-400 underline text-sm hover:text-cyan-300"
            >
              View Developer Docs →
            </a>
          </div>
        ) : (
          /* Create developer */
          <form
            onSubmit={handleCreate}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col gap-4 hover:scale-[1.01] transition"
          >
            <h3 className="text-xl font-semibold text-cyan-400">
              Create Developer Account
            </h3>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-md">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Developer Name</label>
              <input
                type="text"
                required
                value={form.developerName}
                placeholder="e.g. Omkar Payments"
                className="p-2 rounded-md bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                onChange={(e) =>
                  setForm({ ...form, developerName: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">
                Bank Account Number
              </label>
              <input
                type="text"
                required
                value={form.accountNumber}
                placeholder="Linked bank account number"
                className="p-2 rounded-md bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                onChange={(e) =>
                  setForm({ ...form, accountNumber: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-cyan-500 text-slate-900 font-semibold rounded-xl hover:bg-cyan-600 transition"
            >
              Create Developer Account
            </button>

            {linkedAccount && (
              <p className="text-slate-400 text-sm mt-2">
                This developer account will be linked to:
                <br />
                <strong className="text-slate-300">
                  {linkedAccount.accountNumber}
                </strong>
              </p>
            )}

            <a
              href="/developer-docs"
              target="_blank"
              rel="noreferrer"
              className="mt-2 text-cyan-400 underline text-sm hover:text-cyan-300"
            >
              View Developer Docs →
            </a>
          </form>
        )}
      </div>
    </div>
    </div>
  );
};

export default DeveloperPage;
