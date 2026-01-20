/**
 * Categories Section Component
 */
import { motion } from 'framer-motion';
import { KeyRound, Droplet, Type, Gift } from 'lucide-react';

const categories = [
  {
    icon: KeyRound,
    name: 'Keychains',
    description: 'Personalized keychains with your name or message',
    image: '🔑',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: Droplet,
    name: 'Bottles',
    description: 'Custom water bottles with unique designs',
    image: '💧',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    icon: Type,
    name: 'Nameplates',
    description: 'Elegant nameplates for doors and desks',
    image: '📝',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    icon: Gift,
    name: 'Gift Sets',
    description: 'Curated gift sets for special occasions',
    image: '🎁',
    gradient: 'from-green-400 to-teal-500',
  },
];

export default function CategoriesSection() {
  return (
    <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Browse Our <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Categories</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find the perfect customizable product for any occasion
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="group cursor-pointer"
            >
              <div className="relative bg-gray-800 rounded-2xl p-6 overflow-hidden">
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-20 transition-opacity`}></div>
                
                {/* Icon */}
                <div className={`w-20 h-20 bg-gradient-to-br ${category.gradient} rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                  <span className="text-4xl">{category.image}</span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-center mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-400 text-center text-sm">
                  {category.description}
                </p>

                {/* Hover Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className={`w-full mt-4 bg-gradient-to-r ${category.gradient} text-white py-2 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                  Explore Now
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
