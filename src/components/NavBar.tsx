'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CartStore } from '@/lib/cart';

import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export function NavBar() {
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Update cart count
    const updateCount = () => {
      const cart = CartStore.getCart();
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    updateCount();
    const unsubscribe = CartStore.subscribe(updateCount);

    // Scroll listener
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const triggerCartOpen = () => {
    window.dispatchEvent(new CustomEvent('kalaasutra_toggle_cart'));
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/40 shadow-lg'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="group flex flex-col">
              <span className="font-serif text-2xl tracking-widest text-brand-gold font-bold uppercase transition-all duration-300 group-hover:text-brand-gold-light">
                Kalaasutra
              </span>
              <span className="text-[9px] tracking-[0.25em] text-zinc-400 font-sans uppercase font-medium group-hover:text-zinc-300">
                by shubham art
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/"
              className="text-sm font-medium tracking-wide text-zinc-300 hover:text-brand-gold transition-colors duration-200"
            >
              Browse Catalog
            </Link>
            <Link
              href="/custom-request"
              className="text-sm font-medium tracking-wide text-zinc-300 hover:text-brand-gold transition-colors duration-200"
            >
              Custom Inquiries
            </Link>
            <a
              href="#about-section"
              className="text-sm font-medium tracking-wide text-zinc-300 hover:text-brand-gold transition-colors duration-200"
            >
              Our Story
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium tracking-wide text-zinc-300 hover:text-brand-gold transition-colors duration-200"
            >
              Reviews
            </a>
          </nav>

          {/* Utilities Buttons */}
          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
            
            <button
              onClick={triggerCartOpen}
              className="relative p-2.5 text-zinc-300 hover:text-brand-gold transition-colors focus:outline-none rounded-full bg-zinc-900/60 border border-zinc-800 hover:border-brand-gold/40"
              aria-label="Open Cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-zinc-950 animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800/80 px-4 pt-2 pb-6 space-y-3 shadow-inner">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-md text-base font-medium text-zinc-300 hover:text-brand-gold hover:bg-zinc-900 transition-all"
          >
            Browse Catalog
          </Link>
          <Link
            href="/custom-request"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-md text-base font-medium text-zinc-300 hover:text-brand-gold hover:bg-zinc-900 transition-all"
          >
            Custom Inquiries
          </Link>
          <a
            href="#about-section"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-md text-base font-medium text-zinc-300 hover:text-brand-gold hover:bg-zinc-900 transition-all"
          >
            Our Story
          </a>
          <a
            href="#testimonials"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-md text-base font-medium text-zinc-300 hover:text-brand-gold hover:bg-zinc-900 transition-all"
          >
            Reviews
          </a>
        </div>
      )}
    </header>
  );
}
