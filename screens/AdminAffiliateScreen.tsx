import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  Alert, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ExternalLink } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { AffiliatePlatform, PLATFORM_META } from '../lib/affiliateUtils';

const PLATFORMS: AffiliatePlatform[] = ['amazon', 'flipkart', 'meesho', 'myntra'];

type TagMap = Record<AffiliatePlatform, string>;
type SavingMap = Record<AffiliatePlatform, boolean>;

export default function AdminAffiliateScreen() {
  const { colors } = useTheme();
  const [tags, setTags] = useState<TagMap>({ amazon: '', flipkart: '', meesho: '', myntra: '' });
  const [saving, setSaving] = useState<SavingMap>({ amazon: false, flipkart: false, meesho: false, myntra: false });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from('affiliate_settings')
      .select('platform, affiliate_tag');
    if (data) {
      const next = { ...tags };
      data.forEach((row: any) => { next[row.platform as AffiliatePlatform] = row.affiliate_tag ?? ''; });
      setTags(next);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async (platform: AffiliatePlatform) => {
    setSaving((s) => ({ ...s, [platform]: true }));
    const { error } = await supabase
      .from('affiliate_settings')
      .upsert({ platform, affiliate_tag: tags[platform].trim(), updated_at: new Date().toISOString() });
    setSaving((s) => ({ ...s, [platform]: false }));

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved', `${PLATFORM_META[platform].label} affiliate tag updated.`);
    }
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
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">

        <Text style={[s.heading, { color: colors.text }]}>Affiliate Settings</Text>
        <Text style={[s.sub, { color: colors.textSub }]}>
          Enter your affiliate IDs below. Links will be appended automatically whenever a user submits a product URL or an admin adds a product — no input required from users.
        </Text>

        {PLATFORMS.map((platform) => {
          const meta = PLATFORM_META[platform];
          const isConfigured = tags[platform].trim().length > 0;
          return (
            <View key={platform} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Platform header */}
              <View style={s.cardHeader}>
                <View style={[s.badge, { backgroundColor: meta.bg }]}>
                  <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <View style={[s.statusDot, { backgroundColor: isConfigured ? '#10B981' : '#D1D5DB' }]} />
                <Text style={[s.statusLabel, { color: isConfigured ? '#10B981' : colors.textMuted }]}>
                  {isConfigured ? 'Configured' : 'Not set'}
                </Text>
              </View>

              {/* Tag input */}
              <Text style={[s.inputLabel, { color: colors.textSub }]}>{meta.paramLabel}</Text>
              <TextInput
                style={[s.input, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.background }]}
                value={tags[platform]}
                onChangeText={(v) => setTags((t) => ({ ...t, [platform]: v }))}
                placeholder={meta.hint}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* URL preview */}
              {isConfigured && (
                <View style={[s.previewBox, { backgroundColor: meta.bg }]}>
                  <ExternalLink size={12} color={meta.color} />
                  <Text style={[s.previewText, { color: meta.color }]} numberOfLines={1}>
                    {platform === 'amazon'   && `amazon.in/dp/example?tag=${tags[platform]}`}
                    {platform === 'flipkart' && `flipkart.com/item?affid=${tags[platform]}`}
                    {platform === 'meesho'   && `meesho.com/product?ref=${tags[platform]}`}
                    {platform === 'myntra'   && `myntra.com/product?utm_source=${tags[platform]}`}
                  </Text>
                </View>
              )}

              {/* Save button */}
              <Pressable
                onPress={() => handleSave(platform)}
                disabled={saving[platform]}
                style={[s.saveBtn, { backgroundColor: colors.indigo }]}
              >
                {saving[platform]
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Check size={15} color="#fff" />
                      <Text style={s.saveBtnText}>Save {meta.label}</Text>
                    </>}
              </Pressable>
            </View>
          );
        })}

        <View style={[s.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.infoText, { color: colors.textSub }]}>
            💡 If a platform has no tag configured, product URLs are saved as-is without modification — nothing breaks. Tags can be updated at any time and will apply to future submissions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  heading:      { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  sub:          { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  card:         { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeText:    { fontSize: 12, fontWeight: '700' },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  statusLabel:  { fontSize: 12, fontWeight: '600' },
  inputLabel:   { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  input:        { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  previewBox:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  previewText:  { fontSize: 11, flex: 1, fontFamily: 'System' },
  saveBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10 },
  saveBtnText:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  infoBox:      { borderRadius: 12, borderWidth: 1, padding: 14 },
  infoText:     { fontSize: 13, lineHeight: 19 },
});
