import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Check, CheckCheck, AlertTriangle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { Coupon } from '../lib/types';

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Food', 'Travel'];

function verifiedLabel(lastVerifiedAt: string | null): string | null {
  if (!lastVerifiedAt) return null;
  const days = Math.floor((Date.now() - new Date(lastVerifiedAt).getTime()) / 86_400_000);
  if (days === 0) return 'Verified today';
  if (days < 7)  return `Verified ${days}d ago`;
  if (days < 30) return `Verified ${Math.floor(days / 7)}w ago`;
  return null;
}

type FormState = {
  code: string; title: string; discount_type: 'percent' | 'flat';
  discount_value: string; category: string; expires_at: string;
};
const EMPTY_FORM: FormState = { code: '', title: '', discount_type: 'percent', discount_value: '', category: '', expires_at: '' };

export default function AdminCouponsScreen() {
  const { colors } = useTheme();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null); // coupon id being acted on

  const fetchCoupons = useCallback(async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setCoupons(data as Coupon[]);
  }, []);

  useEffect(() => {
    fetchCoupons().finally(() => setLoading(false));
  }, [fetchCoupons]);

  const markVerified = async (c: Coupon) => {
    setActing(c.id);
    const { error } = await supabase
      .from('coupons')
      .update({ last_verified_at: new Date().toISOString() })
      .eq('id', c.id);
    setActing(null);
    if (error) Alert.alert('Error', error.message);
    else fetchCoupons();
  };

  const markExpired = async (c: Coupon) => {
    Alert.alert('Mark Expired?', `Mark "${c.code}" as expired? It will be hidden from users.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Expired', style: 'destructive', onPress: async () => {
          setActing(c.id);
          const { error } = await supabase.from('coupons').update({ is_expired: true }).eq('id', c.id);
          setActing(null);
          if (error) Alert.alert('Error', error.message);
          else fetchCoupons();
        },
      },
    ]);
  };

  const restoreCoupon = async (c: Coupon) => {
    setActing(c.id);
    const { error } = await supabase.from('coupons').update({ is_expired: false }).eq('id', c.id);
    setActing(null);
    if (error) Alert.alert('Error', error.message);
    else fetchCoupons();
  };

  const handleSave = async () => {
    if (!form.code.trim()) { Alert.alert('Required', 'Coupon code is required.'); return; }
    if (!form.title.trim()) { Alert.alert('Required', 'Title is required.'); return; }
    const dv = parseFloat(form.discount_value);
    if (isNaN(dv) || dv <= 0) { Alert.alert('Required', 'Enter a valid discount value.'); return; }

    setSaving(true);
    const { error } = await supabase.from('coupons').insert({
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      discount_type: form.discount_type,
      discount_value: dv,
      category: form.category || null,
      expires_at: form.expires_at || null,
      is_active: true,
      is_expired: false,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else { setModalVisible(false); setForm(EMPTY_FORM); fetchCoupons(); }
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
        <Text style={[s.title, { color: colors.text }]}>Coupons ({coupons.length})</Text>
        <Pressable onPress={() => setModalVisible(true)} style={[s.addBtn, { backgroundColor: colors.indigo }]}>
          <Plus size={18} color="#fff" />
          <Text style={s.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={coupons}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => {
          const label = verifiedLabel(item.last_verified_at);
          const isActing = acting === item.id;
          return (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: item.is_expired ? '#FECACA' : colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={[s.code, { color: item.is_expired ? '#9CA3AF' : colors.indigo }]}>{item.code}</Text>
                    {item.is_expired && (
                      <View style={s.expiredBadge}>
                        <Text style={s.expiredText}>EXPIRED</Text>
                      </View>
                    )}
                    {label && !item.is_expired && (
                      <View style={s.verifiedBadge}>
                        <CheckCheck size={10} color="#059669" />
                        <Text style={s.verifiedText}>{label}</Text>
                      </View>
                    )}
                    {!label && !item.is_expired && (
                      <View style={[s.verifiedBadge, { backgroundColor: '#FEF3C7' }]}>
                        <AlertTriangle size={10} color="#D97706" />
                        <Text style={[s.verifiedText, { color: '#D97706' }]}>Unverified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.couponTitle, { color: colors.textSub }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[s.meta, { color: colors.textMuted }]}>
                    {item.discount_type === 'percent' ? `${item.discount_value}% OFF` : `₹${item.discount_value} FLAT`}
                    {item.category ? ` · ${item.category}` : ''}
                    {item.expires_at ? ` · Expires ${item.expires_at.slice(0, 10)}` : ''}
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                {!item.is_expired ? (
                  <>
                    <Pressable
                      onPress={() => markVerified(item)}
                      disabled={!!isActing}
                      style={[s.actionBtn, { backgroundColor: '#DCFCE7', flex: 1 }]}
                    >
                      {isActing ? <ActivityIndicator size="small" color="#059669" /> : (
                        <><CheckCheck size={13} color="#059669" /><Text style={[s.actionText, { color: '#059669' }]}>Verify Today</Text></>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => markExpired(item)}
                      disabled={!!isActing}
                      style={[s.actionBtn, { backgroundColor: '#FEE2E2', flex: 1 }]}
                    >
                      <><AlertTriangle size={13} color="#DC2626" /><Text style={[s.actionText, { color: '#DC2626' }]}>Mark Expired</Text></>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    onPress={() => restoreCoupon(item)}
                    disabled={!!isActing}
                    style={[s.actionBtn, { backgroundColor: colors.indigoMuted, flex: 1 }]}
                  >
                    {isActing ? <ActivityIndicator size="small" color={colors.indigo} /> : (
                      <><Check size={13} color={colors.indigo} /><Text style={[s.actionText, { color: colors.indigo }]}>Restore</Text></>
                    )}
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Add coupon modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={12}><X size={22} color={colors.text} /></Pressable>
            <Text style={[s.modalTitle, { color: colors.text }]}>New Coupon</Text>
            <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
              {saving ? <ActivityIndicator size="small" color={colors.indigo} /> : <Check size={22} color={colors.indigo} />}
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 4 }} keyboardShouldPersistTaps="handled">
            <FLabel text="Code *" />
            <FInput value={form.code} onChangeText={(v) => setForm((f) => ({ ...f, code: v.toUpperCase() }))} placeholder="e.g. SAVE10" colors={colors} />
            <FLabel text="Title *" />
            <FInput value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="e.g. 10% off on Electronics" colors={colors} />

            <FLabel text="Discount Type" />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {(['percent', 'flat'] as const).map((t) => (
                <Pressable key={t} onPress={() => setForm((f) => ({ ...f, discount_type: t }))}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: form.discount_type === t ? colors.indigo : colors.borderStrong, backgroundColor: form.discount_type === t ? colors.indigoMuted : colors.card }}>
                  <Text style={{ fontWeight: '700', color: form.discount_type === t ? colors.indigo : colors.textSub }}>
                    {t === 'percent' ? '% OFF' : '₹ FLAT'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <FLabel text="Discount Value *" />
            <FInput value={form.discount_value} onChangeText={(v) => setForm((f) => ({ ...f, discount_value: v }))} placeholder={form.discount_type === 'percent' ? 'e.g. 10' : 'e.g. 200'} keyboardType="numeric" colors={colors} />

            <FLabel text="Category (optional)" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map((cat) => (
                <Pressable key={cat} onPress={() => setForm((f) => ({ ...f, category: f.category === cat ? '' : cat }))}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5, borderColor: form.category === cat ? colors.indigo : colors.borderStrong, backgroundColor: form.category === cat ? colors.indigoMuted : colors.card }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: form.category === cat ? colors.indigo : colors.textSub }}>{cat}</Text>
                </Pressable>
              ))}
            </View>

            <FLabel text="Expires At (optional, YYYY-MM-DD)" />
            <FInput value={form.expires_at} onChangeText={(v) => setForm((f) => ({ ...f, expires_at: v }))} placeholder="2025-12-31" colors={colors} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FLabel({ text }: { text: string }) {
  return <Text style={s.fLabel}>{text}</Text>;
}
function FInput({ value, onChangeText, placeholder, keyboardType, colors }: { value: string; onChangeText: (v: string) => void; placeholder: string; keyboardType?: any; colors: any }) {
  return (
    <TextInput style={[s.fInput, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]}
      value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textMuted}
      autoCapitalize="none" keyboardType={keyboardType ?? 'default'} />
  );
}

const s = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title:         { fontSize: 18, fontWeight: '700' },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  card:          { borderRadius: 14, borderWidth: 1, padding: 14 },
  code:          { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  couponTitle:   { fontSize: 12, marginTop: 2 },
  meta:          { fontSize: 11, marginTop: 2 },
  expiredBadge:  { backgroundColor: '#FEE2E2', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  expiredText:   { fontSize: 10, fontWeight: '700', color: '#DC2626' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#DCFCE7', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  verifiedText:  { fontSize: 10, fontWeight: '700', color: '#059669' },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, paddingVertical: 8 },
  actionText:    { fontSize: 12, fontWeight: '700' },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle:    { fontSize: 17, fontWeight: '700' },
  fLabel:        { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  fInput:        { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 4 },
});
