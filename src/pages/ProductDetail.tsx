import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<ShopifyProduct["node"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const isCartLoading = useCartStore((state) => state.isLoading);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!handle) return;
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
        setProduct(data?.data?.product || null);
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [handle]);

  const handleAddToCart = async () => {
    if (!product) return;
    const variant = product.variants.edges[selectedVariantIdx]?.node;
    if (!variant) return;
    const shopifyProduct: ShopifyProduct = { node: product };
    await addItem({
      product: shopifyProduct,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success("נוסף לעגלה", { description: product.title });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white/50 text-lg">המוצר לא נמצא</p>
          <Link to="/shop">
            <Button variant="gold" className="mt-4 gap-2">
              <ArrowRight className="w-4 h-4" />
              חזרה לחנות
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const selectedVariant = product.variants.edges[selectedVariantIdx]?.node;
  const image = product.images.edges[0]?.node;
  const price = selectedVariant?.price || product.priceRange.minVariantPrice;
  const hasMultipleVariants = product.variants.edges.length > 1;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <Link to="/shop" className="flex items-center gap-2 text-gold hover:text-gold/80 mb-8 transition-colors">
          <ArrowRight className="w-4 h-4" />
          חזרה לחנות
        </Link>

        <div className="max-w-4xl mx-auto bg-black/40 backdrop-blur-sm border border-gold/20 rounded-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2 aspect-square bg-gradient-to-br from-primary/80 to-navy-dark flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-l border-gold/20">
              {image ? (
                <img src={image.url} alt={image.altText || product.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-24 h-24 text-gold" />
              )}
            </div>

            <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{product.title}</h1>
                <p className="text-white/70 leading-relaxed mb-6">{product.description}</p>

                {hasMultipleVariants && (
                  <div className="mb-6">
                    <p className="text-white/50 text-sm mb-2">בחר אפשרות:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.edges.map((v, idx) => (
                        <button
                          key={v.node.id}
                          onClick={() => setSelectedVariantIdx(idx)}
                          className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                            idx === selectedVariantIdx
                              ? "border-gold bg-gold/20 text-gold"
                              : "border-gold/20 text-white/60 hover:border-gold/50"
                          }`}
                        >
                          {v.node.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-gold/20 pt-6">
                <span className="text-3xl font-bold text-gold">
                  {price.currencyCode === 'ILS' ? '₪' : price.currencyCode}{parseFloat(price.amount).toFixed(0)}
                </span>
                <Button
                  variant="gold"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isCartLoading || !selectedVariant?.availableForSale}
                  className="gap-2"
                >
                  {isCartLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      הוסף לעגלה
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
