import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, Pressable,
  TextInput, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ShoppingBag, Tag, SlidersHorizontal } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
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
      setProducts(prods);
      const cats = Array.from(new Set(prods.map((p) => p.category).filter(Boolean))) as string[];
      const plats = Array.from(new Set(prods.map((p) => p.platform).filter(Boolean))) as string[];
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
    const matchPlat = selectedPlatform ? p.platform === selectedPlatform : true;
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={INDIGO} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Tag size={20} color={INDIGO} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>Deals</Text>
        </View>
        <Text style={{ fontSize: 13, color: '#6B7280' }}>{filtered.length} products</Text>
      </View>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', gap: 8 }}>
        <Search size={16} color="#9CA3AF" />
        <TextInput
          style={{ flex: 1, fontSize: 14, color: '#111827' }}
          placeholder="Search deals..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Text style={{ fontSize: 13, color: '#9CA3AF' }}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Platform filter */}
      {platforms.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 10 }}>
          <Pressable
            onPress={() => setSelectedPlatform(null)}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: selectedPlatform === null ? INDIGO : '#E5E7EB', backgroundColor: selectedPlatform === null ? '#EEF2FF' : '#fff' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: selectedPlatform === null ? INDIGO : '#6B7280' }}>All Platforms</Text>
          </Pressable>
          {platforms.map((p) => {
            const style = PLATFORM_COLORS[p] ?? { bg: '#F3F4F6', text: '#374151' };
            const active = selectedPlatform === p;
            return (
              <Pressable
                key={p}
                onPress={() => setSelectedPlatform(active ? null : p)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: active ? style.text : '#E5E7EB', backgroundColor: active ? style.bg : '#fff' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? style.text : '#6B7280' }}>{p}</Text>
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
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: selectedCategory === null ? INDIGO : '#E5E7EB', backgroundColor: selectedCategory === null ? INDIGO : '#fff' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: selectedCategory === null ? '#fff' : '#6B7280' }}>All</Text>
          </Pressable>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(active ? null : cat)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: active ? INDIGO : '#E5E7EB', backgroundColor: active ? INDIGO : '#fff' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6B7280' }}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Sectioned horizontal product lists */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={INDIGO} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {sections.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <ShoppingBag size={48} color="#D1D5DB" />
            <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 15 }}>No products found</Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{section.title}</Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{section.data.length}</Text>
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
