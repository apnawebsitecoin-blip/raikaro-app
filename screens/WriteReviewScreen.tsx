import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, StatusBar, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThumbsUp, ThumbsDown, Minus, Search, ShoppingBag, Video, X } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Product, ReviewSentiment } from '../lib/types';
import GuestPrompt from '../components/GuestPrompt';

const SENTIMENTS: { value: ReviewSentiment; Icon: React.ComponentType<any>; color: string; bg: string }[] = [
  { value: 'positive', Icon: ThumbsUp,   color: '#059669', bg: '#ECFDF5' },
  { value: 'neutral',  Icon: Minus,       color: '#D97706', bg: '#FFFBEB' },
  { value: 'negative', Icon: ThumbsDown,  color: '#DC2626', bg: '#FEF2F2' },
];

type Props = { navigation: NativeStackNavigationProp<any>; route: any };

export default function WriteReviewScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const userId = session?.user.id;

  const preselected: Product | undefined = route.params?.product;
  const [selected, setSelected] = useState<Product | null>(preselected ?? null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [sentiment, setSentiment] = useState<ReviewSentiment | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
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

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to attach a video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!userId || submitting) return;
    if (!selected) { Alert.alert('Select a product', 'Please select the product you want to review.'); return; }
    if (!sentiment) { Alert.alert('Select sentiment', 'Please choose Positive, Neutral, or Negative.'); return; }
    if (reviewText.trim().length < 10) { Alert.alert('Review too short', 'Please write at least 10 characters.'); return; }
    if (existingReview) { Alert.alert('Already reviewed', 'You have already reviewed this product.'); return; }

    // Rate limit: 3 reviews per 24 hours (mirrors reviewer-app)
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewer_id', userId)
      .gte('created_at', since24h);
    if ((recentCount ?? 0) >= 3) {
      Alert.alert('Limit reached', 'You can submit at most 3 reviews per day. Please try again tomorrow.');
      return;
    }

    let mediaUrl: string | null = null;

    if (videoUri) {
      setUploadingVideo(true);
      try {
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const ext = videoUri.split('.').pop() ?? 'mp4';
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('review-media')
          .upload(path, blob, { contentType: `video/${ext}`, upsert: false });
        if (uploadError) {
          Alert.alert('Upload failed', uploadError.message);
          setUploadingVideo(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('review-media').getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
      } catch {
        Alert.alert('Upload failed', 'Could not upload video. Your review will be submitted without it.');
      }
      setUploadingVideo(false);
    }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: selected.id,
      reviewer_id: userId,
      sentiment,
      review_text: reviewText.trim(),
      media_url: mediaUrl,
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
        {t('review_select_product')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, gap: 8 }}>
        <Search size={16} color="#9CA3AF" />
        <TextInput
          style={{ flex: 1, fontSize: 14, color: '#111827' }}
          placeholder={t('review_search_placeholder')}
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loadingProducts ? (
        <ActivityIndicator color={colors.indigo} style={{ marginTop: 40 }} />
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
          ListEmptyComponent={<Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>{t('review_no_products')}</Text>}
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
          {selected.platform && <Text style={{ fontSize: 12, color: colors.indigo }}>{selected.platform}</Text>}
        </View>
        {!preselected && <Text style={{ fontSize: 12, color: '#6B7280' }}>{t('review_change')}</Text>}
      </Pressable>

      {existingReview && (
        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '600' }}>{t('review_already_reviewed')}</Text>
        </View>
      )}

      {/* Sentiment */}
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>{t('review_how_was_experience')}</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {SENTIMENTS.map(({ value, Icon, color, bg }) => {
          const active = sentiment === value;
          const label = value === 'positive' ? t('sentiment_positive') : value === 'neutral' ? t('sentiment_neutral') : t('sentiment_negative');
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
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>{t('review_your_review')}</Text>
      <TextInput
        style={{ borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', minHeight: 120, textAlignVertical: 'top', marginBottom: 16 }}
        placeholder="Share your honest experience with this product..."
        placeholderTextColor="#9CA3AF"
        multiline
        value={reviewText}
        onChangeText={setReviewText}
      />

      {/* Video attachment */}
      {videoUri ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 10, padding: 12, marginBottom: 16, gap: 10 }}>
          <Video size={18} color="#059669" />
          <Text style={{ flex: 1, fontSize: 13, color: '#059669', fontWeight: '600' }} numberOfLines={1}>Video attached</Text>
          <Pressable onPress={() => setVideoUri(null)} hitSlop={10}>
            <X size={16} color="#6B7280" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={pickVideo}
          style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, padding: 14, marginBottom: 16, gap: 10 }}
        >
          <Video size={18} color="#9CA3AF" />
          <Text style={{ fontSize: 14, color: '#6B7280' }}>Attach a video (optional)</Text>
        </Pressable>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting || uploadingVideo || existingReview}
        style={{ backgroundColor: existingReview ? '#9CA3AF' : colors.indigo, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 }}
      >
        {(submitting || uploadingVideo) ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{t('review_submit_btn')}</Text>
        )}
      </Pressable>
      {uploadingVideo && (
        <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 8 }}>Uploading video…</Text>
      )}
    </View>
  );

  if (!userId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['bottom']}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <GuestPrompt
            title="Write a Review"
            message="Sign in to share your experience and earn rewards for honest product reviews."
          />
        </View>
      </SafeAreaView>
    );
  }

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
