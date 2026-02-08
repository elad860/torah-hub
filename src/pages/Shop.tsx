import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ShoppingBag, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { storefrontApiRequest, PRODUCTS_QUERY, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

const Shop = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const isCartLoading = useCartStore((state) => state.isLoading);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await storefrontApiRequest(PRODUCTS_QUERY, { first: 50 });
        setProducts(data?.data?.products?.edges || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success("נוסף לעגלה", { description: product.node.title });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">חנות הספרים</h1>
          <p className="text-white/70 text-lg">ספרי הרב אורן נזרית שליט״א</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg">אין מוצרים כרגע</p>
            <p className="text-white/30 text-sm mt-2">מוצרים חדשים יתווספו בקרוב</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {products.map((product) => {
              const image = product.node.images.edges[0]?.node;
              const price = product.node.priceRange.minVariantPrice;
              return (
                <div
                  key={product.node.id}
                  className="bg-black/40 backdrop-blur-sm border border-gold/20 rounded-xl overflow-hidden hover-lift group"
                >
                  <Link to={`/product/${product.node.handle}`}>
                    <div className="aspect-[3/4] bg-gradient-to-br from-primary/80 to-navy-dark flex items-center justify-center overflow-hidden border-b border-gold/20">
                      {image ? (
                        <img
                          src={image.url}
                          alt={image.altText || product.node.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <BookOpen className="w-16 h-16 text-gold" />
                      )}
                    </div>
                  </Link>
                  <div className="p-5">
                    <Link to={`/product/${product.node.handle}`}>
                      <h3 className="text-lg font-bold text-white mb-1 hover:text-gold transition-colors">
                        {product.node.title}
                      </h3>
                    </Link>
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">{product.node.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gold">
                        {price.currencyCode === 'ILS' ? '₪' : price.currencyCode}{parseFloat(price.amount).toFixed(0)}
                      </span>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={isCartLoading}
                      >
                        {isCartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "הוסף לעגלה"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Shop;
