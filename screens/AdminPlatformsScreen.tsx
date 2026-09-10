import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Check } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { PlatformConfig } from '../lib/types';

type FormState = { name: string; brand_color: string; cashback_text: string; shoppers_text: string; display_order: string };
const EMPTY: FormState = { name: '', brand_color: '#374151', cashback_text: 'Cashback', shoppers_text: '1K+ shopped', display_order: '0' };

const COLOR_PRESETS = ['#F59E0B','#3B82F6','#A78BFA','#FB7185','#10B981','#F43F5E','#8B5CF6','#0EA5E9','#F97316','#14B8A6'];

export default function AdminPlatformsScreen() {
  const { colors } = useTheme();
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<PlatformConfig | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('platforms')
      .select('*')
      .order('display_order', { ascending: true });
    if (data) setPlatforms(data as PlatformConfig[]);
  }, []);

  useEffect(() => { fetch().finally(() => setLoading(false)); }, [fetch]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY); setModalVisible(true); };
  const openEdit = (p: PlatformConfig) => {
    setEditTarget(p);
    setForm({ name: p.name, brand_color: p.brand_color, cashback_text: p.cashback_text, shoppers_text: p.shoppers_text, display_order: String(p.display_order) });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Platform name is required.'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      brand_color: form.brand_color,
      cashback_text: form.cashback_text.trim(),
      shoppers_text: form.shoppers_text.trim(),
      display_order: parseInt(form.display_order) || 0,
    };
    let error;
    if (editTarget) {
      ({ error } = await supabase.from('platforms').update(payload).eq('id', editTarget.id));
    } else {
      ({ error } = await supabase.from('platforms').insert(payload));
    }
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setModalVisible(false);
    fetch();
  };

  const toggleActive = async (p: PlatformConfig) => {
    await supabase.from('platforms').update({ is_active: !p.is_active }).eq('id', p.id);
    fetch();
  };

  const handleDelete = (p: PlatformConfig) => {
    Alert.alert('Delete', `Delete "${p.name}"? This will affect affiliate settings and product filters.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('platforms').delete().eq('id', p.id);
        fetch();
      }},
    ]);
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={colors.indigo} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.text }]}>Platforms ({platforms.length})</Text>
        <Pressable onPress={openAdd} style={[s.addBtn, { backgroundColor: colors.indigo }]}>
          <Plus size={18} color="#fff" /><Text style={s.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={platforms}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => openEdit(item)} style={[s.row, { backgroundColor: colors.card, borderColor: colors.border, opacity: item.is_active ? 1 : 0.5 }]}>
            <View style={[s.dot, { backgroundColor: item.brand_color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.rowName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[s.rowSub, { color: colors.textSub }]}>{item.cashback_text} · {item.shoppers_text}</Text>
            </View>
            <Pressable onPress={() => toggleActive(item)} hitSlop={10} style={[s.activePill, { backgroundColor: item.is_active ? '#DCFCE7' : '#F3F4F6' }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: item.is_active ? '#059669' : '#9CA3AF' }}>{item.is_active ? 'ON' : 'OFF'}</Text>
            </Pressable>
            <Pressable onPress={() => handleDelete(item)} hitSlop={12} style={{ padding: 4 }}>
              <X size={16} color="#DC2626" />
            </Pressable>
          </Pressable>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={12}><X size={22} color={colors.text} /></Pressable>
            <Text style={[s.modalTitle, { color: colors.text }]}>{editTarget ? 'Edit Platform' : 'Add Platform'}</Text>
            <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
              {saving ? <ActivityIndicator size="small" color={colors.indigo} /> : <Check size={22} color={colors.indigo} />}
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 4 }} keyboardShouldPersistTaps="handled">
            <FL text="Platform Name" /><FI value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Amazon" colors={colors} />
            <FL text="Cashback Text" /><FI value={form.cashback_text} onChange={(v) => setForm((f) => ({ ...f, cashback_text: v }))} placeholder="Up to 8%" colors={colors} />
            <FL text="Shoppers Text" /><FI value={form.shoppers_text} onChange={(v) => setForm((f) => ({ ...f, shoppers_text: v }))} placeholder="3.2K+ shopped" colors={colors} />
            <FL text="Display Order" /><FI value={form.display_order} onChange={(v) => setForm((f) => ({ ...f, display_order: v }))} placeholder="1" keyboardType="numeric" colors={colors} />

            <FL text="Brand Color" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {COLOR_PRESETS.map((c) => (
                <Pressable key={c} onPress={() => setForm((f) => ({ ...f, brand_color: c }))}
                  style={{ width: 36, height: 36, borderRadius: 99, backgroundColor: c, borderWidth: form.brand_color === c ? 3 : 0, borderColor: '#fff' }} />
              ))}
            </View>
            <FI value={form.brand_color} onChange={(v) => setForm((f) => ({ ...f, brand_color: v }))} placeholder="#F59E0B" colors={colors} />

            <FL text="Preview" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.card, borderRadius: 14, marginBottom: 32 }}>
              <View style={[s.dot, { backgroundColor: form.brand_color, width: 20, height: 20 }]} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{form.name || 'Platform'}</Text>
              <Text style={{ fontSize: 12, color: colors.textSub }}>{form.cashback_text}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>· {form.shoppers_text}</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FL({ text }: { text: string }) { return <Text style={s.fLabel}>{text}</Text>; }
function FI({ value, onChange, placeholder, keyboardType, colors }: { value: string; onChange: (v: string) => void; placeholder: string; keyboardType?: any; colors: any }) {
  return <TextInput style={[s.fInput, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType={keyboardType} />;
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title:       { fontSize: 18, fontWeight: '700' },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  dot:         { width: 14, height: 14, borderRadius: 7 },
  rowName:     { fontSize: 14, fontWeight: '600' },
  rowSub:      { fontSize: 12, marginTop: 2 },
  activePill:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle:  { fontSize: 17, fontWeight: '700' },
  fLabel:      { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  fInput:      { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 4 },
});
