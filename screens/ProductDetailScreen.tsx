import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, FlatList, Image, Pressable,
  Linking, ActivityIndicator, Dimensions, Alert, StatusBar, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Heart, ExternalLink, ShoppingBag, ChevronLeft,
  Ticket, Copy, CheckCheck, Bell, PenLine, TrendingDown,
} from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Product, ProductImage, Coupon } from '../lib/types';
import { cleanProductTitle } from '../lib/utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INDIGO = '#4F46E5';

const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  Amazon:   { bg: '#FEF3C7', text: '#92400E' },
  Flipkart: { bg: '#DBEAFE', text: '#1E40AF' },
  Meesho:   { bg: '#FCE7F3', text: '#9D174D' },
  Myntra:   { bg: '#FEE2E2', text: '#991B1B' },
};

// ── Price History Bar Chart (no external library) ────────────────────────────

interface PricePoint { price: number; recorded_at: string; }

function PriceHistoryChart({ productId, currentPrice }: { productId: string; currentPrice: number | null }) {
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('price_history')
      .select('price, recorded_at')
      .eq('product_id', productId)
      .order('recorded_at', { ascending: true })
      .limit(12)
      .then(({ data }) => {
        if (data) setHistory(data as PricePoint[]);
        setLoading(false);
      });
  }, [productId]);

  if (loading || history.length === 0) return null;

  const allPrices = history.map((h) => h.price);
  if (currentPrice != null) allPrices.push(currentPrice);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const CHART_H = 68;

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <TrendingDown size={16} color={INDIGO} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Price History</Text>
      </View>
      {/* Bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_H + 16, paddingHorizontal: 0, gap: 3 }}>
        {history.map((point, i) => {
          const h = Math.max(4, ((point.price - minP) / range) * CHART_H);
          const isFirst = i === 0;
          const isLast = i === history.length - 1;
          const isMin = point.price === minP;
          const isMax = point.price === maxP;
          const bg = isMin ? '#059669' : isMax ? '#EF4444' : isLast ? INDIGO : '#C7D2FE';
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_H + 16 }}>
              <View style={{ width: '80%', height: h, backgroundColor: bg, borderRadius: 3 }} />
              {(isFirst || isLast) && (
                <Text style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }} numberOfLines={1}>
                  {new Date(point.recorded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      {/* Min/max legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>↓ Low ₹{minP.toLocaleString('en-IN')}</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>↑ High ₹{maxP.toLocaleString('en-IN')}</Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

type Props = { navigation: NativeStackNavigationProp<any>; route: any };

export default function ProductDetailScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { product }: { product: Product } = route.params;

  const cleanName = cleanProductTitle(product.name);

  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponCopied, setCouponCopied] = useState(false);
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);

  const platformStyle = product.platform ? PLATFORM_COLORS[product.platform] : null;

  // Fetch coupon
  useEffect(() => {
    supabase
      .from('coupons')
      .select('*')
      .eq('product_id', product.id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => { if (data) setCoupon(data as Coupon); });
  }, [product.id]);

  // Fetch gallery images
  useEffect(() => {
    async function fetchImages() {
      const { data } = await supabase
        .from('product_images')
        .select('image_url, display_order')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });
      const galleryImages: string[] = data?.map((r: Pick<ProductImage, 'image_url'>) => r.image_url) ?? [];
      setImages(galleryImages.length === 0 && product.image_url ? [product.image_url] : galleryImages);
      setLoadingImages(false);
    }
    fetchImages();
  }, [product.id, product.image_url]);

  // Fetch existing price alert
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('price_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', product.id)
      .maybeSingle()
      .then(({ data }) => setAlertEnabled(!!data));
  }, [userId, product.id]);

  const handleAlertToggle = async (value: boolean) => {
    if (!userId || alertLoading) return;
    setAlertLoading(true);
    if (value) {
      await supabase
        .from('price_alerts')
        .upsert(
          { user_id: userId, product_id: product.id, target_price: product.price },
          { onConflict: 'user_id,product_id', ignoreDuplicates: true }
        );
    } else {
      await supabase
        .from('price_alerts')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', product.id);
    }
    setAlertEnabled(value);
    setAlertLoading(false);
  };

  const handleBuyNow = async () => {
    const supported = await Linking.canOpenURL(product.original_url);
    if (supported) Linking.openURL(product.original_url);
    else Alert.alert('Error', 'Cannot open this URL');
  };

  const onScroll = (e: any) => {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Custom Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff', gap: 10 }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color="#111827" />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
          {cleanName}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={{ backgroundColor: '#F9FAFB' }}>
          {loadingImages ? (
            <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={INDIGO} />
            </View>
          ) : images.length > 0 ? (
            <>
              <FlatList
                data={images}
                keyExtractor={(_, i) => String(i)}
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onScroll={onScroll} scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85 }} resizeMode="contain" />
                )}
              />
              {images.length > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 12, gap: 6 }}>
                  {images.map((_, i) => (
                    <View key={i} style={{ width: i === activeIndex ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === activeIndex ? INDIGO : '#D1D5DB' }} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85, alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={64} color="#D1D5DB" />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={{ padding: 20 }}>
          {/* Platform badge */}
          {product.platform && platformStyle && (
            <View style={{ backgroundColor: platformStyle.bg, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, marginBottom: 10 }}>
              <Text style={{ color: platformStyle.text, fontSize: 12, fontWeight: '700' }}>{product.platform}</Text>
            </View>
          )}

          {/* Clean title */}
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', lineHeight: 28, marginBottom: 8 }}>
            {cleanName}
          </Text>

          {/* Price */}
          {product.price != null && (
            <Text style={{ fontSize: 28, fontWeight: '800', color: INDIGO, marginBottom: 12 }}>
              ₹{product.price.toLocaleString('en-IN')}
            </Text>
          )}

          {/* Price Drop Alert toggle */}
          {userId && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: alertEnabled ? '#EEF2FF' : '#F9FAFB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, borderWidth: 1, borderColor: alertEnabled ? '#C7D2FE' : '#E5E7EB' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Bell size={16} color={alertEnabled ? INDIGO : '#9CA3AF'} />
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: alertEnabled ? INDIGO : '#374151' }}>Notify me on price drop</Text>
                  {alertEnabled && <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>We'll alert you when price falls</Text>}
                </View>
              </View>
              {alertLoading ? (
                <ActivityIndicator size="small" color={INDIGO} />
              ) : (
                <Switch
                  value={alertEnabled}
                  onValueChange={handleAlertToggle}
                  trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                  thumbColor={alertEnabled ? INDIGO : '#9CA3AF'}
                />
              )}
            </View>
          )}

          {/* Category */}
          {product.category && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>Category: </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{product.category}</Text>
            </View>
          )}

          {/* Coupon */}
          {coupon && (
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#A7F3D0' }}
              onPress={async () => {
                await Clipboard.setStringAsync(coupon.code);
                setCouponCopied(true);
                setTimeout(() => setCouponCopied(false), 2000);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Ticket size={18} color="#059669" />
                <View>
                  <Text style={{ fontSize: 12, color: '#059669', fontWeight: '600' }}>Coupon Available</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#065F46', letterSpacing: 1 }}>{coupon.code}</Text>
                </View>
              </View>
              {couponCopied ? <CheckCheck size={18} color="#059669" /> : <Copy size={18} color="#059669" />}
            </Pressable>
          )}

          {/* Price History Chart */}
          <PriceHistoryChart productId={product.id} currentPrice={product.price} />

          {/* Review & Earn CTA */}
          <Pressable
            onPress={() => navigation.navigate('WriteReview', { product })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#C7D2FE' }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: INDIGO, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PenLine size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: INDIGO }}>Review likho, paisa kamao!</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Ek honest review likhne par reward milega</Text>
            </View>
            <Text style={{ fontSize: 18, color: INDIGO }}>→</Text>
          </Pressable>

          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 }} />

          <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>
            Tap "Buy Now" to get the best price on {product.platform ?? 'the store'}. Raikaro earns a small affiliate commission at no extra cost to you.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#fff' }}>
        {/* Wishlist */}
        <Pressable
          onPress={() => setWishlisted((w) => !w)}
          style={{ width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: wishlisted ? '#EF4444' : '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: wishlisted ? '#FEF2F2' : '#fff' }}
        >
          <Heart size={22} color={wishlisted ? '#EF4444' : '#9CA3AF'} fill={wishlisted ? '#EF4444' : 'transparent'} />
        </Pressable>

        {/* Buy Now */}
        <Pressable
          onPress={handleBuyNow}
          style={{ flex: 1, height: 52, borderRadius: 16, backgroundColor: INDIGO, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Buy Now</Text>
          <ExternalLink size={16} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
