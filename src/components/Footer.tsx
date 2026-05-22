import Link from 'next/link';

interface FooterProps {
  whatsappPhone?: string;
}

export function Footer({ whatsappPhone = "918421949875" }: FooterProps) {
  const formattedPhone = whatsappPhone.startsWith("91") && whatsappPhone.length === 12
    ? `+91 ${whatsappPhone.slice(2, 7)} ${whatsappPhone.slice(7)}`
    : whatsappPhone.startsWith("+")
      ? whatsappPhone
      : `+${whatsappPhone}`;
  const cleanPhone = whatsappPhone.replace(/\D/g, "");

  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 text-zinc-400 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <span className="font-serif text-2xl tracking-widest text-brand-gold font-bold uppercase block">
              Kalaasutra
            </span>
            <p className="text-sm max-w-sm text-zinc-400 leading-relaxed">
              Premium personalized gifts and home decor combining fine digital calligraphic design with precise physical manufacturing. Hand-crafted in Pune, Maharashtra.
            </p>
            <div className="text-xs text-zinc-500">
              Delivering customized artistic items all across India.
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-widest">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-brand-gold transition-colors duration-150">
                  Browse Store
                </Link>
              </li>
              <li>
                <Link href="/custom-request" className="hover:text-brand-gold transition-colors duration-150">
                  Request Custom Order
                </Link>
              </li>
              <li>
                <a href="#about-section" className="hover:text-brand-gold transition-colors duration-150">
                  About the Artist
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-brand-gold transition-colors duration-150">
                  Client Reviews
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-widest">
              Get In Touch
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-brand-gold">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
                <a href={`tel:+${cleanPhone}`} className="hover:text-brand-gold transition-colors duration-150">
                  {formattedPhone}
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-brand-gold">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M12 18.75A6.75 6.75 0 1012 5.25a6.75 6.75 0 000 13.5z" />
                </svg>
                <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors duration-150">
                  Direct WhatsApp Chat
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-brand-gold">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19l.793-1.426A2.25 2.25 0 018.87 2.5h6.26a2.25 2.25 0 011.962 1.264l.793 1.426H6.115zm-.39 1.777a2.25 2.25 0 00-1.35 2.02v9.263A2.25 2.25 0 006.625 20.5h10.75a2.25 2.25 0 002.25-2.25v-9.26a2.25 2.25 0 00-1.35-2.021L17.275 5.25H6.725l-.999 1.717z" />
                </svg>
                <a href="https://instagram.com/shubham__art" target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors duration-150">
                  @shubham__art on Instagram
                </a>
              </li>
            </ul>
          </div>
          
        </div>
        
        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Kalaasutra by Shubham Art. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Designed & Handcrafted in Pune, India</p>
        </div>
      </div>
    </footer>
  );
}
