import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X, ChevronDown } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { CommunityDeal } from '../lib/types';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:  { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#D1FAE5', text: '#065F46' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function AdminSubmittedDealsScreen() {
  const { colors } = useTheme();
  const [deals, setDeals] = useState<CommunityDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CommunityDeal | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [acting, setActing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const fetchDeals = useCallback(async () => {
    const { data } = await supabase
      .from('community_deals')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setDeals(data as CommunityDeal[]);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchDeals().finally(() => setLoading(false));
  }, [fetchDeals]);

  const act = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    setActing(true);

    const { error } = await supabase
      .from('community_deals')
      .update({ status, admin_note: adminNote.trim() || null })
      .eq('id', selected.id);

    if (error) {
      Alert.alert('Error', error.message);
      setActing(false);
      return;
    }

    if (status === 'approved') {
      // Promote to products table
      const { error: insertErr } = await supabase.from('products').insert({
        name: selected.product_name,
        original_url: selected.product_url,
        affiliate_link: selected.affiliate_link,
        image_url: selected.image_url,
        price: selected.price,
        category: selected.category,
        is_featured: false,
        is_sponsored: false,
      });
      if (insertErr) {
        Alert.alert('Warning', `Deal approved but product insert failed: ${insertErr.message}`);
      }
    }

    setActing(false);
    setSelected(null);
    setAdminNote('');
    fetchDeals();
  };

  const FILTERS: Array<'pending' | 'approved' | 'rejected'> = ['pending', 'approved', 'rejected'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Filter tabs */}
      <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[s.tab, filter === f && { borderBottomWidth: 2, borderBottomColor: colors.indigo }]}
          >
            <Text style={[s.tabText, { color: filter === f ? colors.indigo : colors.textSub }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.indigo} />
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>No {filter} deals</Text>
          }
          renderItem={({ item }) => {
            const sc = STATUS_COLORS[item.status];
            return (
              <Pressable
                onPress={() => { setSelected(item); setAdminNote(item.admin_note ?? ''); }}
                style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={[s.dealName, { color: colors.text, flex: 1 }]} numberOfLines={2}>{item.product_name}</Text>
                  <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: sc.text }}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[s.dealMeta, { color: colors.textSub }]}>
                  {item.category ?? '—'} · {item.price != null ? `₹${item.price}` : '—'} · {new Date(item.created_at).toLocaleDateString('en-IN')}
                </Text>
                {item.affiliate_link && (
                  <Text style={[s.dealMeta, { color: colors.indigo }]} numberOfLines={1}>Affiliate: {item.affiliate_link}</Text>
                )}
                <Text style={[s.dealUrl, { color: colors.textMuted }]} numberOfLines={1}>{item.product_url}</Text>
                <ChevronDown size={14} color={colors.textMuted} style={{ alignSelf: 'center', marginTop: 4 }} />
              </Pressable>
            );
          }}
        />
      )}

      {/* Detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => { setSelected(null); setAdminNote(''); }} hitSlop={12}>
                <X size={22} color={colors.text} />
              </Pressable>
              <Text style={[s.modalTitle, { color: colors.text }]} numberOfLines={1}>{selected.product_name}</Text>
              <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
              <DetailRow label="URL" value={selected.product_url} colors={colors} />
              {selected.affiliate_link && <DetailRow label="Affiliate" value={selected.affiliate_link} colors={colors} />}
              {selected.price != null && <DetailRow label="Price" value={`₹${selected.price}`} colors={colors} />}
              {selected.category && <DetailRow label="Category" value={selected.category} colors={colors} />}
              {selected.description && <DetailRow label="Description" value={selected.description} colors={colors} />}

              <Text style={[s.fLabel, { color: colors.textMuted }]}>Admin Note</Text>
              <TextInput
                style={[s.noteInput, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]}
                placeholder="Optional note to user..."
                placeholderTextColor={colors.textMuted}
                value={adminNote}
                onChangeText={setAdminNote}
                multiline
              />

              {selected.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Pressable
                    onPress={() => act('rejected')}
                    disabled={acting}
                    style={[s.actionBtn, { backgroundColor: '#FEE2E2', flex: 1 }]}
                  >
                    {acting ? <ActivityIndicator color="#991B1B" size="small" /> : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <X size={16} color="#991B1B" />
                        <Text style={{ fontWeight: '700', color: '#991B1B' }}>Reject</Text>
                      </View>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => act('approved')}
                    disabled={acting}
                    style={[s.actionBtn, { backgroundColor: '#D1FAE5', flex: 1 }]}
                  >
                    {acting ? <ActivityIndicator color="#065F46" size="small" /> : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Check size={16} color="#065F46" />
                        <Text style={{ fontWeight: '700', color: '#065F46' }}>Approve & Publish</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={[s.fLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.text }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tabRow:      { flexDirection: 'row', borderBottomWidth: 1 },
  tab:         { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText:     { fontSize: 14, fontWeight: '600' },
  card:        { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  dealName:    { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  dealMeta:    { fontSize: 12 },
  dealUrl:     { fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle:  { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  fLabel:      { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  noteInput:   { borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  actionBtn:   { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
});
