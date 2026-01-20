/**
 * Home Page Component
 */
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import CategoriesSection from '../components/CategoriesSection';
import ProductCard from '../components/ProductCard';
import TestimonialsSection from '../components/TestimonialsSection';
import Footer from '../components/Footer';
import { productsAPI } from '../utils/api';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
}

// Mock products for demonstration
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Custom Keychain',
    category: 'keychains',
    price: 199,
    description: 'Personalized keychain with your name or special message',
  },
  {
    id: '2',
    name: 'Designer Water Bottle',
    category: 'bottles',
    price: 499,
    description: 'Eco-friendly bottle with custom designs and colors',
  },
  {
    id: '3',
    name: 'Premium Nameplate',
    category: 'nameplates',
    price: 799,
    description: 'Elegant nameplate for your door or desk',
  },
  {
    id: '4',
    name: 'Luxury Keychain Set',
    category: 'keychains',
    price: 399,
    description: 'Set of 2 premium keychains with 3D engraving',
  },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.list();
      // Use mock products if API returns empty
      setProducts(response.data.length > 0 ? response.data : mockProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Use mock products on error
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Categories Section */}
      <CategoriesSection />

      {/* Products Section */}
      <section id="products" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Featured <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Products</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our handpicked collection of customizable products
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading amazing products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onCustomize={() => console.log('Customize', product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Create Your Perfect Gift?
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers and start customizing today!
          </p>
          <button className="bg-white text-secondary px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl">
            Start Customizing Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

