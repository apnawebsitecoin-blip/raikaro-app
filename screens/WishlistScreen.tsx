import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  RefreshControl, ActivityIndicator, Alert, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, ShoppingBag } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { WishlistWithProduct, Product } from '../lib/types';
import ProductCard from '../components/ProductCard';
import GuestPrompt from '../components/GuestPrompt';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

type Props = { navigation: NativeStackNavigationProp<any> };

export default function WishlistScreen({ navigation }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [items, setItems] = useState<WishlistWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('wishlists')
      .select('id, product_id, products(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setItems(data as unknown as WishlistWithProduct[]);
  }, [userId]);

  useEffect(() => {
    fetchWishlist().finally(() => setLoading(false));
  }, [fetchWishlist]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  }, [fetchWishlist]);

  const handleRemove = (item: WishlistWithProduct) => {
    Alert.alert('Remove from Wishlist', `Remove "${item.products.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('wishlists').delete().eq('id', item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        },
      },
    ]);
  };

  const goToProduct = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  if (loading) {
    return (
      <SafeAreaView style={s.centered}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </SafeAreaView>
    );
  }

  if (!userId) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: '#fff' }]} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <GuestPrompt
            title="My Wishlist"
            message="Sign in to save products to your wishlist and never lose track of deals you love."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={s.emptyContainer}>
          <Heart size={64} color="#E5E7EB" />
          <Text style={s.emptyTitle}>{t('wishlist_empty_title')}</Text>
          <Text style={s.emptySubtitle}>{t('wishlist_empty_subtitle')}</Text>
          <Pressable
            style={[s.browseBtn, { backgroundColor: colors.indigo }]}
            onPress={() => navigation.getParent()?.navigate('Deals')}
          >
            <ShoppingBag size={16} color="#fff" />
            <Text style={s.browseBtnText}>{t('wishlist_browse_btn')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={s.columnWrapper}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo} />}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH }}>
            <ProductCard product={item.products} onPress={goToProduct} />
            <Pressable style={s.removeBtn} onPress={() => handleRemove(item)}>
              <Heart size={14} color="#EF4444" fill="#EF4444" />
              <Text style={s.removeBtnText}>{t('wishlist_remove')}</Text>
            </Pressable>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#F9FAFB' },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:          { padding: 16, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 0 },
  emptyContainer:{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle:    { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  browseBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  removeBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, marginTop: -8, marginBottom: 12 },
  removeBtnText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
});
