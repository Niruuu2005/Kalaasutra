'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';

export default function OrderSuccessPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  useEffect(() => {
    // Try to retrieve the WhatsApp URL from session storage that was saved during checkout
    const url = sessionStorage.getItem(`wa_url_${orderNumber}`);
    if (url) {
      setWhatsappUrl(url);
    }
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="font-serif text-3xl text-zinc-100 font-semibold mb-2">Order Registered!</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Your order <strong className="text-amber-400 font-mono tracking-wider">{orderNumber}</strong> has been successfully registered in our system.
        </p>

        {whatsappUrl ? (
          <div className="bg-amber-900/20 border border-amber-900/50 rounded-2xl p-5 mb-8 text-left">
            <h3 className="text-amber-400 font-bold text-sm mb-2 uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              Next Step: Payment
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed">
              To complete your order, please send us the pre-filled WhatsApp message. We will reply with our UPI QR code and your design previews!
            </p>
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold py-3 px-4 rounded-xl text-center transition-colors shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"/>
              </svg>
              Send WhatsApp Message
            </a>
          </div>
        ) : (
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-5 mb-8 text-left">
            <h3 className="text-emerald-400 font-bold text-sm mb-2 uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
              Payment Successful
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed mb-4">
              Your payment has been securely processed and your order is confirmed. You will receive an automated confirmation on WhatsApp shortly!
            </p>
            <div className="bg-zinc-950/50 rounded-lg p-3 text-xs text-zinc-400 font-mono text-center">
              Awaiting Tracking Status updates...
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link 
            href="/track" 
            className="block w-full py-3 px-4 rounded-xl border border-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-800 transition-colors"
          >
            Track Your Order
          </Link>
          <Link 
            href="/" 
            className="block w-full py-3 px-4 rounded-xl text-zinc-500 hover:text-amber-400 font-semibold text-sm transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
