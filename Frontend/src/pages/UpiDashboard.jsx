import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  createUpiId, 
  getPendingUpiRequests, 
  approveCollectRequest, 
  createCollectRequest,
  getMyAccounts 
} from "../api/auth.api";

const UpiDashboard = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    
    const [upiForm, setUpiForm] = useState({ username: "", accountNumber: "" });
    const [collectForm, setCollectForm] = useState({ payerUpiId: "", amount: "", description: "" });
    
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");

    const fetchData = async () => {
        try {
            const accRes = await getMyAccounts();
            setAccounts(accRes.data.accounts || accRes.data);
            
            const reqRes = await getPendingUpiRequests();
            setPendingRequests(reqRes.data.requests);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUpi = async (e) => {
        e.preventDefault();
        try {
            await createUpiId(upiForm);
            setMsg("UPI ID Created successfully!");
            setError("");
        } catch(err) {
            setError(err.response?.data?.message || "Failed to create UPI ID");
            setMsg("");
        }
    };

    const handleCollect = async (e) => {
        e.preventDefault();
        try {
            await createCollectRequest(collectForm);
            setMsg("Collect request sent successfully!");
            setError("");
        } catch(err) {
            setError(err.response?.data?.message || "Failed to request");
            setMsg("");
        }
    };

    const handleApprove = async (requestId) => {
        try {
            // For simple case, pick first account
            let acc = accounts[0]?.accountNumber;
            if(!acc) {
                setError("You don't have an active bank account");
                return;
            }
            await approveCollectRequest({ requestId, fromAccount: acc });
            setMsg("Payment approved successfully!");
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Approval failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
                <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-cyan-400 w-fit">← Back</button>
                <h1 className="text-3xl font-bold text-cyan-400">📱 UPI Dashboard</h1>

                {error && <div className="bg-red-500/10 text-red-400 p-3 rounded">{error}</div>}
                {msg && <div className="bg-green-500/10 text-green-400 p-3 rounded">{msg}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Create UPI ID */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg hover:scale-[1.01] transition">
                        <h2 className="text-xl font-semibold mb-4 text-slate-200">Create UPI ID</h2>
                        <form onSubmit={handleCreateUpi} className="flex flex-col gap-3">
                            <input 
                                type="text" placeholder="username (will add @ebank)" required
                                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                                value={upiForm.username} onChange={e => setUpiForm({...upiForm, username: e.target.value})}
                            />
                            <select 
                                required
                                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-cyan-500"
                                onChange={e => setUpiForm({...upiForm, accountNumber: e.target.value})}
                            >
                                <option value="">Select Connected Account</option>
                                {accounts.map(acc => (
                                    <option key={acc.accountNumber} value={acc.accountNumber}>{acc.accountNumber} - ₹{acc.balance}</option>
                                ))}
                            </select>
                            <button type="submit" className="bg-cyan-500 text-slate-900 font-bold py-2 rounded-lg mt-2 hover:bg-cyan-600 transition">Register UPI ID</button>
                        </form>
                    </div>

                    {/* Collect Request */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg hover:scale-[1.01] transition">
                        <h2 className="text-xl font-semibold mb-4 text-slate-200">Request Money (Collect)</h2>
                        <form onSubmit={handleCollect} className="flex flex-col gap-3">
                            <input 
                                type="text" placeholder="Payer UPI (e.g. friend@ebank)" required
                                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-yellow-500"
                                value={collectForm.payerUpiId} onChange={e => setCollectForm({...collectForm, payerUpiId: e.target.value})}
                            />
                            <input 
                                type="number" placeholder="Amount (₹)" required
                                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-yellow-500"
                                value={collectForm.amount} onChange={e => setCollectForm({...collectForm, amount: e.target.value})}
                            />
                            <input 
                                type="text" placeholder="Note (Optional)"
                                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-yellow-500"
                                value={collectForm.description} onChange={e => setCollectForm({...collectForm, description: e.target.value})}
                            />
                            <button type="submit" className="bg-yellow-500 text-slate-900 font-bold py-2 rounded-lg mt-2 hover:bg-yellow-600 transition">Request Money</button>
                        </form>
                    </div>
                </div>

                {/* Pending Requests */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-slate-200">Pending Incoming Requests</h2>
                    {pendingRequests.length === 0 ? (
                        <p className="text-slate-400 text-sm">You have no pending requests.</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {pendingRequests.map(req => (
                                <div key={req.requestId} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition">
                                    <div className="mb-3 md:mb-0">
                                        <p className="font-semibold text-slate-200">{req.requesterUpiId} <span className="text-slate-400 font-normal">requests</span> <span className="text-cyan-400">₹{req.amount}</span></p>
                                        <p className="text-sm text-slate-400 mt-1">{req.description || "No description provided"}</p>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button onClick={() => handleApprove(req.requestId)} className="flex-1 md:flex-none bg-green-500 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-600 transition">Pay Now</button>
                                        <button className="flex-1 md:flex-none bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-600 transition">Decline</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UpiDashboard;
