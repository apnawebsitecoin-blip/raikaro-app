import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { Product } from '../lib/types';

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Food', 'Travel', 'Other'];
const PLATFORMS  = ['Amazon', 'Flipkart', 'Meesho', 'Myntra'];

type FormState = {
  name: string;
  original_url: string;
  affiliate_link: string;
  image_url: string;
  price: string;
  platform: string;
  category: string;
};

const EMPTY_FORM: FormState = {
  name: '', original_url: '', affiliate_link: '',
  image_url: '', price: '', platform: '', category: '',
};

export default function AdminProductsScreen() {
  const { colors } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) setProducts(data as Product[]);
  }, []);

  useEffect(() => {
    fetchProducts().finally(() => setLoading(false));
  }, [fetchProducts]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (p: Product) => {
    setEditTarget(p);
    setForm({
      name: p.name,
      original_url: p.original_url,
      affiliate_link: p.affiliate_link ?? '',
      image_url: p.image_url ?? '',
      price: p.price != null ? String(p.price) : '',
      platform: p.platform ?? '',
      category: p.category ?? '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Product name is required.'); return; }
    if (!form.original_url.trim()) { Alert.alert('Required', 'Product URL is required.'); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      original_url: form.original_url.trim(),
      affiliate_link: form.affiliate_link.trim() || null,
      image_url: form.image_url.trim() || null,
      price: form.price ? parseFloat(form.price) : null,
      platform: form.platform || null,
      category: form.category || null,
    };

    let error;
    if (editTarget) {
      ({ error } = await supabase.from('products').update(payload).eq('id', editTarget.id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Fire price-alert check when price changes on an existing product
      const priceChanged =
        editTarget &&
        payload.price !== null &&
        payload.price !== editTarget.price;
      if (priceChanged) {
        supabase.functions
          .invoke('check-price-alerts', {
            body: { product_id: editTarget!.id, new_price: payload.price },
          })
          .catch(() => {}); // fire-and-forget; don't block the UI
      }
      setModalVisible(false);
      fetchProducts();
    }
  };

  const handleDelete = (p: Product) => {
    Alert.alert('Delete Product', `Delete "${p.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('products').delete().eq('id', p.id);
          fetchProducts();
        },
      },
    ]);
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

      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.text }]}>Products ({products.length})</Text>
        <Pressable onPress={openAdd} style={[s.addBtn, { backgroundColor: colors.indigo }]}>
          <Plus size={18} color="#fff" />
          <Text style={s.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEdit(item)}
            style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[s.rowName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[s.rowSub, { color: colors.textSub }]}>
                {item.platform ?? '—'} · {item.category ?? '—'} · {item.price != null ? `₹${item.price}` : '—'}
              </Text>
              {item.affiliate_link && (
                <Text style={[s.rowSub, { color: colors.indigo }]} numberOfLines={1}>
                  Affiliate: {item.affiliate_link}
                </Text>
              )}
            </View>
            <Pressable onPress={() => handleDelete(item)} hitSlop={12} style={{ padding: 4 }}>
              <X size={16} color="#DC2626" />
            </Pressable>
          </Pressable>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
              <X size={22} color={colors.text} />
            </Pressable>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {editTarget ? 'Edit Product' : 'Add Product'}
            </Text>
            <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
              {saving
                ? <ActivityIndicator size="small" color={colors.indigo} />
                : <Check size={22} color={colors.indigo} />}
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 4 }} keyboardShouldPersistTaps="handled">
            <FLabel text="Product Name *" />
            <FInput value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. boAt Rockerz 450" colors={colors} />

            <FLabel text="Product URL *" />
            <FInput value={form.original_url} onChangeText={(v) => setForm((f) => ({ ...f, original_url: v }))} placeholder="https://amazon.in/..." keyboardType="url" colors={colors} />

            <FLabel text="Affiliate Link" />
            <FInput value={form.affiliate_link} onChangeText={(v) => setForm((f) => ({ ...f, affiliate_link: v }))} placeholder="https://amzn.to/..." keyboardType="url" colors={colors} />

            <FLabel text="Image URL" />
            <FInput value={form.image_url} onChangeText={(v) => setForm((f) => ({ ...f, image_url: v }))} placeholder="https://..." keyboardType="url" colors={colors} />

            <FLabel text="Price (₹)" />
            <FInput value={form.price} onChangeText={(v) => setForm((f) => ({ ...f, price: v }))} placeholder="e.g. 999" keyboardType="numeric" colors={colors} />

            <FLabel text="Platform" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {PLATFORMS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setForm((f) => ({ ...f, platform: f.platform === p ? '' : p }))}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: form.platform === p ? colors.indigo : colors.borderStrong, backgroundColor: form.platform === p ? colors.indigoMuted : colors.card }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: form.platform === p ? colors.indigo : colors.textSub }}>{p}</Text>
                </Pressable>
              ))}
            </View>

            <FLabel text="Category" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setForm((f) => ({ ...f, category: f.category === c ? '' : c }))}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: form.category === c ? colors.indigo : colors.borderStrong, backgroundColor: form.category === c ? colors.indigoMuted : colors.card }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: form.category === c ? colors.indigo : colors.textSub }}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FLabel({ text }: { text: string }) {
  return <Text style={s.fLabel}>{text}</Text>;
}

function FInput({ value, onChangeText, placeholder, keyboardType, colors }: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  colors: any;
}) {
  return (
    <TextInput
      style={[s.fInput, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      autoCapitalize="none"
      keyboardType={keyboardType ?? 'default'}
    />
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title:       { fontSize: 18, fontWeight: '700' },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  rowName:     { fontSize: 14, fontWeight: '600' },
  rowSub:      { fontSize: 12, marginTop: 2 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle:  { fontSize: 17, fontWeight: '700' },
  fLabel:      { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  fInput:      { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 4 },
});
