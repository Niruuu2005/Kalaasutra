// src/components/MaintenanceScreen.tsx
// Premium glassmorphic maintenance fallback screen for Kalaasutra storefront

interface MaintenanceScreenProps {
  message?: string;
  whatsappNumber?: string;
}

export function MaintenanceScreen({
  message = "We are currently updating our store with new collections. We will be back online shortly!",
  whatsappNumber = "918421949875",
}: MaintenanceScreenProps) {
  const cleanPhone = whatsappNumber.replace(/\D/g, "");
  const defaultText = "Hello Kalaasutra, I noticed the store is in maintenance mode but would like to inquire about a custom order!";
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultText)}`;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-150 selection:bg-brand-gold selection:text-zinc-950 font-sans relative overflow-hidden px-4">
      {/* Dynamic Glowing Spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-gold/10 rounded-full filter blur-[120px] animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-amber-500/5 rounded-full filter blur-[80px]" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Center Glass Card */}
      <div className="relative max-w-lg w-full bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-8 sm:p-12 text-center space-y-8 shadow-2xl shadow-brand-gold/[0.02]">
        
        {/* Animated Gold Ring & Logo Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center rounded-full border border-brand-gold/30 bg-zinc-950/80 shadow-inner group">
          <div className="absolute inset-0 rounded-full bg-brand-gold/5 animate-ping opacity-75" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-10 h-10 text-brand-gold animate-pulse"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17L17.25 21A2.67 2.67 0 1021 17.25l-5.83-5.83m-4.75 4.75a3 3 0 01-4.24-4.24m4.24 4.24a3 3 0 004.24-4.24m-4.24 0l-5.83-5.83A2.67 2.67 0 018.75 3h.75a2.25 2.25 0 012.25 2.25v1.44a2.25 2.25 0 00.66 1.59l1.44 1.44a2.25 2.25 0 01.66 1.59v.75m-.66-4.5H10.5"
            />
          </svg>
        </div>

        {/* Brand Details */}
        <div className="space-y-3">
          <span className="font-serif text-3xl sm:text-4xl tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-brand-gold-light via-brand-gold to-brand-gold-dark font-bold uppercase block">
            Kalaasutra
          </span>
          <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase font-bold block">
            Shubham Art Design Studio
          </span>
        </div>

        {/* Status Message */}
        <div className="space-y-4 border-t border-zinc-800/60 pt-6">
          <h2 className="font-serif text-lg font-semibold text-zinc-200 uppercase tracking-widest">
            Scheduled Maintenance
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed font-light">
            {message}
          </p>
        </div>

        {/* WhatsApp CTA Button */}
        <div className="pt-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-brand-gold-dark to-brand-gold text-zinc-950 font-bold rounded-2xl shadow-lg hover:shadow-brand-gold/10 hover:from-brand-gold hover:to-brand-gold-light transition-all text-xs tracking-wider uppercase"
          >
            {/* WhatsApp SVG Icon */}
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.714-1.465L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.9 9.9 0 00-6.98-2.879C6.205 1.96 1.782 6.33 1.778 11.758c-.001 1.706.467 3.376 1.353 4.878l-.992 3.624 3.743-.974a9.92 9.9 0 004.725 1.228zm10.966-7.46c-.287-.144-1.702-.84-1.965-.936-.263-.096-.454-.144-.645.144-.191.288-.741.936-.909 1.127-.168.19-.335.216-.622.072-.287-.144-1.215-.447-2.316-1.43-.856-.764-1.433-1.709-1.6-1.997-.168-.288-.018-.444.125-.587.129-.129.287-.335.43-.503.144-.168.191-.288.287-.48.096-.191.048-.36-.024-.503-.072-.143-.645-1.554-.884-2.13-.233-.56-.47-.483-.645-.492-.166-.008-.358-.01-.55-.01-.191 0-.503.072-.765.36-.263.287-1.004.983-1.004 2.397s1.028 2.782 1.171 2.973c.143.19 2.023 3.09 4.898 4.33.684.295 1.218.47 1.635.602.687.219 1.312.188 1.807.114.551-.082 1.702-.696 1.942-1.368.24-.672.24-1.248.168-1.368-.072-.12-.263-.191-.55-.335z" />
            </svg>
            Contact via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
