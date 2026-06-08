import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getMyDeveloperAccount,
  createDeveloperAccount,
  getWebhook,
  registerWebhook
} from "../api/auth.api";

// Reusable Copy To Clipboard Component
const SecretBox = ({ label, value, isSecret }) => {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(!isSecret);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 relative group hover:border-cyan-500/30 transition-all duration-300 shadow-inner">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-bold tracking-wider uppercase text-slate-400 group-hover:text-cyan-400 transition-colors">{label}</p>
        <div className="flex gap-2">
          {isSecret && (
            <button onClick={() => setVisible(!visible)} className="text-xs text-slate-500 hover:text-white transition font-medium bg-slate-800/80 px-2 py-1 rounded">
              {visible ? "Hide" : "Reveal"}
            </button>
          )}
          <button 
            onClick={copy} 
            className="text-xs bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-1 rounded transition font-medium"
          >
            {copied ? "Copied ✓" : "Copy Key"}
          </button>
        </div>
      </div>
      <code className={`block break-all font-mono text-sm mt-1 mb-1 ${visible ? (isSecret ? "text-pink-400" : "text-cyan-300") : "text-slate-600 blur-sm select-none transition-all duration-300"}`}>
        {visible ? value || "Not available" : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
      </code>
    </div>
  );
};

const DeveloperPage = () => {
  const navigate = useNavigate();

  const [developer, setDeveloper] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("keys"); // "keys", "webhook"

  // Forms
  const [form, setForm] = useState({
    developerName: "",
    accountNumber: "",
  });
  
  const [webhookForm, setWebhookForm] = useState({ url: "", secret: "" });
  const [webhookData, setWebhookData] = useState(null);

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [linkedAccount, setLinkedAccount] = useState(null);

  const [searchParams] = useSearchParams();
  const accountNumber = searchParams.get("accountNumber");

  const fetchDeveloper = async () => {
    try {
      const res = await getMyDeveloperAccount();
      setDeveloper(res.data.developer);
      setQrCode(res.data.qrCode);

      if (res.data.developer) {
         try {
           const hooks = await getWebhook();
           if(hooks.data.webhook) {
             setWebhookData(hooks.data.webhook);
             setWebhookForm({ url: hooks.data.webhook.url, secret: hooks.data.webhook.secret });
           }
         } catch(e) { } // ignore
      }

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

  const handleWebhookSave = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    try {
      const res = await registerWebhook(webhookForm);
      setWebhookData(res.data.webhook);
      setMsg("Webhook registered successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex justify-center items-center">
         <div className="text-cyan-400 font-medium animate-pulse text-xl drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            Loading Interface...
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0f1a] text-white relative overflow-hidden flex flex-col items-center pb-20">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-4xl px-4 pt-10 z-10">
        
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition w-fit mb-6"
        >
          <span className="text-lg">←</span>
          <span className="text-sm font-medium">Dashboard</span>
        </button>

        {/* Header Glass Card */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-4 inline-block drop-shadow-md">
            Developer Platform
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto font-light">
            Manage your API keys, configure webhooks, and integrate world-class payment gateways natively into your apps.
          </p>
        </div>

        {developer ? (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* TABS */}
            <div className="flex px-2 pt-2 bg-slate-900/60 border-b border-white/5">
               <button 
                  onClick={() => setActiveTab('keys')}
                  className={`px-8 py-5 font-semibold text-sm transition relative overflow-hidden tracking-wide ${activeTab === 'keys' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                  API Configuration
                  {activeTab === 'keys' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
               </button>
               <button 
                  onClick={() => setActiveTab('webhook')}
                  className={`px-8 py-5 font-semibold text-sm transition relative overflow-hidden tracking-wide ${activeTab === 'webhook' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                  Webhooks & Events
                  {activeTab === 'webhook' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
               </button>
            </div>

            <div className="p-8">
              {/* API KEYS TAB */}
              {activeTab === 'keys' && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 group hover:bg-slate-800/60 transition">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Developer Name</p>
                        <p className="text-xl font-medium text-white">{developer.developerName}</p>
                     </div>
                     <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 group hover:bg-slate-800/60 transition">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Merchant ID</p>
                        <p className="text-xl font-mono text-cyan-200">{developer.merchantId}</p>
                     </div>
                  </div>

                  <div className="flex flex-col gap-4">
                     <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3">Security Credentials</h3>
                     <p className="text-sm text-slate-400 mb-2">Use your keys to authenticate server requests. <span className="text-pink-400">Never share your secret key publicly.</span></p>
                     
                     <SecretBox label="Public Key" value={developer.publicKey} isSecret={false} />
                     <SecretBox label="Secret Key" value={developer.secretKey} isSecret={true} />
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6 bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl mt-4 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl"></div>
                     {qrCode && (
                       <img src={qrCode} alt="QR" className="w-32 h-32 rounded-xl shadow-lg border border-white/10 object-cover z-10 bg-white" />
                     )}
                     <div className="flex-1 z-10">
                        <h4 className="text-lg font-bold text-white mb-2">Default Linked Bank Account</h4>
                        <p className="text-slate-300">Account Number: <span className="font-mono bg-slate-800/80 border border-white/5 px-2 py-1 rounded text-cyan-300 ml-2">{developer.accountNumber}</span></p>
                        <p className="text-sm text-slate-400 mt-3 leading-relaxed">All scanned QR code transactions mapped to your merchant ID route directly to this account.</p>
                     </div>
                  </div>

                  <div className="mt-4 flex gap-4">
                    <a
                      href="/developer-docs"
                      className="px-6 py-4 rounded-xl font-bold transition hover:-translate-y-1 bg-white text-slate-900 hover:bg-slate-200 shadow-xl flex-1 text-center text-lg"
                    >
                       View Documentation Hub →
                    </a>
                  </div>
                </div>
              )}

              {/* WEBHOOK TAB */}
              {activeTab === 'webhook' && (
                 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div>
                     <h3 className="text-2xl font-bold text-white mb-3">Webhook Integration</h3>
                     <p className="text-slate-400 leading-relaxed text-lg">
                        Securely receive realtime HTTP POST notifications on your backend server automatically upon trigger events like <code className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded text-sm mx-1 shadow-inner border border-white/5 font-mono">payment.success</code>.
                     </p>
                   </div>

                   {error && <div className="border border-red-500/50 bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-3 font-medium"><span>⚠️</span> {error}</div>}
                   {msg && <div className="border border-green-500/50 bg-green-500/10 text-green-400 p-4 rounded-xl flex items-center gap-3 font-medium"><span>✓</span> {msg}</div>}

                   <form onSubmit={handleWebhookSave} className="bg-slate-800/40 border border-white/5 p-8 rounded-2xl flex flex-col gap-6 shadow-inner">
                      <div className="flex flex-col gap-2 relative">
                        <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">Target Endpoint URL</label>
                        <input
                          type="url"
                          required
                          value={webhookForm.url}
                          placeholder="https://api.yourdomain.com/webhooks/ebanking"
                          className="w-full bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl text-white outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition font-mono tracking-wide"
                          onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">Encryption Secret</label>
                        <input
                          type="text"
                          required
                          value={webhookForm.secret}
                          placeholder="e.g. whsec_abc123..."
                          className="w-full bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl text-white outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition font-mono tracking-wide"
                          onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })}
                        />
                        <span className="text-sm text-slate-500 mt-2">This token guarantees requests originate from us. Verify it in the <code className="text-pink-400">x-webhook-secret</code> header.</span>
                      </div>

                      <button
                        type="submit"
                        className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] active:scale-95 transition-all w-full md:w-auto px-12 self-start tracking-wide text-lg"
                      >
                        Deploy Configuration
                      </button>
                   </form>

                   {webhookData && (
                      <div className="mt-4 flex items-center justify-between bg-green-500/10 border border-green-500/30 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-2xl group-hover:bg-green-500/20 transition duration-500"></div>
                         <div className="z-10">
                           <div className="flex items-center gap-2 mb-2">
                             <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]"></div>
                             <p className="text-sm font-bold text-slate-200">Live Webhook Connected</p>
                           </div>
                           <p className="font-mono text-sm text-slate-400">{webhookData.url}</p>
                         </div>
                         <span className="z-10 bg-green-500 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg uppercase tracking-widest shadow-[0_0_15px_rgba(74,222,128,0.4)]">Active</span>
                      </div>
                   )}
                 </div>
              )}
            </div>
          </div>
        ) : (
          /* CREATE DEVELOPER */
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[6px] h-full bg-gradient-to-b from-cyan-400 to-blue-600"></div>
            
            <h3 className="text-3xl font-extrabold text-white mb-3">Initialize Platform Identity</h3>
            <p className="text-slate-400 mb-10 text-lg">Set up your merchant gateway details to generate live API keys and accept payments instantly.</p>

            {error && (
              <div className="border border-red-500/50 bg-red-500/10 text-red-400 p-5 rounded-xl mb-8 flex items-center gap-3 font-medium">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">Business / Developer Name</label>
                <input
                  type="text"
                  required
                  value={form.developerName}
                  placeholder="e.g. Acme Corp Payments"
                  className="w-full bg-slate-900 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:border-cyan-500 transition text-lg shadow-inner"
                  onChange={(e) => setForm({ ...form, developerName: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 tracking-widest uppercase">Linked Bank Account</label>
                <input
                  type="text"
                  required
                  value={form.accountNumber}
                  placeholder="Enter authorized account number"
                  className="w-full bg-slate-900 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:border-cyan-500 transition text-lg shadow-inner"
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                />
              </div>

              {linkedAccount && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-5 rounded-xl mt-2 flex gap-4 items-start shadow-inner">
                  <span className="text-cyan-400 text-xl">ℹ️</span>
                  <p className="text-slate-300 leading-relaxed">
                    This setup locks your API outputs to routing payments directly to: <br/> <strong className="text-white font-mono tracking-wide bg-slate-800 px-2 py-1 rounded inline-block mt-2 border border-white/5">{linkedAccount.accountNumber}</strong>
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-5 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:-translate-y-1 transition-all w-full text-xl"
              >
                Launch Developer Engine
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperPage;
