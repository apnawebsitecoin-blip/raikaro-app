import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, RefreshControl,
  Pressable, ActivityIndicator, StatusBar, TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell, Menu, Wallet, ShoppingCart, ChevronRight,
  Smartphone, Shirt, Home as HomeIcon, Sparkles,
  Dumbbell, BookOpen, ShoppingBag, UtensilsCrossed, Plane,
  Ticket, Copy, CheckCheck, Tag, PenLine,
} from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

import { supabase } from '../lib/supabase';
import { getRecentlyViewedIds } from '../lib/recentlyViewed';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Product, Coupon, HomeBanner } from '../lib/types';
import ProductCard from '../components/ProductCard';
import EarningStoryAnimation from '../components/EarningStoryAnimation';
import AppDrawer from '../components/AppDrawer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INDIGO = '#4F46E5';

const PLATFORM_COLORS: Record<string, { bg: string; imgBg: string; text: string; cashback: string; shoppers: string }> = {
  Amazon:   { bg: '#FEF9EC', imgBg: '#FEF3C7', text: '#92400E', cashback: 'Up to 8%',  shoppers: '3.2K+ shopped' },
  Flipkart: { bg: '#EFF6FF', imgBg: '#DBEAFE', text: '#1E40AF', cashback: 'Up to 6%',  shoppers: '4.1K+ shopped' },
  Meesho:   { bg: '#FAF5FF', imgBg: '#EDE9FE', text: '#7C3AED', cashback: 'Up to 10%', shoppers: '2.7K+ shopped' },
  Myntra:   { bg: '#FFF1F2', imgBg: '#FFE4E6', text: '#BE123C', cashback: 'Up to 7%',  shoppers: '1.9K+ shopped' },
};

const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  Electronics: { bg: '#DBEAFE', icon: '#1D4ED8' },
  Fashion:     { bg: '#FCE7F3', icon: '#DB2777' },
  Home:        { bg: '#D1FAE5', icon: '#059669' },
  Beauty:      { bg: '#EDE9FE', icon: '#7C3AED' },
  Sports:      { bg: '#FED7AA', icon: '#EA580C' },
  Books:       { bg: '#FEF3C7', icon: '#D97706' },
  Food:        { bg: '#CCFBF1', icon: '#0D9488' },
  Travel:      { bg: '#E0F2FE', icon: '#0284C7' },
};
const CAT_PALETTE = [
  { bg: '#DBEAFE', icon: '#1D4ED8' },
  { bg: '#FCE7F3', icon: '#DB2777' },
  { bg: '#D1FAE5', icon: '#059669' },
  { bg: '#FEF3C7', icon: '#D97706' },
  { bg: '#EDE9FE', icon: '#7C3AED' },
  { bg: '#CCFBF1', icon: '#0D9488' },
];

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

// ── Admin Banner Carousel ──────────────────────────────────────────────────────
import { Image, Linking } from 'react-native';

function AdminBannerCarousel({ banners }: { banners: HomeBanner[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const CARD_W = SCREEN_WIDTH - 32;

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      setActiveIdx((i) => {
        const next = (i + 1) % banners.length;
        flatRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      <FlatList
        ref={flatRef}
        data={banners}
        keyExtractor={(b) => b.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={banners.length > 1}
        onMomentumScrollEnd={(e) => {
          setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 32)));
        }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.link_url && Linking.openURL(item.link_url)}
            style={{ width: CARD_W, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1E1B4B', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={{ width: CARD_W, height: 160 }} resizeMode="cover" />
            ) : (
              <View style={{ width: CARD_W, height: 160, backgroundColor: INDIGO, alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={40} color="rgba(255,255,255,0.2)" />
              </View>
            )}
            {(item.title || item.subtitle) && (
              <View style={{ padding: 14 }}>
                {item.title && <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{item.title}</Text>}
                {item.subtitle && <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{item.subtitle}</Text>}
              </View>
            )}
          </Pressable>
        )}
      />
      {banners.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 5 }}>
          {banners.map((_, i) => (
            <View key={i} style={{ width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === activeIdx ? INDIGO : '#D1D5DB' }} />
          ))}
        </View>
      )}
    </View>
  );
}

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
            <View style={{ width: CARD_W, backgroundColor: '#EEF2FF', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#DDE3FF' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                {item.category ? (
                  <View style={{ backgroundColor: INDIGO, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>{item.category.toUpperCase()}</Text>
                  </View>
                ) : <View />}
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#6366F1', opacity: 0.7 }}>Limited offer</Text>
              </View>
              <Text style={{ fontSize: 30, fontWeight: '900', color: INDIGO, letterSpacing: -1, marginBottom: 2 }}>{discountText}</Text>
              <Text style={{ fontSize: 13, color: '#4338CA', marginBottom: 16, lineHeight: 19, opacity: 0.85 }} numberOfLines={2}>{item.title}</Text>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#C7D2FE', borderStyle: 'dashed' }}
                onPress={() => handleCopy(item.code)}
              >
                <Text style={{ fontSize: 16, fontWeight: '800', color: INDIGO, letterSpacing: 2 }}>{item.code}</Text>
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
  const { colors } = useTheme();
  const userId = session?.user.id;

  const [featured, setFeatured] = useState<Product[]>([]);
  const [all, setAll] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [homeBanners, setHomeBanners] = useState<HomeBanner[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    const [featuredRes, allRes, couponsRes, bannersRes] = await Promise.all([
      supabase.from('products').select('*').or('is_featured.eq.true,is_sponsored.eq.true').order('created_at', { ascending: false }).limit(10),
      supabase.from('products').select('*').order('created_at', { ascending: false }).limit(60),
      supabase.from('coupons').select('*').eq('is_active', true).order('discount_value', { ascending: false }).limit(10),
      supabase.from('home_banners').select('*').eq('is_active', true).order('display_order', { ascending: true }).limit(8),
    ]);

    if (featuredRes.data) setFeatured(featuredRes.data as Product[]);
    if (allRes.data) {
      const products = allRes.data as Product[];
      setAll(products);
      const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
      setCategories(cats);
    }
    if (couponsRes.data) setCoupons(couponsRes.data as Coupon[]);
    if (bannersRes.data) setHomeBanners(bannersRes.data as HomeBanner[]);

    if (userId) {
      const notifRes = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false);
      setUnreadCount(notifRes.count ?? 0);
    }
  }, [userId]);

  const loadRecentlyViewed = useCallback(async () => {
    const ids = await getRecentlyViewedIds();
    if (ids.length === 0) { setRecentlyViewed([]); return; }
    const { data } = await supabase.from('products').select('*').in('id', ids);
    if (data) {
      const map = new Map((data as Product[]).map((p) => [p.id, p]));
      setRecentlyViewed(ids.map((id) => map.get(id)).filter(Boolean) as Product[]);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    loadRecentlyViewed();
  }, [fetchData, loadRecentlyViewed]);

  useFocusEffect(useCallback(() => { loadRecentlyViewed(); }, [loadRecentlyViewed]));

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={colors.statusBar} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.indigo} />
        </View>
      </SafeAreaView>
    );
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    // SafeAreaView bg = indigo so the status-bar area strip is also branded
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.indigo }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.indigo} />

      {/* Header — pinned above the scroll, always indigo */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 11,
        backgroundColor: colors.indigo,
      }}>
        {/* Left — hamburger + wallet icon mark + split-color wordmark */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable hitSlop={12} onPress={() => setDrawerOpen(true)}>
            <Menu size={22} color="#fff" />
          </Pressable>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={14} color={colors.indigo} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>
            <Text style={{ color: '#fff' }}>Rai</Text>
            <Text style={{ color: colors.amber }}>karo</Text>
          </Text>
        </View>

        {/* Right — Bell for logged-in users; empty for guests (Sign In is in the drawer) */}
        {session && (
          <Pressable
            hitSlop={12}
            onPress={() => navigation.navigate('Notifications')}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Bell size={18} color="#fff" />
            {unreadCount > 0 && (
              <View style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: colors.indigo }} />
            )}
          </Pressable>
        )}
      </View>

      {/* Body — white background below header */}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={INDIGO} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >

        {/* Search bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16, marginTop: 16, marginBottom: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.borderStrong, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}>
          <ShoppingBag size={16} color={colors.textMuted} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: colors.text }}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Sections shown only when not searching */}
        {!isSearching && (
          <>
            {/* Admin-controlled banners (from home_banners table) */}
            <AdminBannerCarousel banners={homeBanners} />

            {/* Coupon carousel */}
            <HeroBanner coupons={coupons.slice(0, 5)} />

            {/* Platform cashback cards */}
            {platforms.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: 16, marginBottom: 12 }}>Shop & Earn Cashback</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                  {platforms.map((platform) => {
                    const pc = PLATFORM_COLORS[platform] ?? { bg: '#F8F9FB', imgBg: '#F3F4F6', text: '#374151', cashback: 'Cashback', shoppers: '1K+ shopped' };
                    return (
                      <Pressable
                        key={platform}
                        onPress={() => handlePlatformShopNow(platform)}
                        style={{ width: 172, borderRadius: 16, backgroundColor: colors.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}
                      >
                        {/* Image area */}
                        <View style={{ height: 100, backgroundColor: pc.imgBg, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 52, fontWeight: '900', color: pc.text, opacity: 0.12, letterSpacing: -2 }}>{platform}</Text>
                          {/* Platform name badge — top-left */}
                          <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: pc.text }}>{platform}</Text>
                          </View>
                        </View>
                        {/* Content */}
                        <View style={{ padding: 12 }}>
                          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>{pc.cashback}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSub, marginBottom: 6 }}>Cashback</Text>
                          {/* Social proof */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                            <ShoppingCart size={11} color={colors.textMuted} />
                            <Text style={{ fontSize: 11, color: colors.textMuted }}>{pc.shoppers}</Text>
                          </View>
                          {/* Shop Now inline button */}
                          <Pressable
                            onPress={() => handlePlatformShopNow(platform)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', backgroundColor: pc.imgBg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: pc.text }}>Shop Now</Text>
                            <ChevronRight size={12} color={pc.text} />
                          </Pressable>
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
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Categories</Text>
                  <Pressable
                    onPress={() => navigation.getParent()?.navigate('Deals')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}
                  >
                    <Tag size={12} color="#D97706" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>Offers Hub</Text>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {/* All — indigo */}
                  <Pressable onPress={() => setSelectedCategory(null)} style={{ alignItems: 'center', marginRight: 20 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: selectedCategory === null ? colors.indigo : colors.indigoMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <ShoppingBag size={22} color={selectedCategory === null ? '#fff' : colors.indigo} />
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: selectedCategory === null ? colors.indigo : colors.textSub }}>All</Text>
                  </Pressable>
                  {categories.map((cat, idx) => {
                    const Icon = CATEGORY_MAP[cat] ?? ShoppingBag;
                    const active = selectedCategory === cat;
                    const palette = CATEGORY_COLORS[cat] ?? CAT_PALETTE[idx % CAT_PALETTE.length];
                    return (
                      <Pressable key={cat} onPress={() => setSelectedCategory(active ? null : cat)} style={{ alignItems: 'center', marginRight: 20 }}>
                        <View style={{
                          width: 56, height: 56, borderRadius: 28,
                          backgroundColor: active ? palette.icon : palette.bg,
                          alignItems: 'center', justifyContent: 'center', marginBottom: 6,
                          shadowColor: palette.icon, shadowOpacity: active ? 0.3 : 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: active ? 4 : 1,
                        }}>
                          <Icon size={22} color={active ? '#fff' : palette.icon} />
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: active ? palette.icon : colors.textSub }} numberOfLines={1}>{cat}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Earning Story Animation */}
            <View style={{ marginHorizontal: 16, marginBottom: 24, backgroundColor: colors.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: colors.borderStrong, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 4 }}>How It Works</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: 12 }}>Shop, review, earn — it's that simple</Text>
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
                <View key={cat} style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, paddingHorizontal: 16, marginBottom: 10 }}>
                    Cashback on {cat}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                    {plats.map((p) => {
                      const s = PLATFORM_COLORS[p] ?? { bg: '#F3F4F6', imgBg: '#E5E7EB', text: '#374151', cashback: 'Cashback', shoppers: '1K+ shopped' };
                      return (
                        <Pressable
                          key={p}
                          onPress={() => handlePlatformShopNow(p)}
                          style={{ backgroundColor: s.bg, borderRadius: 14, padding: 14, width: 138, borderWidth: 1, borderColor: s.text + '18', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '800', color: s.text, marginBottom: 2 }}>{p}</Text>
                          <Text style={{ fontSize: 11, color: s.text, opacity: 0.75, marginBottom: 10 }} numberOfLines={1}>{s.cashback} cashback</Text>
                          <View style={{ backgroundColor: s.text, borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Shop Now</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}

            {/* Top Deals horizontal */}
            {featured.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: 16, marginBottom: 12 }}>🔥 Top Deals</Text>
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

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: 16, marginBottom: 12 }}>Recently Viewed</Text>
                <FlatList
                  data={recentlyViewed}
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

        {/* Products preview */}
        {!isSearching && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
                {selectedCategory ?? 'All Products'}
                <Text style={{ fontSize: 13, fontWeight: '400', color: colors.textMuted }}>  ({filteredProducts.length})</Text>
              </Text>
              <Pressable
                onPress={() => navigation.getParent()?.navigate('Deals')}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: colors.amberMuted }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.amber }}>View All →</Text>
              </Pressable>
            </View>
            {filteredProducts.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                <ShoppingBag size={48} color={colors.textMuted} />
                <Text style={{ color: colors.textSub, marginTop: 12, fontSize: 15 }}>No products found</Text>
              </View>
            ) : (
              <FlatList
                data={filteredProducts.slice(0, 8)}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                renderItem={({ item }) => <ProductCard product={item} onPress={goToDetail} featured />}
              />
            )}
          </>
        )}
        {isSearching && (
          <>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: 16, marginBottom: 12 }}>
              Results for "{searchQuery.trim()}"
              <Text style={{ fontSize: 13, fontWeight: '400', color: colors.textMuted }}>  ({filteredProducts.length})</Text>
            </Text>
            {filteredProducts.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                <ShoppingBag size={48} color={colors.textMuted} />
                <Text style={{ color: colors.textSub, marginTop: 12, fontSize: 15 }}>No products found</Text>
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                renderItem={({ item }) => <ProductCard product={item} onPress={goToDetail} featured />}
              />
            )}
          </>
        )}
      </ScrollView>
      </View>

      <AppDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}
