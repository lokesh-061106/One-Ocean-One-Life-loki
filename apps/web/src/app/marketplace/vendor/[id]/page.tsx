"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Phone, Star, Package } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchCms, fetchCmsList } from "@/lib/api-helpers";
import { type ApiVendor, type ApiProduct, resolveVillageName } from "@/lib/marketplace-types";
import { LocationDisplay } from "@/components/location-display";

export default function VendorProfilePage() {
  const params = useParams();
  const [vendor, setVendor] = useState<ApiVendor | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [v, p] = await Promise.all([
        fetchCms<ApiVendor>(`/marketplace/vendors/${params.id}/`),
        fetchCmsList<ApiProduct>(`/marketplace/products/?vendor=${params.id}`),
      ]);
      setVendor(v);
      setProducts(p);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center"><div className="animate-pulse">Loading...</div></main>
        <Footer />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 text-ocean-muted mx-auto mb-4" />
          <p className="text-lg text-ocean-text-secondary">Vendor not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero bare className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-4xl font-bold text-white">{vendor.shop_name}</h1>
              {vendor.is_verified && <Badge className="bg-ocean-green text-white">✓ Verified</Badge>}
            </div>
            {vendor.village && (
              <LocationDisplay
                name={resolveVillageName(vendor.village, vendor.village_name)}
                lat={vendor.latitude}
                lng={vendor.longitude}
                showCoords={true}
                size="md"
                className="text-ocean-sand mb-2"
              />
            )}
            {vendor.phone && (
              <div className="flex items-center gap-1 text-ocean-sand mb-4">
                <Phone className="h-4 w-4" />{vendor.phone}
              </div>
            )}
            <p className="text-lg text-ocean-sand/90 max-w-2xl">{vendor.description}</p>
            <div className="flex gap-8 mt-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-white text-2xl font-bold">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />{vendor.rating?.toFixed(1) || "0.0"}
                </div>
                <p className="text-ocean-sand/70 text-sm">Rating</p>
              </div>
              <div className="text-center">
                <div className="text-white text-2xl font-bold">{vendor.total_sales}</div>
                <p className="text-ocean-sand/70 text-sm">Sales</p>
              </div>
            </div>
          </div>
        </PageHero>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-ocean-navy mb-8">Products by {vendor.shop_name}</h2>
          {products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-ocean-muted mx-auto mb-4" />
              <p className="text-lg text-ocean-text-secondary">No products yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <a key={product.id} href={`/marketplace/${product.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="bg-gradient-to-br from-ocean-blue/10 to-ocean-green/10 h-48 flex items-center justify-center">
                        <Package className="h-12 w-12 text-ocean-blue/30" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-ocean-navy mb-1 group-hover:text-ocean-blue transition-colors line-clamp-2">{product.name}</h3>
                      <span className="text-lg font-bold text-ocean-green">₹{product.discount_price || product.price}</span>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
