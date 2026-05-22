import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Kalaasutra',
  description: 'Terms of Service for Kalaasutra by Shubham Art.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <Link href="/" className="text-brand-gold hover:underline text-sm mb-4 inline-block">&larr; Back to Home</Link>
          <h1 className="text-3xl md:text-5xl font-serif text-zinc-100">Terms of Service</h1>
          <p className="text-zinc-500 text-sm">Last Updated: May 2026</p>
        </div>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">1. General</h2>
          <p>
            Welcome to Kalaasutra. By accessing our website and placing an order, you agree to be bound 
            by these Terms of Service. All custom artwork and products are crafted individually.
          </p>
        </section>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">2. Order Process & Payment</h2>
          <p>
            When you place an order on this website, it serves as an inquiry/request. 
            The final confirmation of the order and payment will be coordinated via WhatsApp. 
            We require payment (usually via UPI) before work begins on your custom piece.
          </p>
        </section>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">3. Custom Artwork Approval</h2>
          <p>
            For certain custom items, we may share a digital proof via WhatsApp. Once approved, 
            the design cannot be altered without incurring additional charges. 
          </p>
        </section>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">4. Refunds and Cancellations</h2>
          <p>
            Because our products are highly customized and made-to-order, we do not offer refunds 
            or accept returns once production has started. If an item arrives damaged during transit, 
            please contact us on WhatsApp with an unboxing video within 24 hours of delivery.
          </p>
        </section>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">5. Delivery</h2>
          <p>
            Estimated delivery times are provided as guidelines only. While we strive to meet all 
            deadlines, handmade art requires time, and unforeseen delays may occur.
          </p>
        </section>

        <section className="space-y-4 text-zinc-400">
          <h2 className="text-xl text-zinc-200 font-medium">6. Contact</h2>
          <p>
            If you have questions about these terms, please contact us via our official WhatsApp 
            number provided on the website.
          </p>
        </section>
      </div>
    </div>
  );
}
