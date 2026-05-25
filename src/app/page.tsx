import Link from 'next/link';
import { ProductService } from '@/lib/services/product.service';
import { CategoryService } from '@/lib/services/category.service';
import { SiteSettingsService } from '@/lib/services/site-settings.service';
import { OfferService } from '@/lib/services/offer.service';
import { createClient as createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { CatalogSection } from '@/components/CatalogSection';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache page for 1 hour

export default async function Home() {
  // Load data in parallel from services layer — graceful fallback if DB unreachable
  let productsRaw: any[] = [];
  let categories: any[] = [];
  let siteSettings: Record<string, any> = {};
  let activeOffers: any[] = [];
  let testimonials: any[] = [];
  let dbError = !isSupabaseConfigured();

  if (!dbError) {
    try {
      const results = await Promise.all([
        ProductService.getProducts({}),
        CategoryService.getCategories(),
        SiteSettingsService.getSettings(),
        OfferService.getActiveOffers()
      ]);
      productsRaw = results[0] || [];
      categories = results[1] || [];
      siteSettings = results[2] || {};
      activeOffers = results[3] || [];

      // Query testimonials directly
      const supabase = await createServerClient();
      const { data: testimonialsRaw } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true })
        .limit(4);
      testimonials = testimonialsRaw || [];
    } catch (err) {
      console.error('Failed to load storefront data:', err);
      dbError = true;
      // Gracefully render with empty data — will show empty catalog state
    }
  }

  const products = productsRaw;

  // Find announcement or active offers to show
  let announcement = '';
  if (typeof siteSettings.announcement_bar === 'string') {
    announcement = siteSettings.announcement_bar;
  } else if (siteSettings.announcement_bar && typeof siteSettings.announcement_bar === 'object') {
    announcement = siteSettings.announcement_bar.is_visible !== false ? (siteSettings.announcement_bar.text || '') : '';
  }
  const currentOffer = activeOffers[0];

  return (
    <div className="flex flex-col flex-1 w-full bg-bg-dark text-zinc-150 selection:bg-brand-gold selection:text-zinc-950 font-sans">
      
      {/* 0. Dev Setup Banner — shown when Supabase is not configured */}
      {dbError && (
        <div className="bg-amber-950 border-b border-amber-800/60 px-4 py-4 text-center">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-sm font-bold">Database Not Configured</span>
            </div>
            <p className="text-xs text-amber-300/80">
              Add your real Supabase credentials to <code className="bg-amber-900/60 px-1.5 py-0.5 rounded font-mono">.env.local</code> — replace the placeholder values for <code className="bg-amber-900/60 px-1.5 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-amber-900/60 px-1.5 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        </div>
      )}

      {/* 1. Announcement Banner */}
      {announcement && (
        <div className="bg-gradient-to-r from-brand-gold-dark via-brand-gold to-brand-gold-light text-zinc-950 text-center py-2.5 px-4 text-xs font-bold tracking-widest uppercase">
          {announcement}
        </div>
      )}

      {/* 2. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-20">
        {/* Glowing background circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-gold/10 rounded-full filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full filter blur-[80px]" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="relative max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 z-10">
          <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-800 px-3.5 py-1.5 rounded-full text-xs text-zinc-400 font-semibold tracking-wide backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Accepting Nameplate & Keychain Orders</span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-zinc-100 leading-[1.1]">
            Custom Art, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold-light via-brand-gold to-brand-gold-dark">
              Personalized
            </span> For You
          </h1>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-zinc-450 leading-relaxed font-light">
            We turn names, vehicle numbers, logo branding, and portraits into stunning metal, wood, and glowing LED display pieces. Hand-crafted in Pune, delivered India-wide.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#catalog-section"
              className="w-full sm:w-auto px-8 py-4 bg-brand-gold text-zinc-950 font-bold rounded-xl shadow-lg hover:shadow-brand-gold/20 hover:bg-brand-gold-light transition-all text-sm tracking-wide"
            >
              Configure Custom Gift
            </a>
            <Link
              href="/custom-request"
              className="w-full sm:w-auto px-8 py-4 bg-card-dark border border-zinc-800 text-zinc-300 font-semibold rounded-xl hover:border-zinc-700 hover:text-zinc-100 transition-all text-sm tracking-wide"
            >
              Get Custom Quotation
            </Link>
          </div>

          {/* Core USP indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-3xl mx-auto text-center border-t border-zinc-900">
            <div className="p-3">
              <div className="text-brand-gold font-bold text-lg font-sans">100%</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-1">Order Custom made</div>
            </div>
            <div className="p-3">
              <div className="text-brand-gold font-bold text-lg font-sans">Pan-India</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-1">All-India Delivery</div>
            </div>
            <div className="p-3">
              <div className="text-brand-gold font-bold text-lg font-sans">₹149+</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-1">Starting Price</div>
            </div>
            <div className="p-3">
              <div className="text-brand-gold font-bold text-lg font-sans">12K+</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-1">Instagram Followers</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Offer Banner Showcase */}
      {currentOffer && (
        <section className="max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-card-dark border border-zinc-800 p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-gold/10 rounded-full filter blur-3xl" />
            
            <div className="relative z-10 text-center sm:text-left space-y-2">
              <span className="inline-block bg-brand-gold/10 border border-brand-gold/25 px-2.5 py-1 rounded text-[10px] text-brand-gold uppercase tracking-wider font-bold">
                Festive Offer
              </span>
              <h3 className="font-serif text-2xl font-semibold text-zinc-200">
                {currentOffer.title}
              </h3>
              <p className="text-xs text-zinc-450 max-w-md">
                {currentOffer.description || `Use coupon code during checkout to redeem discount.`}
              </p>
            </div>
            
            {currentOffer.code && (
              <div className="relative z-10 flex flex-col items-center sm:items-end gap-2 shrink-0">
                <div className="px-4 py-2 border-2 border-dashed border-brand-gold/40 bg-bg-dark text-brand-gold rounded-xl font-mono text-sm tracking-wider font-bold uppercase">
                  {currentOffer.code}
                </div>
                <div className="text-[9px] text-zinc-500">
                  Min. order value: ₹{currentOffer.minimum_order_value}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Interactive Catalog grid Section */}
      <CatalogSection products={products} categories={categories} />

      {/* 5. Creator Story / USP Section */}
      <section className="bg-card-dark/35 border-y border-zinc-900 py-20 font-sans w-full" id="about-section">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Story description */}
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2">
                <span className="h-px w-8 bg-brand-gold" />
                <span className="text-xs font-bold text-brand-gold uppercase tracking-widest">The Workshop</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-zinc-150">
                Crafting Legacies by Hand and Machine
              </h2>
              <p className="text-zinc-450 leading-relaxed font-light text-sm">
                Founded by <strong>Shubham Sutar</strong>, a Civil Engineer who followed his passion for digital illustration and physical design, <strong>Kalaasutra</strong> creates customized nameplates, brass keychains, and executive corporate gifts that tell a story.
              </p>
              <p className="text-zinc-400 leading-relaxed font-light text-sm">
                Every piece starts as a customized design file, ensuring layouts and typography match client requirements perfectly. Then, in our Pune workshop, we run precise laser cuts, fiber engravings, acrylic layers, and LED installations to yield premium finished items that leave a lasting impression.
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-1 border-l-2 border-brand-gold pl-4">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Premium Materials</h4>
                  <p className="text-xs text-zinc-500">Polished brass, high-density acrylic, stainless steel, and teakwood base plates.</p>
                </div>
                <div className="space-y-1 border-l-2 border-brand-gold pl-4">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Design Previews</h4>
                  <p className="text-xs text-zinc-500">We send detailed font layout mockups on WhatsApp before cutting the plates.</p>
                </div>
              </div>
            </div>

            {/* Video Placeholder / Illustration Frame */}
            <div className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-bg-dark border border-zinc-800 shadow-2xl flex items-center justify-center group">
              {/* Gold gradient accent */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-gold/10 via-transparent to-brand-gold/5 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Custom SVG logo details */}
              <div className="relative text-center p-8 space-y-3 z-10">
                <span className="font-serif text-3xl tracking-[0.2em] text-brand-gold font-bold uppercase block">
                  Kalaasutra
                </span>
                <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase font-semibold block">
                  Shubham Art Design Studio
                </span>
                <p className="text-[11px] text-zinc-400 font-light max-w-xs leading-normal">
                  Pune, MH, India. CNC Laser Cutters, Acrylic Detailing, Fiber Engraving, & Fine Calligraphy.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Testimonials Reviews */}
      {testimonials.length > 0 && (
        <section className="max-w-7xl w-full mx-auto px-4 py-20 sm:px-6 lg:px-8 font-sans" id="testimonials">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-brand-gold uppercase tracking-widest block mb-2">
              Reviews
            </span>
            <h2 className="font-serif text-3xl font-semibold text-zinc-200">
              Customer Feedbacks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map(item => (
              <div
                key={item.id}
                className="bg-card-dark border border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between"
              >
                <p className="text-zinc-400 text-sm leading-relaxed italic mb-6">
                  &ldquo;{item.message}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-300">{item.customer_name}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.source}</span>
                  </div>
                  
                  {/* Star rating */}
                  <div className="flex text-brand-gold">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Direct Inquiry Banner CTA */}
      <section className="bg-gradient-to-b from-bg-dark to-card-dark border-t border-zinc-900 py-16 w-full">
        <div className="max-w-4xl w-full mx-auto px-4 text-center space-y-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-zinc-100">
            Need a fully customized design?
          </h2>
          <p className="text-zinc-450 max-w-lg mx-auto text-sm">
            For custom logo signboards, acrylic letters of specific sizes, or complex hand-drawn sketch commissions, submit your ideas through our Inquiry sheet.
          </p>
          <div className="pt-2">
            <Link
              href="/custom-request"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-card-dark hover:bg-zinc-800 text-brand-gold font-bold border border-brand-gold/30 hover:border-brand-gold/80 rounded-xl transition-all text-xs tracking-wider uppercase"
            >
              <span>Submit Inquiry Form</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
