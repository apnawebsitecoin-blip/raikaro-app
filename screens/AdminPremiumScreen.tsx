import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  Alert, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Check, GripVertical } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { PremiumBenefit, PremiumPlanConfig } from '../lib/types';

const ICON_OPTIONS = ['Zap','Star','Shield','Crown','Clock','Heart','Gift','Bell','Check','Lock'];

export default function AdminPremiumScreen() {
  const { colors } = useTheme();
  const [config, setConfig] = useState<PremiumPlanConfig | null>(null);
  const [priceDisplay, setPriceDisplay] = useState('₹99');
  const [pricePeriod, setPricePeriod] = useState('/month');
  const [benefits, setBenefits] = useState<PremiumBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Per-benefit editing state
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editBenefit, setEditBenefit] = useState<PremiumBenefit>({ icon: 'Star', title: '', desc: '' });

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase
      .from('premium_plan_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (data) {
      setConfig(data as PremiumPlanConfig);
      setPriceDisplay(data.price_display);
      setPricePeriod(data.price_period);
      setBenefits(Array.isArray(data.benefits) ? data.benefits : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    const payload = { price_display: priceDisplay.trim(), price_period: pricePeriod.trim(), benefits };
    let error;
    if (config?.id) {
      ({ error } = await supabase.from('premium_plan_config').update(payload).eq('id', config.id));
    } else {
      ({ error } = await supabase.from('premium_plan_config').insert({ ...payload, is_active: true }));
    }
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); } else { Alert.alert('Saved', 'Premium plan updated.'); fetchConfig(); }
  };

  const startEdit = (idx: number) => { setEditIdx(idx); setEditBenefit({ ...benefits[idx] }); };
  const startAdd  = () => { setEditIdx(benefits.length); setEditBenefit({ icon: 'Star', title: '', desc: '' }); };

  const commitEdit = () => {
    if (!editBenefit.title.trim()) { Alert.alert('Required', 'Benefit title is required.'); return; }
    const next = [...benefits];
    if (editIdx === benefits.length) { next.push(editBenefit); } else { next[editIdx!] = editBenefit; }
    setBenefits(next);
    setEditIdx(null);
  };

  const removeBenefit = (idx: number) => {
    setBenefits((b) => b.filter((_, i) => i !== idx));
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={colors.indigo} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 4 }} keyboardShouldPersistTaps="handled">
        <Text style={[s.heading, { color: colors.text }]}>Premium Plan Config</Text>

        <FL text="Price Display" />
        <FI value={priceDisplay} onChange={setPriceDisplay} placeholder="₹99" colors={colors} />

        <FL text="Price Period" />
        <FI value={pricePeriod} onChange={setPricePeriod} placeholder="/month" colors={colors} />

        <FL text="Benefits" />
        {benefits.map((b, idx) => (
          <View key={idx} style={[s.benefitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <GripVertical size={16} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={[s.benefitTitle, { color: colors.text }]}>{b.icon} · {b.title}</Text>
              <Text style={[s.benefitDesc, { color: colors.textSub }]} numberOfLines={1}>{b.desc}</Text>
            </View>
            <Pressable onPress={() => startEdit(idx)} hitSlop={8}><Text style={{ fontSize: 12, color: colors.indigo, fontWeight: '600' }}>Edit</Text></Pressable>
            <Pressable onPress={() => removeBenefit(idx)} hitSlop={12} style={{ padding: 4 }}><X size={14} color="#DC2626" /></Pressable>
          </View>
        ))}

        <Pressable onPress={startAdd} style={[s.addBenefitBtn, { borderColor: colors.indigo }]}>
          <Plus size={16} color={colors.indigo} />
          <Text style={{ fontSize: 14, color: colors.indigo, fontWeight: '600' }}>Add Benefit</Text>
        </Pressable>

        {editIdx !== null && (
          <View style={[s.editCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.editTitle, { color: colors.text }]}>{editIdx === benefits.length ? 'New Benefit' : 'Edit Benefit'}</Text>

            <FL text="Icon" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {ICON_OPTIONS.map((ic) => (
                <Pressable key={ic} onPress={() => setEditBenefit((b) => ({ ...b, icon: ic }))}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5, borderColor: editBenefit.icon === ic ? colors.indigo : colors.borderStrong, backgroundColor: editBenefit.icon === ic ? colors.indigoMuted : colors.background }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: editBenefit.icon === ic ? colors.indigo : colors.textSub }}>{ic}</Text>
                </Pressable>
              ))}
            </View>

            <FL text="Title" />
            <FI value={editBenefit.title} onChange={(v) => setEditBenefit((b) => ({ ...b, title: v }))} placeholder="e.g. Ad-free experience" colors={colors} />

            <FL text="Description" />
            <FI value={editBenefit.desc} onChange={(v) => setEditBenefit((b) => ({ ...b, desc: v }))} placeholder="Short description" colors={colors} />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable onPress={() => setEditIdx(null)} style={[s.editActionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={{ color: colors.textSub, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={commitEdit} style={[s.editActionBtn, { backgroundColor: colors.indigo, borderColor: colors.indigo, flex: 1 }]}>
                <Check size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Done</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable onPress={handleSave} disabled={saving} style={[s.saveBtn, { backgroundColor: colors.indigo }]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Premium Plan</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function FL({ text }: { text: string }) { return <Text style={s.fLabel}>{text}</Text>; }
function FI({ value, onChange, placeholder, colors }: { value: string; onChange: (v: string) => void; placeholder: string; colors: any }) {
  return <TextInput style={[s.fInput, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} />;
}

const s = StyleSheet.create({
  heading:        { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  benefitRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  benefitTitle:   { fontSize: 13, fontWeight: '600' },
  benefitDesc:    { fontSize: 11, marginTop: 2 },
  addBenefitBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 4, marginBottom: 16 },
  editCard:       { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  editTitle:      { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  editActionBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  saveBtn:        { paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  saveBtnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  fLabel:         { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  fInput:         { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 4 },
});
