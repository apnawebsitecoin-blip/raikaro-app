import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, RefreshControl,
  Pressable, ActivityIndicator, StatusBar, TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell, Menu, HelpCircle,
  Smartphone, Shirt, Home as HomeIcon, Sparkles,
  Dumbbell, BookOpen, ShoppingBag, UtensilsCrossed, Plane,
  Ticket, Copy, CheckCheck, Tag, PenLine,
} from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Product, Coupon } from '../lib/types';
import ProductCard from '../components/ProductCard';
import EarningStoryAnimation from '../components/EarningStoryAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INDIGO = '#4F46E5';

const PLATFORM_COLORS: Record<string, { bg: string; text: string; cashback: string }> = {
  Amazon:   { bg: '#FEF3C7', text: '#92400E', cashback: 'Up to 8% cashback' },
  Flipkart: { bg: '#DBEAFE', text: '#1E40AF', cashback: 'Up to 6% cashback' },
  Meesho:   { bg: '#FCE7F3', text: '#9D174D', cashback: 'Up to 10% cashback' },
  Myntra:   { bg: '#FEE2E2', text: '#991B1B', cashback: 'Up to 7% cashback' },
};

const CATEGORY_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Electronics: Smartphone,
  Fashion:     Shirt,
  Home:        HomeIcon,
  Beauty:      Sparkles,
  Sports:      Dumbbell,
  Books:       BookOpen,
  Food:        UtensilsCrossed,
  Travel:      Plane,
};

type Props = { navigation: NativeStackNavigationProp<any> };

// ── Hero Carousel ──────────────────────────────────────────────────────────────

function HeroBanner({ coupons }: { coupons: Coupon[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const [copied, setCopied] = useState(false);
  const CARD_W = SCREEN_WIDTH - 32;

  useEffect(() => {
    if (coupons.length < 2) return;
    const id = setInterval(() => {
      setActiveIdx((i) => {
        const next = (i + 1) % coupons.length;
        flatRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [coupons.length]);

  if (coupons.length === 0) return null;

  const handleCopy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <FlatList
        ref={flatRef}
        data={coupons}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / CARD_W));
        }}
        getItemLayout={(_, index) => ({ length: CARD_W, offset: CARD_W * index, index })}
        renderItem={({ item }) => {
          const discountText = item.discount_type === 'percent'
            ? `${item.discount_value}% OFF`
            : `₹${item.discount_value} FLAT OFF`;
          return (
            <View style={{ width: CARD_W, backgroundColor: '#EEF2FF', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#C7D2FE' }}>
              {item.category && (
                <View style={{ backgroundColor: INDIGO, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{item.category}</Text>
                </View>
              )}
              <Text style={{ fontSize: 28, fontWeight: '900', color: INDIGO, marginBottom: 4 }}>{discountText}</Text>
              <Text style={{ fontSize: 14, color: '#374151', marginBottom: 14 }} numberOfLines={2}>{item.title}</Text>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderColor: '#A5B4FC', borderStyle: 'dashed' }}
                onPress={() => handleCopy(item.code)}
              >
                <Text style={{ fontSize: 15, fontWeight: '800', color: INDIGO, letterSpacing: 1.5 }}>{item.code}</Text>
                {copied ? <CheckCheck size={16} color="#059669" /> : <Copy size={16} color={INDIGO} />}
              </Pressable>
            </View>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
      {coupons.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 }}>
          {coupons.map((_, i) => (
            <View key={i} style={{ width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === activeIdx ? INDIGO : '#D1D5DB' }} />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [featured, setFeatured] = useState<Product[]>([]);
  const [all, setAll] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    const [featuredRes, allRes, couponsRes] = await Promise.all([
      supabase.from('products').select('*').or('is_featured.eq.true,is_sponsored.eq.true').order('created_at', { ascending: false }).limit(10),
      supabase.from('products').select('*').order('created_at', { ascending: false }).limit(60),
      supabase.from('coupons').select('*').eq('is_active', true).order('discount_value', { ascending: false }).limit(10),
    ]);

    if (featuredRes.data) setFeatured(featuredRes.data as Product[]);
    if (allRes.data) {
      const products = allRes.data as Product[];
      setAll(products);
      const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
      setCategories(cats);
    }
    if (couponsRes.data) setCoupons(couponsRes.data as Coupon[]);

    if (userId) {
      const notifRes = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false);
      setUnreadCount(notifRes.count ?? 0);
    }
  }, [userId]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const goToDetail = (product: Product) => navigation.navigate('ProductDetail', { product });

  const filteredProducts = all.filter((p) => {
    const matchCat = selectedCategory ? p.category === selectedCategory : true;
    const matchSearch = searchQuery.trim()
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchCat && matchSearch;
  });

  const platforms = Array.from(new Set(all.map((p) => p.platform).filter(Boolean))) as string[];

  const catPlatformMap: Record<string, string[]> = {};
  all.forEach((p) => {
    if (p.category && p.platform) {
      if (!catPlatformMap[p.category]) catPlatformMap[p.category] = [];
      if (!catPlatformMap[p.category].includes(p.platform)) {
        catPlatformMap[p.category].push(p.platform);
      }
    }
  });

  const handlePlatformShopNow = (platform: string) => {
    navigation.getParent()?.navigate('Deals', { screen: 'DealsMain', params: { filterPlatform: platform } });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={INDIGO} />
        </View>
      </SafeAreaView>
    );
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={INDIGO} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <Pressable hitSlop={12} onPress={() => {}}>
            <Menu size={24} color="#374151" />
          </Pressable>
          <Text style={{ fontSize: 22, fontWeight: '900', color: INDIGO, letterSpacing: -0.5 }}>Raikaro</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable hitSlop={12} onPress={() => {}}>
              <HelpCircle size={22} color="#6B7280" />
            </Pressable>
            <Pressable
              hitSlop={12}
              onPress={() => navigation.navigate('Notifications')}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={18} color={INDIGO} />
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#EEF2FF' }} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', gap: 8 }}>
          <ShoppingBag size={16} color="#9CA3AF" />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: '#111827' }}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Sections shown only when not searching */}
        {!isSearching && (
          <>
            {/* Hero Carousel */}
            <HeroBanner coupons={coupons.slice(0, 5)} />

            {/* Platform cashback cards */}
            {platforms.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 12 }}>Shop & Earn Cashback</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                  {platforms.map((platform) => {
                    const style = PLATFORM_COLORS[platform] ?? { bg: '#F3F4F6', text: '#374151', cashback: 'Cashback available' };
                    return (
                      <Pressable
                        key={platform}
                        onPress={() => handlePlatformShopNow(platform)}
                        style={{ backgroundColor: style.bg, borderRadius: 16, padding: 16, width: 140 }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: '800', color: style.text, marginBottom: 4 }}>{platform}</Text>
                        <Text style={{ fontSize: 11, color: style.text, opacity: 0.8, marginBottom: 12 }}>{style.cashback}</Text>
                        <View style={{ backgroundColor: style.text, borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Shop Now</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Category icons */}
            {categories.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>Categories</Text>
                  <Pressable
                    onPress={() => navigation.getParent()?.navigate('Deals')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}
                  >
                    <Tag size={12} color="#D97706" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>Offers Hub</Text>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  <Pressable onPress={() => setSelectedCategory(null)} style={{ alignItems: 'center', marginRight: 16 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: selectedCategory === null ? INDIGO : '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <ShoppingBag size={22} color={selectedCategory === null ? '#fff' : INDIGO} />
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: selectedCategory === null ? INDIGO : '#6B7280' }}>All</Text>
                  </Pressable>
                  {categories.map((cat) => {
                    const Icon = CATEGORY_MAP[cat] ?? ShoppingBag;
                    const active = selectedCategory === cat;
                    return (
                      <Pressable key={cat} onPress={() => setSelectedCategory(active ? null : cat)} style={{ alignItems: 'center', marginRight: 16 }}>
                        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: active ? INDIGO : '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                          <Icon size={22} color={active ? '#fff' : INDIGO} />
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: active ? INDIGO : '#6B7280' }} numberOfLines={1}>{cat}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Earning Story Animation */}
            <View style={{ marginHorizontal: 16, marginBottom: 24, backgroundColor: '#fff', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 4 }}>How It Works</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 12 }}>Shop, review, earn — it's that simple</Text>
              <EarningStoryAnimation />
            </View>

            {/* CTA: Likho Review, Kamao Paisa */}
            <Pressable
              onPress={() => navigation.navigate('WriteReview')}
              style={{ marginHorizontal: 16, marginBottom: 24, borderRadius: 18, overflow: 'hidden', backgroundColor: INDIGO, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}
            >
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PenLine size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 }}>Likho Honest Review</Text>
                <Text style={{ fontSize: 13, color: '#C7D2FE', lineHeight: 18 }}>Kamao Paisa — har verified review par reward milega!</Text>
              </View>
              <Text style={{ fontSize: 22, color: '#fff' }}>→</Text>
            </Pressable>

            {/* Category-wise cashback sections */}
            {categories.slice(0, 3).map((cat) => {
              const plats = catPlatformMap[cat] ?? [];
              if (!plats.length) return null;
              return (
                <View key={cat} style={{ marginBottom: 20, paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 }}>
                    Get Cashback on {cat} buys
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {plats.map((p) => {
                      const s = PLATFORM_COLORS[p] ?? { bg: '#F3F4F6', text: '#374151' };
                      return (
                        <View key={p} style={{ backgroundColor: s.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: s.text }}>{p}</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}

            {/* Top Deals horizontal */}
            {featured.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 12 }}>🔥 Top Deals</Text>
                <FlatList
                  data={featured}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  renderItem={({ item }) => <ProductCard product={item} onPress={goToDetail} featured />}
                />
              </View>
            )}
          </>
        )}

        {/* Products section */}
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 12 }}>
          {isSearching ? `Results for "${searchQuery.trim()}"` : (selectedCategory ?? 'All Products')}
          <Text style={{ fontSize: 13, fontWeight: '400', color: '#9CA3AF' }}>  ({filteredProducts.length})</Text>
        </Text>

        {filteredProducts.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <ShoppingBag size={48} color="#D1D5DB" />
            <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 15 }}>No products found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }) => <ProductCard product={item} onPress={goToDetail} featured />}
            scrollEnabled={true}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
