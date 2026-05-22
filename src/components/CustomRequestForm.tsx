'use client';

// src/components/CustomRequestForm.tsx
// Client component form for requesting off-catalog custom designs

import { useState } from 'react';
import Link from 'next/link';
import { StorageService } from '@/lib/services/storage.service';

interface CustomRequestFormProps {
  whatsappPhone?: string;
}

export function CustomRequestForm({ whatsappPhone = '918421949875' }: CustomRequestFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState('nameplate');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!name.trim() || !phone.trim() || !description.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }

    const rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      setSubmitError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = null;
      if (file) {
        setSubmitError('Uploading image...'); // Temporary status message
        finalImageUrl = await StorageService.uploadFile('custom-requests', file, 'inquiries/');
        setSubmitError('');
      }

      const payload = {
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        request_type: requestType,
        description: description,
        estimated_budget: budget ? Number(budget) : null,
        reference_image_urls: finalImageUrl ? [finalImageUrl] : null,
      };

      const response = await fetch('/api/custom-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit request');
      }

      // Generate WhatsApp Redirection using dynamic number
      const rawMsg = `*🎨 CUSTOM ARTWORK COMMISSION INQUIRY*
      
*Name:* ${name}
*Phone:* ${phone}
*Inquiry Category:* ${requestType.toUpperCase()}
*Description:* ${description}
${budget ? `*Estimated Budget:* ₹${budget}\n` : ''}${finalImageUrl ? `*Reference Link:* ${finalImageUrl}\n` : ''}
Hi Shubham, I would like to query about a custom commission artwork. I've details submitted above. Please check and discuss mockups!`;

      const encodedMsg = encodeURIComponent(rawMsg);
      const cleanPhone = whatsappPhone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      // Open WhatsApp in new window
      window.open(whatsappUrl, '_blank');

      setIsSubmitted(true);
      setName('');
      setPhone('');
      setEmail('');
      setRequestType('nameplate');
      setDescription('');
      setBudget('');
      setFile(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 relative z-10">
      
      {/* Back navigation */}
      <Link
        href="/"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-500 hover:text-brand-gold transition-colors duration-150 mb-8 uppercase tracking-widest"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        <span>Back to Catalog</span>
      </Link>

      {isSubmitted ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-xl shadow-brand-gold/[0.01] animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-zinc-100">Inquiry Registered!</h2>
            <p className="text-sm text-zinc-450 leading-relaxed max-w-sm mx-auto">
              Your custom commission details have been registered. You were redirected to WhatsApp to share drawings, dimensions, and logo graphics directly with the studio.
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Submit another inquiry
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-brand-gold text-zinc-950 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-brand-gold-light transition-all"
            >
              Go to Catalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xl shadow-brand-gold/[0.01]">
          <div className="space-y-2.5">
            <span className="inline-block bg-brand-gold/10 border border-brand-gold/20 px-2.5 py-1 rounded text-[10px] text-brand-gold uppercase tracking-wider font-bold">
              Custom Orders
            </span>
            <h2 className="font-serif text-3xl font-bold text-zinc-100">
              Commission Custom Art
            </h2>
            <p className="text-xs text-zinc-550 leading-relaxed">
              Need a specific dimensions board, custom metal shapes, wood plaques, or custom corporate bulk orders? Provide details and we will coordinate previews over WhatsApp.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                Your Full Name <span className="text-brand-gold">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Priyesh Patel"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3.5 text-xs text-zinc-200 focus:border-brand-gold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                  WhatsApp Phone <span className="text-brand-gold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3.5 text-xs text-zinc-200 focus:border-brand-gold focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. user@gmail.com"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3.5 text-xs text-zinc-200 focus:border-brand-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                Artwork Category
              </label>
              <select
                value={requestType}
                onChange={e => setRequestType(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3.5 text-xs text-zinc-200 focus:border-brand-gold focus:outline-none"
              >
                <option value="nameplate">LED Nameplates / Doorplates</option>
                <option value="keychain">Custom Metallic Keychains</option>
                <option value="business_signage">Business Logo Signboards</option>
                <option value="pencil_sketch">Handmade Pencil Portraits</option>
                <option value="organizer">Desk Stands & Organizers</option>
                <option value="other">Other Customized Item</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                Detailed Requirements <span className="text-brand-gold">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your design, desired height/width dimensions, materials (wood/acrylic/metal), colors, or engraving texts..."
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3.5 text-xs text-zinc-200 focus:border-brand-gold focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                  Estimated Budget (₹ INR)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3.5 text-xs text-zinc-200 focus:border-brand-gold focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                  Reference Image Upload (Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp, image/gif"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      if (f.size > 5 * 1024 * 1024) {
                        setSubmitError("File is too large. Max size is 5MB.");
                      } else {
                        setFile(f);
                        setSubmitError("");
                      }
                    } else {
                      setFile(null);
                    }
                  }}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-xs text-zinc-200 focus:border-brand-gold focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700"
                />
              </div>
            </div>

            {submitError && (
              <p className="text-xs text-red-400 text-center font-medium bg-red-950/20 border border-red-900/50 p-3 rounded-xl">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl bg-brand-gold text-zinc-950 font-bold hover:bg-brand-gold-light transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="text-xs">Submitting inquiry...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  <span className="text-xs uppercase tracking-wider">Submit Inquiry on WhatsApp</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
