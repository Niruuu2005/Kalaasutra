/**
 * Features Section Component
 */
import { motion } from 'framer-motion';
import { Box, Palette, Truck, Shield, Sparkles, Zap } from 'lucide-react';

const features = [
  {
    icon: Box,
    title: '3D Preview',
    description: 'Visualize your custom product in stunning 3D before you buy',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Palette,
    title: 'Unlimited Customization',
    description: 'Choose colors, text, fonts, and designs that reflect your style',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'Instant Preview',
    description: 'See changes in real-time as you customize your perfect gift',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Quick production and shipping to your doorstep',
    color: 'from-green-500 to-teal-500',
  },
  {
    icon: Shield,
    title: 'Quality Guaranteed',
    description: 'Premium materials and craftsmanship in every product',
    color: 'from-red-500 to-pink-500',
  },
  {
    icon: Sparkles,
    title: 'Unique Designs',
    description: 'Create one-of-a-kind gifts that leave lasting impressions',
    color: 'from-indigo-500 to-purple-500',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Kalaasutra</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the perfect blend of technology and craftsmanship
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 transform hover:rotate-12 transition-transform`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
