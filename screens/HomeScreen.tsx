import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, RefreshControl,
  Pressable, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Smartphone, Shirt, Home as HomeIcon, Sparkles, Dumbbell, BookOpen, ShoppingBag, UtensilsCrossed, Plane } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';

const INDIGO = '#4F46E5';

const CATEGORY_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Electronics: Smartphone,
  Fashion: Shirt,
  Home: HomeIcon,
  Beauty: Sparkles,
  Sports: Dumbbell,
  Books: BookOpen,
  Food: UtensilsCrossed,
  Travel: Plane,
};

type Props = { navigation: NativeStackNavigationProp<any> };

export default function HomeScreen({ navigation }: Props) {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [all, setAll] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [featuredRes, allRes] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .or('is_featured.eq.true,is_sponsored.eq.true')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60),
    ]);

    if (featuredRes.data) setFeatured(featuredRes.data as Product[]);
    if (allRes.data) {
      const products = allRes.data as Product[];
      setAll(products);
      const cats = Array.from(
        new Set(products.map((p) => p.category).filter(Boolean))
      ) as string[];
      setCategories(cats);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filteredProducts = selectedCategory
    ? all.filter((p) => p.category === selectedCategory)
    : all;

  const goToDetail = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const ListHeader = (
    <View>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: INDIGO, letterSpacing: -0.5 }}>Raikaro</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Best deals, just for you</Text>
        </View>
        <Pressable
          hitSlop={12}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}
        >
          <Bell size={20} color={INDIGO} />
        </Pressable>
      </View>

      {/* Featured section */}
      {featured.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 12 }}>
            ⚡ Featured Deals
          </Text>
          <FlatList
            data={featured}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={goToDetail} featured />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 12 }}>
            Categories
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <Pressable
              onPress={() => setSelectedCategory(null)}
              style={{
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: selectedCategory === null ? INDIGO : '#EEF2FF',
                alignItems: 'center', justifyContent: 'center', marginBottom: 6,
              }}>
                <ShoppingBag size={22} color={selectedCategory === null ? '#fff' : INDIGO} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: selectedCategory === null ? INDIGO : '#6B7280' }}>All</Text>
            </Pressable>

            {categories.map((cat) => {
              const Icon = CATEGORY_MAP[cat] ?? ShoppingBag;
              const active = selectedCategory === cat;
              return (
                <Pressable key={cat} onPress={() => setSelectedCategory(active ? null : cat)} style={{ alignItems: 'center', marginRight: 16 }}>
                  <View style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: active ? INDIGO : '#EEF2FF',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
                  }}>
                    <Icon size={22} color={active ? '#fff' : INDIGO} />
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: active ? INDIGO : '#6B7280' }} numberOfLines={1}>{cat}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Section title */}
      <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 12 }}>
        {selectedCategory ? `${selectedCategory}` : 'All Products'}
        <Text style={{ fontSize: 13, fontWeight: '400', color: '#9CA3AF' }}>  ({filteredProducts.length})</Text>
      </Text>
    </View>
  );

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 16, justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={goToDetail} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={INDIGO} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <ShoppingBag size={48} color="#D1D5DB" />
            <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 15 }}>No products found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
