import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductService } from '@/lib/services/product.service';
import { ProductDetailClient } from '@/components/ProductDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await ProductService.getProductBySlug(slug);
    if (!product) {
      return { title: 'Product Not Found | Kalaasutra' };
    }
    return {
      title: `${product.title} | Customized Artwork by Kalaasutra`,
      description: product.short_description || `Order customized ${product.title} from Shubham Art (Kalaasutra) online. Precise design and quality engraving.`,
      openGraph: {
        title: `${product.title} | Kalaasutra`,
        description: product.short_description || `Bespoke customization options available.`,
        type: 'article',
      }
    };
  } catch {
    return { title: 'Kalaasutra | Customized Artwork' };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let product = null;
  try {
    product = await ProductService.getProductBySlug(slug);
  } catch (err) {
    console.error('Failed to fetch product detail:', err);
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="flex-grow w-full bg-zinc-950">
      <ProductDetailClient product={product} />
    </div>
  );
}
