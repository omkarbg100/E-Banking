import { useState } from "react";
import HomeNav from "../components/home/HomeNav";
import Footer from "../components/home/Footer";

const CodeBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-6 mb-10 rounded-2xl overflow-hidden bg-[#0d1323] border border-white/10 shadow-2xl group transition hover:border-cyan-500/30">
      {/* Mac OS Window Header */}
      <div className="flex px-5 py-4 bg-slate-900 border-b border-white/5 items-center justify-between">
        <div className="flex gap-2">
           <div className="w-3.5 h-3.5 rounded-full bg-red-400 shadow-[0_0_5px_#f87171]"></div>
           <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 shadow-[0_0_5px_#facc15]"></div>
           <div className="w-3.5 h-3.5 rounded-full bg-green-400 shadow-[0_0_5px_#4ade80]"></div>
        </div>
        <button
          onClick={copy}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold hover:text-white hover:bg-slate-700 transition"
        >
          {copied ? "Copied! ✓" : "Copy"}
        </button>
      </div>

      <pre className="p-6 md:p-8 text-sm overflow-x-auto text-slate-300 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const DeveloperDocs = () => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if(el) {
       window.scrollTo({
          top: el.offsetTop - 120,
          behavior: 'smooth'
       })
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <HomeNav />

      {/* Hero Header */}
      <header className="relative pt-40 pb-28 px-6 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[500px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none"></div>
        <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 mb-8 relative z-10 drop-shadow-lg tracking-tight">
          E-Banking Gateway API
        </h1>
        <p className="text-slate-400 text-xl max-w-3xl mx-auto font-light relative z-10 leading-relaxed">
          Supercharge your e-commerce platform. Accept payments instantly with our sleek frontend SDKs and robust backend infrastructure.
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row gap-16 relative z-10">
        
        {/* Sticky Sidebar Navigation */}
        <aside className="w-full md:w-72 shrink-0 hidden md:block">
           <div className="sticky top-32 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h4 className="text-xs font-black text-cyan-500 uppercase tracking-widest mb-6">Contents</h4>
              <nav className="flex flex-col gap-4">
                 <button onClick={()=>scrollTo('auth')} className="text-left font-medium text-slate-400 hover:text-white hover:translate-x-1 transition">1. Authentication</button>
                 <button onClick={()=>scrollTo('order')} className="text-left font-medium text-slate-400 hover:text-white hover:translate-x-1 transition">2. Create Order</button>
                 <button onClick={()=>scrollTo('checkout')} className="text-left font-medium text-slate-400 hover:text-white hover:translate-x-1 transition">3. SDK Checkout</button>
                 <button onClick={()=>scrollTo('webhooks')} className="text-left font-medium text-slate-400 hover:text-white hover:translate-x-1 transition">4. Webhooks</button>
                 <button onClick={()=>scrollTo('security')} className="text-left font-medium text-slate-400 hover:text-white hover:translate-x-1 transition">5. Security Rules</button>
              </nav>
           </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 max-w-4xl pb-32">
          
          {/* AUTHENTICATION */}
          <section id="auth" className="mb-24 scroll-mt-32">
            <h2 className="text-4xl font-extrabold text-white mb-6 flex items-center gap-4">
               <span className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.5)] font-black text-2xl">1</span>
               Authentication
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg mb-4">
              All server-to-server API requests must be securely authenticated. Provide your <strong>Secret Key</strong> inside the standard HTTP <code className="bg-slate-800 text-cyan-300 px-2 py-1 rounded font-mono border border-white/10 shadow-inner">Authorization</code> header as a Bearer token.
            </p>
            <CodeBlock
              code={`Headers: \nAuthorization: Bearer <YOUR_SECRET_KEY>`}
            />
          </section>

          {/* CREATE ORDER */}
          <section id="order" className="mb-24 scroll-mt-32">
            <h2 className="text-4xl font-extrabold text-white mb-6 flex items-center gap-4">
               <span className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.5)] font-black text-2xl">2</span>
               Create an Order
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg mb-6">
              Before redirecting a customer to payment, your backend server must create an Order. This securely locks in the payment amount to prevent client-side tampering.
            </p>
            <CodeBlock
              code={`POST https://api.ebanking.com/payment/create-order\n\nHeaders:\nAuthorization: Bearer sk_live_yourSecretKey123\n\nBody:\n{\n  "amount": 1500,\n  "currency": "INR"\n}\n\n// ⬇️ Success Response\n{\n  "success": true,\n  "order": {\n    "orderId": "order_a1b2c3d4",\n    "amount": 1500,\n    "status": "CREATED"\n  }\n}`}
            />
          </section>

          {/* HOSTED CHECKOUT */}
          <section id="checkout" className="mb-24 scroll-mt-32">
            <h2 className="text-4xl font-extrabold text-white mb-6 flex items-center gap-4">
               <span className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.5)] font-black text-2xl">3</span>
               Launch Checkout SDK
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg mb-6">
              Pass the securely generated <code>orderId</code> to our Javascript SDK on your client frontend to pop open our rich, fully-hosted payment module.
            </p>
            <CodeBlock
              code={`import { EBankingPay } from '@ebanking/checkout';\n\nconst payment = new EBankingPay({\n    key: "YOUR_PUBLIC_KEY",\n    order_id: "order_a1b2c3d4",\n    amount: 1500,\n    onSuccess: function(response) {\n        console.log("Payment ID:", response.paymentId);\n    }\n});\n\npayment.open();`}
            />
          </section>

          {/* WEBHOOKS */}
          <section id="webhooks" className="mb-24 scroll-mt-32">
            <h2 className="text-4xl font-extrabold text-white mb-6 flex items-center gap-4">
               <span className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.5)] font-black text-2xl">4</span>
               Listening for Webhooks
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg mb-6">
              We send an automatic backend payload the millisecond a transaction finishes. Configure your webhook URL in the dashboard and always verify our signature.
            </p>
            <CodeBlock
              code={`POST https://yourwebsite.com/webhook\n\nHeaders:\nx-webhook-secret: <YOUR_WEBHOOK_SECRET>\n\nBody:\n{\n  "event": "payment.success",\n  "data": {\n    "merchantId": "...",\n    "payment": {\n      "paymentId": "pay_xyz",\n      "orderId": "order_abc",\n      "amount": 1500,\n      "status": "SUCCESS"\n    }\n  }\n}`}
            />
          </section>

          {/* SECURITY BEST PRACTICES */}
          <section id="security" className="mb-10 scroll-mt-32">
            <h2 className="text-4xl font-extrabold text-white mb-6 flex items-center gap-4">
               <span className="bg-slate-800 text-pink-400 w-12 h-12 flex items-center justify-center rounded-2xl shadow-[0_0_15px_rgba(244,114,182,0.3)] font-black text-2xl border border-pink-500/20">5</span>
               Core Integrity
            </h2>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-3xl rounded-full"></div>
               <ul className="list-disc list-inside text-slate-300 space-y-6 text-lg relative z-10">
                 <li className="leading-relaxed"><strong>Never</strong> expose your <code className="bg-slate-800 px-2 py-1 rounded text-pink-400 text-sm border border-pink-500/30">Secret Key</code> in client-side code (React/HTML). It grants full access to create orders.</li>
                 <li className="leading-relaxed">Always verify the <code>x-webhook-secret</code> header for inbound webhooks to guarantee the payload actually came from E-Banking.</li>
                 <li className="leading-relaxed">Never confidently fulfill an order simply because the user reached the client "success" screen. <em className="text-cyan-400 not-italic font-semibold">Wait for the secure webhook.</em></li>
               </ul>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DeveloperDocs;
