import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, Pressable,
  TextInput, ActivityIndicator, StatusBar, RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ShoppingBag, Tag } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../lib/theme';
import { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';

// ─── Platform brand tokens ────────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, {
  dot: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}> = {
  Amazon:   { dot: '#F59E0B', activeBg: '#FEF3C7', activeBorder: '#D97706', activeText: '#92400E' },
  Flipkart: { dot: '#3B82F6', activeBg: '#DBEAFE', activeBorder: '#2563EB', activeText: '#1E40AF' },
  Meesho:   { dot: '#A78BFA', activeBg: '#EDE9FE', activeBorder: '#7C3AED', activeText: '#6D28D9' },
  Myntra:   { dot: '#FB7185', activeBg: '#FFE4E6', activeBorder: '#E11D48', activeText: '#BE123C' },
};

// ─── Shared chip styles ───────────────────────────────────────────────────────
const CHIP_H = 36;
const CHIP_RADIUS = 18;
const CHIP_PX = 14;

function chipBase(colors: ThemeColors): object {
  return {
    height: CHIP_H,
    borderRadius: CHIP_RADIUS,
    paddingHorizontal: CHIP_PX,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    // inactive base
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    // lift shadow
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  };
}

// ─── FilterChip component ─────────────────────────────────────────────────────
type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
  dot?: string;
  activeBg?: string;
  activeBorder?: string;
  activeText?: string;
};

function FilterChip({
  label, active, onPress, colors,
  dot, activeBg, activeBorder, activeText,
}: FilterChipProps) {
  const base = chipBase(colors);
  const bg     = active ? (activeBg     ?? colors.indigoMuted) : colors.card;
  const border = active ? (activeBorder ?? colors.indigo)      : colors.borderStrong;
  const text   = active ? (activeText   ?? colors.indigo)      : colors.textSub;

  return (
    <Pressable
      onPress={onPress}
      style={[base, {
        backgroundColor: bg,
        borderColor: border,
        shadowColor: active ? border : '#000',
        shadowOpacity: active ? 0.15 : 0.07,
      }]}
    >
      {dot !== undefined && (
        <View style={{
          width: 7, height: 7, borderRadius: 3.5,
          backgroundColor: dot,
        }} />
      )}
      <Text style={{ fontSize: 13, fontWeight: '700', color: text, letterSpacing: 0.1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = { navigation: NativeStackNavigationProp<any>; route: any };

interface Section { title: string; data: Product[]; }

interface PriceRange { label: string; min: number; max: number; }
const PRICE_RANGES: PriceRange[] = [
  { label: 'Under ₹500', min: 0,    max: 500 },
  { label: '₹500–₹2K',  min: 500,  max: 2000 },
  { label: '₹2K–₹5K',   min: 2000, max: 5000 },
  { label: '₹5K+',      min: 5000, max: Infinity },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DealsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const initialPlatform: string | null = route.params?.filterPlatform ?? null;

  const [products,         setProducts]         = useState<Product[]>([]);
  const [categories,       setCategories]       = useState<string[]>([]);
  const [platforms,        setPlatforms]        = useState<string[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [search,           setSearch]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(initialPlatform);
  const [priceRange,       setPriceRange]       = useState<PriceRange | null>(null);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) {
      const prods = data as Product[];

      // Deduplicate by original_url
      const seen = new Set<string>();
      const deduped = prods.filter((p) => {
        if (seen.has(p.original_url)) return false;
        seen.add(p.original_url);
        return true;
      });
      setProducts(deduped);

      const cats = Array.from(new Set(deduped.map((p) => p.category).filter(Boolean))) as string[];

      // Case-insensitive platform dedup → canonical display name
      const platMap = new Map<string, string>();
      deduped.forEach((p) => {
        if (p.platform) {
          const key = p.platform.toLowerCase();
          if (!platMap.has(key)) {
            const canonical = Object.keys(PLATFORM_COLORS).find(
              (k) => k.toLowerCase() === key
            ) ?? (p.platform.charAt(0).toUpperCase() + p.platform.slice(1).toLowerCase());
            platMap.set(key, canonical);
          }
        }
      });

      setCategories(cats);
      setPlatforms(Array.from(platMap.values()));
    }
  }, []);

  useEffect(() => {
    fetchProducts().finally(() => setLoading(false));
  }, [fetchProducts]);

  useEffect(() => {
    if (route.params?.filterPlatform) setSelectedPlatform(route.params.filterPlatform);
  }, [route.params?.filterPlatform]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const goToDetail = (product: Product) => navigation.navigate('ProductDetail', { product });

  const filtered = products.filter((p) => {
    const matchSearch = search.trim() ? p.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchCat    = selectedCategory ? p.category === selectedCategory : true;
    const matchPlat   = selectedPlatform ? p.platform?.toLowerCase() === selectedPlatform.toLowerCase() : true;
    const matchPrice  = priceRange ? (p.price != null && p.price >= priceRange.min && p.price < priceRange.max) : true;
    return matchSearch && matchCat && matchPlat && matchPrice;
  });

  const sections: Section[] = (() => {
    if (selectedCategory || search.trim()) {
      return [{ title: selectedCategory ?? `Results for "${search}"`, data: filtered }];
    }
    const map: Record<string, Product[]> = {};
    filtered.forEach((p) => {
      const key = p.category ?? 'Other';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return Object.entries(map).map(([title, data]) => ({ title, data }));
  })();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.indigo} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Tag size={20} color={colors.indigo} />
          <Text style={[s.headerTitle, { color: colors.text }]}>Deals</Text>
        </View>
        <Text style={[s.headerCount, { color: colors.textSub }]}>{filtered.length} products</Text>
      </View>

      {/* Search bar */}
      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={[s.searchInput, { color: colors.text }]}
          placeholder="Search deals..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* ── Platform filter chips ── */}
      {platforms.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRow}
        >
          <FilterChip
            label="All Platforms"
            active={selectedPlatform === null}
            onPress={() => setSelectedPlatform(null)}
            colors={colors}
          />
          {platforms.map((p) => {
            const pc = PLATFORM_COLORS[p];
            return (
              <FilterChip
                key={p}
                label={p}
                active={selectedPlatform === p}
                onPress={() => setSelectedPlatform(selectedPlatform === p ? null : p)}
                colors={colors}
                dot={pc?.dot}
                activeBg={pc?.activeBg}
                activeBorder={pc?.activeBorder}
                activeText={pc?.activeText}
              />
            );
          })}
        </ScrollView>
      )}

      {/* ── Category filter chips ── */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRow}
        >
          <FilterChip
            label="All"
            active={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            colors={colors}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              colors={colors}
            />
          ))}
        </ScrollView>
      )}

      {/* ── Price range chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow}
      >
        {PRICE_RANGES.map((range) => (
          <FilterChip
            key={range.label}
            label={range.label}
            active={priceRange?.label === range.label}
            onPress={() => setPriceRange(priceRange?.label === range.label ? null : range)}
            colors={colors}
            activeBg="#FEF3C7"
            activeBorder="#D97706"
            activeText="#92400E"
          />
        ))}
      </ScrollView>

      {/* Sectioned product lists */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {sections.length === 0 ? (
          <View style={s.empty}>
            <ShoppingBag size={48} color={colors.textMuted} />
            <Text style={[s.emptyText, { color: colors.textSub }]}>No products found</Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={{ marginBottom: 24 }}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                <Text style={[s.sectionCount, { color: colors.textMuted }]}>{section.data.length}</Text>
              </View>
              <FlatList
                data={section.data}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                renderItem={({ item }) => <ProductCard product={item} onPress={goToDetail} featured />}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Layout styles (no colors here) ─────────────────────────────────────────
const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerCount: { fontSize: 13 },

  searchBar:   { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },

  chipRow:     { paddingHorizontal: 16, gap: 8, marginBottom: 10, alignItems: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '700' },
  sectionCount:  { fontSize: 12 },

  empty:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 12, fontSize: 15 },
});
