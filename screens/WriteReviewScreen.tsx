import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, StatusBar, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThumbsUp, ThumbsDown, Minus, Search, ShoppingBag } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Product, ReviewSentiment } from '../lib/types';

const INDIGO = '#4F46E5';

const SENTIMENTS: { value: ReviewSentiment; label: string; Icon: React.ComponentType<any>; color: string; bg: string }[] = [
  { value: 'positive', label: 'Positive', Icon: ThumbsUp,   color: '#059669', bg: '#ECFDF5' },
  { value: 'neutral',  label: 'Neutral',  Icon: Minus,       color: '#D97706', bg: '#FFFBEB' },
  { value: 'negative', label: 'Negative', Icon: ThumbsDown,  color: '#DC2626', bg: '#FEF2F2' },
];

type Props = { navigation: NativeStackNavigationProp<any>; route: any };

export default function WriteReviewScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const preselected: Product | undefined = route.params?.product;
  const [selected, setSelected] = useState<Product | null>(preselected ?? null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [sentiment, setSentiment] = useState<ReviewSentiment | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(!preselected);
  const [existingReview, setExistingReview] = useState(false);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })
      .limit(80);
    if (data) setProducts(data as Product[]);
    setLoadingProducts(false);
  }, []);

  useEffect(() => {
    if (!preselected) fetchProducts();
  }, [preselected, fetchProducts]);

  useEffect(() => {
    if (!selected || !userId) return;
    supabase
      .from('reviews')
      .select('id')
      .eq('product_id', selected.id)
      .eq('reviewer_id', userId)
      .maybeSingle()
      .then(({ data }) => setExistingReview(!!data));
  }, [selected, userId]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!userId) return;
    if (!selected) { Alert.alert('Select a product', 'Please select the product you want to review.'); return; }
    if (!sentiment) { Alert.alert('Select sentiment', 'Please choose Positive, Neutral, or Negative.'); return; }
    if (reviewText.trim().length < 10) { Alert.alert('Review too short', 'Please write at least 10 characters.'); return; }
    if (existingReview) { Alert.alert('Already reviewed', 'You have already reviewed this product.'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: selected.id,
      reviewer_id: userId,
      sentiment,
      review_text: reviewText.trim(),
    });
    setSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Already reviewed', 'You have already reviewed this product.');
      } else {
        Alert.alert('Error', error.message);
      }
    } else {
      Alert.alert('Review submitted! 🎉', 'Thank you for your honest review. Rewards will be credited after verification.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  // Product picker view
  const ProductPicker = (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 }}>
        Select a product you purchased:
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, gap: 8 }}>
        <Search size={16} color="#9CA3AF" />
        <TextInput
          style={{ flex: 1, fontSize: 14, color: '#111827' }}
          placeholder="Search products..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loadingProducts ? (
        <ActivityIndicator color={INDIGO} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          style={{ maxHeight: 320 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelected(item)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 }}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#F9FAFB' }} resizeMode="contain" />
              ) : (
                <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={18} color="#D1D5DB" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }} numberOfLines={1}>{item.name}</Text>
                {item.platform && <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.platform}</Text>}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>No products found</Text>}
        />
      )}
    </View>
  );

  // Review form view
  const ReviewForm = selected && (
    <View>
      {/* Selected product card */}
      <Pressable
        onPress={preselected ? undefined : () => setSelected(null)}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12, marginBottom: 20, gap: 12 }}
      >
        {selected.image_url ? (
          <Image source={{ uri: selected.image_url }} style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#fff' }} resizeMode="contain" />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={20} color="#D1D5DB" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }} numberOfLines={1}>{selected.name}</Text>
          {selected.platform && <Text style={{ fontSize: 12, color: INDIGO }}>{selected.platform}</Text>}
        </View>
        {!preselected && <Text style={{ fontSize: 12, color: '#6B7280' }}>Change</Text>}
      </Pressable>

      {existingReview && (
        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '600' }}>You have already reviewed this product.</Text>
        </View>
      )}

      {/* Sentiment */}
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>How was your experience?</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {SENTIMENTS.map(({ value, label, Icon, color, bg }) => {
          const active = sentiment === value;
          return (
            <Pressable
              key={value}
              onPress={() => setSentiment(value)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: active ? color : '#E5E7EB', backgroundColor: active ? bg : '#fff', gap: 6 }}
            >
              <Icon size={20} color={active ? color : '#9CA3AF'} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: active ? color : '#9CA3AF' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Review text */}
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Your review</Text>
      <TextInput
        style={{ borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', minHeight: 120, textAlignVertical: 'top', marginBottom: 24 }}
        placeholder="Share your honest experience with this product..."
        placeholderTextColor="#9CA3AF"
        multiline
        value={reviewText}
        onChangeText={setReviewText}
      />

      <Pressable
        onPress={handleSubmit}
        disabled={submitting || existingReview}
        style={{ backgroundColor: existingReview ? '#9CA3AF' : INDIGO, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Submit Review</Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!selected ? ProductPicker : ReviewForm}
      </ScrollView>
    </SafeAreaView>
  );
}
