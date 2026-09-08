import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, ScrollView, StatusBar, Switch, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { BankOffer } from '../lib/types';

const BANKS     = ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'IndusInd', 'Yes Bank', 'IDFC'];
const CARD_TYPES = ['Credit Card', 'Debit Card', 'EMI'];
const PLATFORMS  = ['Amazon', 'Flipkart', 'Meesho', 'Myntra', 'All'];

type FormState = {
  bank_name: string; card_type: string; discount_description: string;
  applicable_platforms: string[]; valid_until: string; is_active: boolean;
};
const EMPTY_FORM: FormState = {
  bank_name: '', card_type: '', discount_description: '',
  applicable_platforms: [], valid_until: '', is_active: true,
};

export default function AdminBankOffersScreen() {
  const { colors } = useTheme();
  const [offers, setOffers]         = useState<BankOffer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalVisible, setModal]    = useState(false);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [toggling, setToggling]     = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    const { data } = await supabase
      .from('bank_offers')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOffers(data as BankOffer[]);
  }, []);

  useEffect(() => {
    fetchOffers().finally(() => setLoading(false));
  }, [fetchOffers]);

  const toggleActive = async (offer: BankOffer) => {
    setToggling(offer.id);
    await supabase.from('bank_offers').update({ is_active: !offer.is_active }).eq('id', offer.id);
    setToggling(null);
    fetchOffers();
  };

  const handleDelete = (offer: BankOffer) => {
    Alert.alert('Delete offer?', `Remove "${offer.bank_name} ${offer.card_type}" offer?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('bank_offers').delete().eq('id', offer.id);
        fetchOffers();
      }},
    ]);
  };

  const togglePlatform = (p: string) => {
    setForm((f) => ({
      ...f,
      applicable_platforms: f.applicable_platforms.includes(p)
        ? f.applicable_platforms.filter((x) => x !== p)
        : [...f.applicable_platforms, p],
    }));
  };

  const handleSave = async () => {
    if (!form.bank_name)            { Alert.alert('Required', 'Select a bank.'); return; }
    if (!form.card_type)            { Alert.alert('Required', 'Select card type.'); return; }
    if (!form.discount_description.trim()) { Alert.alert('Required', 'Enter discount description.'); return; }
    if (!form.applicable_platforms.length) { Alert.alert('Required', 'Select at least one platform.'); return; }

    setSaving(true);
    const { error } = await supabase.from('bank_offers').insert({
      bank_name: form.bank_name,
      card_type: form.card_type,
      discount_description: form.discount_description.trim(),
      applicable_platforms: form.applicable_platforms,
      valid_until: form.valid_until || null,
      is_active: form.is_active,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else { setModal(false); setForm(EMPTY_FORM); fetchOffers(); }
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
        <Text style={[s.title, { color: colors.text }]}>Bank Offers ({offers.length})</Text>
        <Pressable onPress={() => setModal(true)} style={[s.addBtn, { backgroundColor: colors.indigo }]}>
          <Plus size={18} color="#fff" />
          <Text style={s.addBtnTxt}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={offers}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>No bank offers yet</Text>}
        renderItem={({ item }) => (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: item.is_active ? 1 : 0.6 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.bankName, { color: colors.text }]}>{item.bank_name} {item.card_type}</Text>
                <Text style={[s.desc, { color: colors.textSub }]}>{item.discount_description}</Text>
                <Text style={[s.meta, { color: colors.textMuted }]}>
                  {item.applicable_platforms.join(' · ')}{item.valid_until ? ` · Until ${item.valid_until}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(item)} hitSlop={12} style={{ padding: 4 }}>
                <X size={16} color="#DC2626" />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <Text style={{ fontSize: 12, color: item.is_active ? '#059669' : colors.textMuted, fontWeight: '600' }}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
              {toggling === item.id
                ? <ActivityIndicator size="small" color={colors.indigo} />
                : <Switch value={item.is_active} onValueChange={() => toggleActive(item)}
                    trackColor={{ false: colors.borderStrong, true: '#A5B4FC' }}
                    thumbColor={item.is_active ? colors.indigo : colors.textMuted} />}
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setModal(false)} hitSlop={12}><X size={22} color={colors.text} /></Pressable>
            <Text style={[s.modalTitle, { color: colors.text }]}>New Bank Offer</Text>
            <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
              {saving ? <ActivityIndicator size="small" color={colors.indigo} /> : <Check size={22} color={colors.indigo} />}
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <FLabel text="Bank *" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {BANKS.map((b) => <Chip key={b} label={b} active={form.bank_name === b} onPress={() => setForm((f) => ({ ...f, bank_name: b }))} colors={colors} />)}
            </View>

            <FLabel text="Card Type *" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CARD_TYPES.map((c) => <Chip key={c} label={c} active={form.card_type === c} onPress={() => setForm((f) => ({ ...f, card_type: c }))} colors={colors} />)}
            </View>

            <FLabel text="Discount Description *" />
            <TextInput
              style={[s.fInput, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card, minHeight: 64, textAlignVertical: 'top' }]}
              value={form.discount_description}
              onChangeText={(v) => setForm((f) => ({ ...f, discount_description: v }))}
              placeholder="e.g. 10% instant discount up to ₹1500"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <FLabel text="Applicable Platforms *" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {PLATFORMS.map((p) => <Chip key={p} label={p} active={form.applicable_platforms.includes(p)} onPress={() => togglePlatform(p)} colors={colors} />)}
            </View>

            <FLabel text="Valid Until (YYYY-MM-DD, optional)" />
            <TextInput
              style={[s.fInput, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]}
              value={form.valid_until}
              onChangeText={(v) => setForm((f) => ({ ...f, valid_until: v }))}
              placeholder="2025-12-31"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5, borderColor: active ? colors.indigo : colors.borderStrong, backgroundColor: active ? colors.indigoMuted : colors.card }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? colors.indigo : colors.textSub }}>{label}</Text>
    </Pressable>
  );
}
function FLabel({ text }: { text: string }) {
  return <Text style={s.fLabel}>{text}</Text>;
}

const s = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title:      { fontSize: 18, fontWeight: '700' },
  addBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnTxt:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  card:       { borderRadius: 14, borderWidth: 1, padding: 14 },
  bankName:   { fontSize: 14, fontWeight: '700' },
  desc:       { fontSize: 13, marginTop: 3, lineHeight: 18 },
  meta:       { fontSize: 11, marginTop: 4 },
  modalHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  fLabel:     { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  fInput:     { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 4 },
});
