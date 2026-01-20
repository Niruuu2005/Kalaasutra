/**
 * Navigation Bar Component
 */
import { useState } from 'react';
import { ShoppingCart, User, Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <Sparkles className="w-8 h-8 text-primary" fill="#FFD700" />
              <div className="absolute inset-0 animate-pulse">
                <Sparkles className="w-8 h-8 text-secondary opacity-50" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Kalaasutra
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Home
            </a>
            <a href="#products" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Products
            </a>
            <a href="#customize" className="text-gray-700 hover:text-primary transition-colors font-medium">
              3D Customize
            </a>
            <a href="#about" className="text-gray-700 hover:text-primary transition-colors font-medium">
              About
            </a>
            <a href="#contact" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Contact
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                0
              </span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <User className="w-6 h-6 text-gray-700" />
            </button>
            <button className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200"
            >
              <div className="py-4 space-y-3">
                <a href="#home" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  Home
                </a>
                <a href="#products" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  Products
                </a>
                <a href="#customize" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  3D Customize
                </a>
                <a href="#about" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  About
                </a>
                <a href="#contact" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  Contact
                </a>
                <div className="flex items-center space-x-2 px-4 pt-2">
                  <button className="flex-1 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg font-semibold">
                    Get Started
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-gray-700" />
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg">
                    <User className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
