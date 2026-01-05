import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

export default function ScanQR() {
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        console.log("QR Scanned:", decodedText);

        scanner.clear().then(() => {
          // Navigate to transaction page with QR data
          navigate("/transactions", {
            state: { qrData: decodedText },
          });
        });
      },
      (error) => {
        // ignore scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-cyan-400 text-lg cursor-pointer"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">Scan QR Code</h2>
      </div>

      {/* SCANNER */}
      <div className="flex justify-center mt-10">
        <div
          id="qr-reader"
          className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/10"
        />
      </div>

      {/* INFO */}
      <p className="text-center text-white/60 text-sm mt-8">
        Align the QR code within the frame to scan
      </p>
    </div>
  );
}
