import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Check, GripVertical } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { Category } from '../lib/types';
import { ICON_NAMES, resolveIcon } from '../lib/categoryIcons';

const COLOR_PRESETS = [
  '#DBEAFE','#FCE7F3','#D1FAE5','#EDE9FE','#FED7AA',
  '#FEF3C7','#CCFBF1','#E0F2FE','#F3F4F6','#FEE2E2',
];
const ICON_COLOR_PRESETS = [
  '#1D4ED8','#DB2777','#059669','#7C3AED','#EA580C',
  '#D97706','#0D9488','#0284C7','#6B7280','#DC2626',
];

type FormState = { name: string; icon_name: string; badge_color: string; icon_color: string; display_order: string };
const EMPTY: FormState = { name: '', icon_name: 'ShoppingBag', badge_color: '#F3F4F6', icon_color: '#6B7280', display_order: '0' };

export default function AdminCategoriesScreen() {
  const { colors } = useTheme();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });
    if (data) setCats(data as Category[]);
  }, []);

  useEffect(() => { fetch().finally(() => setLoading(false)); }, [fetch]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY); setModalVisible(true); };
  const openEdit = (c: Category) => {
    setEditTarget(c);
    setForm({ name: c.name, icon_name: c.icon_name, badge_color: c.badge_color, icon_color: c.icon_color, display_order: String(c.display_order) });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Category name is required.'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      icon_name: form.icon_name,
      badge_color: form.badge_color,
      icon_color: form.icon_color,
      display_order: parseInt(form.display_order) || 0,
    };
    let error;
    if (editTarget) {
      ({ error } = await supabase.from('categories').update(payload).eq('id', editTarget.id));
    } else {
      ({ error } = await supabase.from('categories').insert(payload));
    }
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setModalVisible(false);
    fetch();
  };

  const toggleActive = async (c: Category) => {
    await supabase.from('categories').update({ is_active: !c.is_active }).eq('id', c.id);
    fetch();
  };

  const handleDelete = (c: Category) => {
    Alert.alert('Delete', `Delete "${c.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('categories').delete().eq('id', c.id);
        fetch();
      }},
    ]);
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={colors.indigo} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.text }]}>Categories ({cats.length})</Text>
        <Pressable onPress={openAdd} style={[s.addBtn, { backgroundColor: colors.indigo }]}>
          <Plus size={18} color="#fff" /><Text style={s.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={cats}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => {
          const Icon = resolveIcon(item.icon_name);
          return (
            <Pressable onPress={() => openEdit(item)} style={[s.row, { backgroundColor: colors.card, borderColor: colors.border, opacity: item.is_active ? 1 : 0.5 }]}>
              <View style={[s.iconWrap, { backgroundColor: item.badge_color }]}>
                <Icon size={18} color={item.icon_color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.rowName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[s.rowSub, { color: colors.textSub }]}>icon: {item.icon_name} · order: {item.display_order}</Text>
              </View>
              <Pressable onPress={() => toggleActive(item)} hitSlop={10} style={[s.activePill, { backgroundColor: item.is_active ? '#DCFCE7' : '#F3F4F6' }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: item.is_active ? '#059669' : '#9CA3AF' }}>{item.is_active ? 'ON' : 'OFF'}</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} hitSlop={12} style={{ padding: 4 }}>
                <X size={16} color="#DC2626" />
              </Pressable>
            </Pressable>
          );
        }}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={12}><X size={22} color={colors.text} /></Pressable>
            <Text style={[s.modalTitle, { color: colors.text }]}>{editTarget ? 'Edit Category' : 'Add Category'}</Text>
            <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
              {saving ? <ActivityIndicator size="small" color={colors.indigo} /> : <Check size={22} color={colors.indigo} />}
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 4 }} keyboardShouldPersistTaps="handled">
            <FL text="Name" />
            <FI value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Electronics" colors={colors} />

            <FL text="Display Order" />
            <FI value={form.display_order} onChange={(v) => setForm((f) => ({ ...f, display_order: v }))} placeholder="0" keyboardType="numeric" colors={colors} />

            <FL text="Icon" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {ICON_NAMES.map((name) => {
                const Ic = resolveIcon(name);
                const active = form.icon_name === name;
                return (
                  <Pressable key={name} onPress={() => setForm((f) => ({ ...f, icon_name: name }))}
                    style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: active ? colors.indigo : colors.borderStrong, backgroundColor: active ? colors.indigoMuted : colors.card }}>
                    <Ic size={20} color={active ? colors.indigo : colors.textSub} />
                  </Pressable>
                );
              })}
            </View>

            <FL text="Badge Color" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {COLOR_PRESETS.map((c) => (
                <Pressable key={c} onPress={() => setForm((f) => ({ ...f, badge_color: c }))}
                  style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: c, borderWidth: form.badge_color === c ? 3 : 1, borderColor: form.badge_color === c ? colors.indigo : colors.border }} />
              ))}
            </View>
            <FI value={form.badge_color} onChange={(v) => setForm((f) => ({ ...f, badge_color: v }))} placeholder="#DBEAFE" colors={colors} />

            <FL text="Icon Color" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {ICON_COLOR_PRESETS.map((c) => (
                <Pressable key={c} onPress={() => setForm((f) => ({ ...f, icon_color: c }))}
                  style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: c, borderWidth: form.icon_color === c ? 3 : 1, borderColor: form.icon_color === c ? '#fff' : 'transparent' }} />
              ))}
            </View>
            <FI value={form.icon_color} onChange={(v) => setForm((f) => ({ ...f, icon_color: v }))} placeholder="#1D4ED8" colors={colors} />

            {/* Live preview */}
            <FL text="Preview" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: colors.card, borderRadius: 14, marginBottom: 32 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: form.badge_color, alignItems: 'center', justifyContent: 'center' }}>
                {React.createElement(resolveIcon(form.icon_name), { size: 22, color: form.icon_color })}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{form.name || 'Category Name'}</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FL({ text }: { text: string }) {
  return <Text style={s.fLabel}>{text}</Text>;
}
function FI({ value, onChange, placeholder, keyboardType, colors }: { value: string; onChange: (v: string) => void; placeholder: string; keyboardType?: any; colors: any }) {
  return <TextInput style={[s.fInput, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType={keyboardType} />;
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title:       { fontSize: 18, fontWeight: '700' },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  iconWrap:    { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowName:     { fontSize: 14, fontWeight: '600' },
  rowSub:      { fontSize: 11, marginTop: 2 },
  activePill:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle:  { fontSize: 17, fontWeight: '700' },
  fLabel:      { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  fInput:      { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 4 },
});
