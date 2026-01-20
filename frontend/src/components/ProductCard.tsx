/**
 * Product Card Component
 */
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  name: string;
  category: string;
  price: number;
  description?: string;
  onCustomize?: () => void;
}

const categoryEmojis: { [key: string]: string } = {
  keychains: '🔑',
  bottles: '💧',
  nameplates: '📝',
  default: '🎨',
};

export default function ProductCard({
  name,
  category,
  price,
  description,
  onCustomize,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const emoji = categoryEmojis[category.toLowerCase()] || categoryEmojis.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group relative"
    >
      {/* Product Image */}
      <div className="relative h-64 bg-gradient-to-br from-primary via-purple-500 to-secondary flex items-center justify-center overflow-hidden">
        <motion.span
          animate={{
            scale: isHovered ? 1.2 : 1,
            rotate: isHovered ? 360 : 0,
          }}
          transition={{ duration: 0.5 }}
          className="text-7xl"
        >
          {emoji}
        </motion.span>
        
        {/* Overlay Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center space-x-3"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-colors"
          >
            <Eye className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsLiked(!isLiked)}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-colors"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-500 hover:text-white transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-800 capitalize">
            {category}
          </span>
        </div>

        {/* New Badge */}
        <div className="absolute top-4 right-4">
          <span className="bg-secondary text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            New
          </span>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500">Starting from</p>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ₹{price}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCustomize}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <span>Customize Now</span>
          <motion.span
            animate={{ x: isHovered ? 5 : 0 }}
            transition={{ duration: 0.3 }}
          >
            →
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  );
}
