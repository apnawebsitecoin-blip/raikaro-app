import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Switch, ActivityIndicator, Alert, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export default function AdminSettingsScreen() {
  const { colors } = useTheme();
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();
    setMaintenance(data?.value === 'true');
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const toggleMaintenance = async (val: boolean) => {
    setSaving(true);
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'maintenance_mode', value: val ? 'true' : 'false', updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setMaintenance(val);
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
      <View style={{ padding: 20 }}>
        <Text style={[s.heading, { color: colors.text }]}>App Settings</Text>

        <View style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowLabel, { color: colors.text }]}>Maintenance Mode</Text>
            <Text style={[s.rowSub, { color: colors.textSub }]}>
              Non-admin users see a "Down for maintenance" screen while this is on.
            </Text>
          </View>
          {saving
            ? <ActivityIndicator size="small" color={colors.indigo} />
            : <Switch value={maintenance} onValueChange={toggleMaintenance} trackColor={{ true: colors.indigo }} />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  heading:  { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  rowSub:   { fontSize: 12, lineHeight: 17 },
});
