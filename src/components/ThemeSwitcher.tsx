"use client";

import { useEffect, useState } from "react";

const themes = [
  { id: "theme-default", name: "Gold Classic", class: "" },
  { id: "theme-rose", name: "Rose Gold", class: "theme-rose" },
  { id: "theme-sapphire", name: "Sapphire Blue", class: "theme-sapphire" },
  { id: "theme-emerald", name: "Emerald Green", class: "theme-emerald" },
];

export function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState(themes[0]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app-theme");
    if (saved) {
      const found = themes.find((t) => t.id === saved);
      if (found) {
        setActiveTheme(found);
        if (found.class) {
          document.documentElement.classList.add(found.class);
        }
      }
    }
  }, []);

  const switchTheme = (theme: typeof themes[0]) => {
    setActiveTheme(theme);
    localStorage.setItem("app-theme", theme.id);
    
    // Remove all theme classes first
    themes.forEach((t) => {
      if (t.class) document.documentElement.classList.remove(t.class);
    });
    
    // Add new theme class if exists
    if (theme.class) {
      document.documentElement.classList.add(theme.class);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold hover:text-zinc-950 transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)]"
        aria-label="Change Theme"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card-dark border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 animate-fade-in backdrop-blur-md">
          <div className="px-3 py-1.5 border-b border-zinc-800 mb-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Select Theme</span>
          </div>
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => switchTheme(theme)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                activeTheme.id === theme.id ? "text-brand-gold bg-brand-gold/10" : "text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <span>{theme.name}</span>
              {activeTheme.id === theme.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
