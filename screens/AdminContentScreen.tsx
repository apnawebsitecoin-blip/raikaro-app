import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { ContentPage } from '../lib/types';

export default function AdminContentScreen() {
  const { colors } = useTheme();
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<ContentPage | null>(null);
  const [bodyInput, setBodyInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPages = useCallback(async () => {
    const { data } = await supabase.from('content_pages').select('*').order('slug');
    if (data) setPages(data as ContentPage[]);
  }, []);

  useEffect(() => { fetchPages().finally(() => setLoading(false)); }, [fetchPages]);

  const openEdit = (page: ContentPage) => {
    setEditTarget(page);
    setBodyInput(page.body ?? '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    const { error } = await supabase
      .from('content_pages')
      .update({ body: bodyInput, updated_at: new Date().toISOString() })
      .eq('slug', editTarget.slug);
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setModalVisible(false);
    fetchPages();
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
        <Text style={[s.title, { color: colors.text }]}>Content Pages</Text>
      </View>

      <FlatList
        data={pages}
        keyExtractor={(p) => p.slug}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => openEdit(item)} style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[s.rowSub, { color: colors.textSub }]} numberOfLines={2}>
                {item.body ? item.body.slice(0, 80) + (item.body.length > 80 ? '…' : '') : 'No content yet'}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.indigo, fontWeight: '600' }}>Edit</Text>
          </Pressable>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={12}><X size={22} color={colors.text} /></Pressable>
            <Text style={[s.modalTitle, { color: colors.text }]}>{editTarget?.title}</Text>
            <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
              {saving ? <ActivityIndicator size="small" color={colors.indigo} /> : <Check size={22} color={colors.indigo} />}
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <Text style={[s.hint, { color: colors.textMuted }]}>Plain text. Use blank lines to separate paragraphs.</Text>
            <TextInput
              style={[s.bodyInput, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]}
              value={bodyInput}
              onChangeText={setBodyInput}
              multiline
              placeholder="Page content…"
              placeholderTextColor={colors.textMuted}
              textAlignVertical="top"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title:       { fontSize: 18, fontWeight: '700' },
  row:         { padding: 14, borderRadius: 14, borderWidth: 1, gap: 4, flexDirection: 'row', alignItems: 'center' },
  rowTitle:    { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  rowSub:      { fontSize: 12, lineHeight: 17, flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle:  { fontSize: 17, fontWeight: '700' },
  hint:        { fontSize: 12, marginBottom: 10 },
  bodyInput:   { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 400, lineHeight: 22 },
});
