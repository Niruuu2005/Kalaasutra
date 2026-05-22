import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Kalaasutra',
  description: 'Privacy Policy for Kalaasutra by Shubham Art.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <Link href="/" className="text-brand-gold hover:underline text-sm mb-4 inline-block">&larr; Back to Home</Link>
          <h1 className="text-3xl md:text-5xl font-serif text-zinc-100">Privacy Policy</h1>
          <p className="text-zinc-500 text-sm">Last Updated: May 2026</p>
        </div>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">1. Information We Collect</h2>
          <p>
            When you place an order or contact us, we collect necessary information including your name, 
            phone number, email address (optional), delivery address, and any custom requirements 
            you provide.
          </p>
        </section>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">2. How We Use Your Information</h2>
          <p>We use your information strictly to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process and deliver your custom orders.</li>
            <li>Communicate with you regarding your order via WhatsApp.</li>
            <li>Improve our products and services.</li>
          </ul>
        </section>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">3. WhatsApp Communications</h2>
          <p>
            Our primary method of communication and payment confirmation is WhatsApp. By placing an 
            order, you agree to be contacted via WhatsApp regarding your order details, artwork proofs, 
            and payment requests.
          </p>
        </section>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">4. Data Sharing and Security</h2>
          <p>
            We do not sell, rent, or trade your personal information to third parties. We use secure 
            database infrastructure to store your order details and take reasonable precautions to 
            protect your information.
          </p>
        </section>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">5. Your Rights</h2>
          <p>
            You have the right to request the deletion or correction of your personal data. 
            To do so, please contact us directly via our official WhatsApp number.
          </p>
        </section>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">6. Contact Us</h2>
          <p>
            For any privacy-related concerns, please message us on our official WhatsApp number 
            or reach out via our Instagram page.
          </p>
        </section>
      </div>
    </div>
  );
}
