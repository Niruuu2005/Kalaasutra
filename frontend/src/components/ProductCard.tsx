/**
 * Product Card Component
 */
interface ProductCardProps {
  name: string;
  category: string;
  price: number;
  description?: string;
  onCustomize?: () => void;
}

export default function ProductCard({
  name,
  category,
  price,
  description,
  onCustomize,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="h-48 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <span className="text-4xl">🎨</span>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{category}</span>
        </div>
        
        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-primary">₹{price}</span>
          <button
            onClick={onCustomize}
            className="bg-secondary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Customize
          </button>
        </div>
      </div>
    </div>
  );
}
