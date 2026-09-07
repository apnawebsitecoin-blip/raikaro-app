import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, Pressable,
  TextInput, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ShoppingBag, Tag, SlidersHorizontal } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';

const INDIGO = '#4F46E5';

const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  Amazon:   { bg: '#FEF3C7', text: '#92400E' },
  Flipkart: { bg: '#DBEAFE', text: '#1E40AF' },
  Meesho:   { bg: '#FCE7F3', text: '#9D174D' },
  Myntra:   { bg: '#FEE2E2', text: '#991B1B' },
};

type Props = { navigation: NativeStackNavigationProp<any>; route: any };

interface Section {
  title: string;
  data: Product[];
}

export default function DealsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const initialPlatform: string | null = route.params?.filterPlatform ?? null;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(initialPlatform);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) {
      const prods = data as Product[];

      // Deduplicate products by original_url
      const seen = new Set<string>();
      const deduped = prods.filter((p) => {
        if (seen.has(p.original_url)) return false;
        seen.add(p.original_url);
        return true;
      });
      setProducts(deduped);

      const cats = Array.from(new Set(deduped.map((p) => p.category).filter(Boolean))) as string[];

      // Deduplicate platforms case-insensitively
      const platMap = new Map<string, string>(); // lowercase -> canonical display name
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
      const plats = Array.from(platMap.values());

      setCategories(cats);
      setPlatforms(plats);
    }
  }, []);

  useEffect(() => {
    fetchProducts().finally(() => setLoading(false));
  }, [fetchProducts]);

  useEffect(() => {
    if (route.params?.filterPlatform) {
      setSelectedPlatform(route.params.filterPlatform);
    }
  }, [route.params?.filterPlatform]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const goToDetail = (product: Product) => navigation.navigate('ProductDetail', { product });

  const filtered = products.filter((p) => {
    const matchSearch = search.trim() ? p.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchCat = selectedCategory ? p.category === selectedCategory : true;
    const matchPlat = selectedPlatform
      ? p.platform?.toLowerCase() === selectedPlatform.toLowerCase()
      : true;
    return matchSearch && matchCat && matchPlat;
  });

  // Build sections: group by category if no category filter, else one section
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Tag size={20} color={colors.indigo} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Deals</Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.textSub }}>{filtered.length} products</Text>
      </View>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.borderStrong, gap: 8 }}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={{ flex: 1, fontSize: 14, color: colors.text }}
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

      {/* Platform filter */}
      {platforms.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 10 }}>
          <Pressable
            onPress={() => setSelectedPlatform(null)}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: selectedPlatform === null ? colors.indigo : colors.borderStrong, backgroundColor: selectedPlatform === null ? colors.indigoMuted : colors.card }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: selectedPlatform === null ? colors.indigo : colors.textSub }}>All Platforms</Text>
          </Pressable>
          {platforms.map((p) => {
            const style = PLATFORM_COLORS[p] ?? { bg: '#F3F4F6', text: '#374151' };
            const active = selectedPlatform === p;
            return (
              <Pressable
                key={p}
                onPress={() => setSelectedPlatform(active ? null : p)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: active ? style.text : colors.borderStrong, backgroundColor: active ? style.bg : colors.card }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? style.text : colors.textSub }}>{p}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Category filter */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
          <Pressable
            onPress={() => setSelectedCategory(null)}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: selectedCategory === null ? colors.indigo : colors.borderStrong, backgroundColor: selectedCategory === null ? colors.indigo : colors.card }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: selectedCategory === null ? '#fff' : colors.textSub }}>All</Text>
          </Pressable>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(active ? null : cat)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: active ? colors.indigo : colors.borderStrong, backgroundColor: active ? colors.indigo : colors.card }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : colors.textSub }}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Sectioned horizontal product lists */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {sections.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <ShoppingBag size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textSub, marginTop: 12, fontSize: 15 }}>No products found</Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{section.title}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{section.data.length}</Text>
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
