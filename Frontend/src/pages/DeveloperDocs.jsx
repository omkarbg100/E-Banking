import { useState } from "react";
import HomeNav from "../components/home/HomeNav";
import Footer from "../components/home/Footer";

/* ---------------- CODE BLOCK ---------------- */
const CodeBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={copy}
        className="absolute top-3 right-3 text-xs px-3 py-1 rounded-md
                   bg-slate-800 hover:bg-slate-700 transition text-slate-300"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>

      <pre className="p-6 text-sm overflow-x-auto text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/* ---------------- MAIN PAGE ---------------- */
const DeveloperDocs = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-slate-900 text-white">

      {/* NAVBAR */}
      <HomeNav />

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-14 flex flex-col gap-16">

        {/* HEADER */}
        <section className="text-center">
          <h1 className="text-5xl font-extrabold text-cyan-400 mb-4">
            Developer Documentation
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything you need to integrate payments, manage developer accounts,
            and build secure financial workflows.
          </p>
        </section>

        {/* CREATE DEV */}
        <section className="flex flex-col gap-4">
          <h2 className="text-3xl font-semibold text-cyan-300">
            1️⃣ Create Developer Account
          </h2>

          <p className="text-slate-400">
            Each user can create <strong>one developer account</strong> linked to a bank
            account. This generates a <strong>merchantId</strong> and a{" "}
            <strong>publicKey</strong>.
          </p>

          <CodeBlock
            code={`POST /api/developer/create

Headers:
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "developerName": "My Payment App",
  "accountNumber": "1234567890"
}`}
          />
        </section>

        {/* BACKEND */}
        <section className="flex flex-col gap-4">
          <h2 className="text-3xl font-semibold text-cyan-300">
            2️⃣ Backend Integration (Node + Express)
          </h2>

          <CodeBlock
            code={`export const createDeveloper = async (req, res) => {
  const { developerName, accountNumber } = req.body;

  const existing = await Developer.findOne({ user: req.user.id });
  if (existing) {
    return res.status(400).json({ message: "Developer already exists" });
  }

  const developer = await Developer.create({
    user: req.user.id,
    developerName,
    accountNumber,
    merchantId: "MER_" + Date.now(),
    publicKey: crypto.randomBytes(24).toString("hex"),
  });

  const qrCode = generatePaymentQR(developer);

  res.json({ developer, qrCode });
};`}
          />
        </section>

        {/* FRONTEND */}
        <section className="flex flex-col gap-4">
          <h2 className="text-3xl font-semibold text-cyan-300">
            3️⃣ Frontend Integration (React)
          </h2>

          <CodeBlock
            code={`import axios from "./axiosInstance";

export const createDeveloperAccount = (data) =>
  axios.post("/developer/create", data);

export const getMyDeveloperAccount = () =>
  axios.get("/developer/me");`}
          />
        </section>

        {/* QR FLOW */}
        <section className="flex flex-col gap-4">
          <h2 className="text-3xl font-semibold text-cyan-300">
            4️⃣ QR Payment Flow
          </h2>

          <CodeBlock
            code={`{
  "merchantId": "MER_1700000000",
  "publicKey": "abc123xyz",
  "accountNumber": "1234567890"
}`}
          />
        </section>

        {/* SECURITY */}
        <section className="flex flex-col gap-4">
          <h2 className="text-3xl font-semibold text-cyan-300">
            5️⃣ Security Best Practices
          </h2>

          <ul className="list-disc list-inside text-slate-400 space-y-1">
            <li>Public keys are safe to expose</li>
            <li>JWT required for all private APIs</li>
            <li>One developer account per user</li>
            <li>All payments are server-verified</li>
          </ul>
        </section>

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default DeveloperDocs;
