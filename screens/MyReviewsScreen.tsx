import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThumbsUp, ThumbsDown, Minus, PenLine, Trash2, X, Check } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Review, ReviewSentiment, Product } from '../lib/types';

type ReviewWithProduct = Review & { products: Pick<Product, 'name' | 'platform'> | null };

const SENTIMENT_META: Record<ReviewSentiment, { Icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
  positive: { Icon: ThumbsUp,   color: '#059669', bg: '#ECFDF5', label: 'Positive' },
  neutral:  { Icon: Minus,       color: '#D97706', bg: '#FFFBEB', label: 'Neutral'  },
  negative: { Icon: ThumbsDown,  color: '#DC2626', bg: '#FEF2F2', label: 'Negative' },
};

export default function MyReviewsScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const userId = session?.user.id;

  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing]   = useState<ReviewWithProduct | null>(null);
  const [editText, setEditText] = useState('');
  const [editSentiment, setEditSentiment] = useState<ReviewSentiment | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('reviews')
      .select('*, products(name, platform)')
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false });
    if (data) setReviews(data as ReviewWithProduct[]);
  }, [userId]);

  useEffect(() => {
    fetchReviews().finally(() => setLoading(false));
  }, [fetchReviews]);

  const openEdit = (r: ReviewWithProduct) => {
    setEditing(r);
    setEditText(r.review_text ?? '');
    setEditSentiment(r.sentiment);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editSentiment) { Alert.alert('Required', 'Please choose a sentiment.'); return; }
    if (editText.trim().length < 10) { Alert.alert('Too short', 'Review must be at least 10 characters.'); return; }

    setSaving(true);
    const { error } = await supabase
      .from('reviews')
      .update({ sentiment: editSentiment, review_text: editText.trim() })
      .eq('id', editing.id)
      .eq('reviewer_id', userId);
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setEditing(null);
      fetchReviews();
    }
  };

  const handleDelete = (r: ReviewWithProduct) => {
    const name = r.products?.name ?? 'this product';
    Alert.alert(
      'Delete Review',
      `Delete your review for "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const { error } = await supabase
              .from('reviews')
              .delete()
              .eq('id', r.id)
              .eq('reviewer_id', userId);
            if (error) Alert.alert('Error', error.message);
            else fetchReviews();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {reviews.length === 0 ? (
        <View style={s.empty}>
          <PenLine size={48} color={colors.textMuted} />
          <Text style={[s.emptyTitle, { color: colors.text }]}>No reviews yet</Text>
          <Text style={[s.emptySub, { color: colors.textSub }]}>
            Your submitted reviews will appear here. Write one to earn rewards!
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => <ReviewCard review={item} colors={colors} onEdit={openEdit} onDelete={handleDelete} />}
        />
      )}

      {/* Edit modal */}
      <Modal visible={!!editing} animationType="slide" presentationStyle="pageSheet">
        {editing && (
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setEditing(null)} hitSlop={12}>
                <X size={22} color={colors.text} />
              </Pressable>
              <Text style={[s.modalTitle, { color: colors.text }]} numberOfLines={1}>
                Edit Review
              </Text>
              <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
                {saving
                  ? <ActivityIndicator size="small" color={colors.indigo} />
                  : <Check size={22} color={colors.indigo} />}
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              {/* Product label */}
              <View style={{ backgroundColor: colors.indigoMuted, borderRadius: 10, padding: 12, marginBottom: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.indigo }} numberOfLines={1}>
                  {editing.products?.name ?? 'Unknown product'}
                </Text>
                {editing.products?.platform && (
                  <Text style={{ fontSize: 11, color: colors.indigo, marginTop: 2 }}>{editing.products.platform}</Text>
                )}
              </View>

              {/* Sentiment picker */}
              <Text style={[s.fieldLabel, { color: colors.textSub }]}>How was your experience?</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {(Object.entries(SENTIMENT_META) as [ReviewSentiment, typeof SENTIMENT_META[ReviewSentiment]][]).map(([value, meta]) => {
                  const active = editSentiment === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setEditSentiment(value)}
                      style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: active ? meta.color : colors.borderStrong, backgroundColor: active ? meta.bg : colors.card, gap: 6 }}
                    >
                      <meta.Icon size={20} color={active ? meta.color : colors.textMuted} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? meta.color : colors.textMuted }}>{meta.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Review text */}
              <Text style={[s.fieldLabel, { color: colors.textSub }]}>Your review</Text>
              <TextInput
                style={[s.textInput, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]}
                value={editText}
                onChangeText={setEditText}
                placeholder="Share your honest experience..."
                placeholderTextColor={colors.textMuted}
                multiline
                autoFocus
              />

              {editing.verified && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#ECFDF5', borderRadius: 8, padding: 10 }}>
                  <Check size={14} color="#059669" />
                  <Text style={{ fontSize: 12, color: '#065F46', fontWeight: '600' }}>Verified purchase — editing will mark it for re-verification</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function ReviewCard({
  review, colors, onEdit, onDelete,
}: {
  review: ReviewWithProduct;
  colors: any;
  onEdit: (r: ReviewWithProduct) => void;
  onDelete: (r: ReviewWithProduct) => void;
}) {
  const meta = review.sentiment ? SENTIMENT_META[review.sentiment] : null;
  const date = new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Product name + platform */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[s.productName, { color: colors.text }]} numberOfLines={1}>
            {review.products?.name ?? 'Unknown product'}
          </Text>
          {review.products?.platform && (
            <Text style={[s.platform, { color: colors.textMuted }]}>{review.products.platform}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => onEdit(review)} hitSlop={10} style={[s.iconBtn, { backgroundColor: colors.indigoMuted }]}>
            <PenLine size={14} color={colors.indigo} />
          </Pressable>
          <Pressable onPress={() => onDelete(review)} hitSlop={10} style={[s.iconBtn, { backgroundColor: '#FEE2E2' }]}>
            <Trash2 size={14} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      {/* Sentiment badge */}
      {meta && (
        <View style={[s.sentimentBadge, { backgroundColor: meta.bg }]}>
          <meta.Icon size={12} color={meta.color} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: meta.color }}>{meta.label}</Text>
        </View>
      )}

      {/* Review text */}
      {review.review_text && (
        <Text style={[s.reviewText, { color: colors.textSub }]} numberOfLines={4}>
          {review.review_text}
        </Text>
      )}

      {/* Footer: date + verified badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={[s.date, { color: colors.textMuted }]}>{date}</Text>
        {review.verified && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Check size={10} color="#059669" />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669' }}>Verified</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub:      { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card:          { borderRadius: 16, borderWidth: 1, padding: 16 },
  productName:   { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  platform:      { fontSize: 12, marginTop: 1 },
  iconBtn:       { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sentimentBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  reviewText:    { fontSize: 13, lineHeight: 20 },
  date:          { fontSize: 11 },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle:    { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  fieldLabel:    { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  textInput:     { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 140, textAlignVertical: 'top', marginBottom: 4 },
});
