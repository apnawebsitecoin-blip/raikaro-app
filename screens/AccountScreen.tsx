import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, StatusBar, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Edit2, Check, X, LogOut, Bell, Moon, Globe, ChevronRight, Shield } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../lib/types';

const INDIGO = '#4F46E5';
const APP_VERSION = '1.0.0';

export default function AccountScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const email = session?.user.email ?? '';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Placeholder toggles — not persisted to DB yet
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data as Profile);
      setNameInput(data.name ?? '');
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, [fetchProfile]);

  const handleSaveName = async () => {
    if (!userId || !nameInput.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from('profiles').update({ name: nameInput.trim() }).eq('id', userId);
    setSavingName(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setProfile((p) => p ? { ...p, name: nameInput.trim() } : p);
      setEditingName(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.centered}>
        <ActivityIndicator size="large" color={INDIGO} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {(profile?.name ?? email).charAt(0).toUpperCase()}
            </Text>
          </View>

          {editingName ? (
            <View style={s.nameEditRow}>
              <TextInput
                style={s.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
              />
              {savingName ? (
                <ActivityIndicator size="small" color={INDIGO} style={{ marginLeft: 8 }} />
              ) : (
                <View style={s.nameEditBtns}>
                  <Pressable onPress={handleSaveName} hitSlop={10} style={s.iconBtn}>
                    <Check size={18} color="#059669" />
                  </Pressable>
                  <Pressable onPress={() => { setEditingName(false); setNameInput(profile?.name ?? ''); }} hitSlop={10} style={s.iconBtn}>
                    <X size={18} color="#DC2626" />
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <Pressable style={s.nameRow} onPress={() => setEditingName(true)}>
              <Text style={s.nameText}>{profile?.name ?? 'Set your name'}</Text>
              <Edit2 size={14} color="#9CA3AF" style={{ marginLeft: 8 }} />
            </Pressable>
          )}

          <View style={s.emailRow}>
            <Mail size={13} color="#9CA3AF" />
            <Text style={s.emailText}>{email}</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>

          <View style={s.settingsCard}>
            <View style={s.settingRow}>
              <View style={s.settingLeft}>
                <View style={[s.settingIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Bell size={16} color={INDIGO} />
                </View>
                <Text style={s.settingLabel}>Notifications</Text>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={notifEnabled ? INDIGO : '#9CA3AF'}
              />
            </View>

            <View style={s.divider} />

            <View style={s.settingRow}>
              <View style={s.settingLeft}>
                <View style={[s.settingIcon, { backgroundColor: '#F3F4F6' }]}>
                  <Moon size={16} color="#374151" />
                </View>
                <View>
                  <Text style={s.settingLabel}>Dark Mode</Text>
                  <Text style={s.settingHint}>Coming soon</Text>
                </View>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={darkMode ? INDIGO : '#9CA3AF'}
                disabled
              />
            </View>

            <View style={s.divider} />

            <Pressable style={s.settingRow}>
              <View style={s.settingLeft}>
                <View style={[s.settingIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Globe size={16} color="#059669" />
                </View>
                <View>
                  <Text style={s.settingLabel}>Language</Text>
                  <Text style={s.settingHint}>English — Coming soon</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {/* Account section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>
          <View style={s.settingsCard}>
            <Pressable style={s.settingRow}>
              <View style={s.settingLeft}>
                <View style={[s.settingIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Shield size={16} color="#2563EB" />
                </View>
                <Text style={s.settingLabel}>Privacy Policy</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {/* Logout */}
        <Pressable style={s.logoutBtn} onPress={handleLogout} android_ripple={{ color: '#FEE2E2' }}>
          <LogOut size={18} color="#DC2626" />
          <Text style={s.logoutText}>Sign Out</Text>
        </Pressable>

        <Text style={s.version}>Raikaro v{APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#F9FAFB' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:         { padding: 16, paddingBottom: 48 },
  profileCard:    { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#F3F4F6' },
  avatar:         { width: 72, height: 72, borderRadius: 36, backgroundColor: INDIGO, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:     { fontSize: 28, fontWeight: '800', color: '#fff' },
  nameRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  nameText:       { fontSize: 20, fontWeight: '700', color: '#111827' },
  nameEditRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 4, width: '100%', justifyContent: 'center' },
  nameInput:      { fontSize: 18, fontWeight: '600', color: '#111827', borderBottomWidth: 2, borderBottomColor: INDIGO, paddingVertical: 4, minWidth: 150, textAlign: 'center' },
  nameEditBtns:   { flexDirection: 'row', gap: 8, marginLeft: 8 },
  iconBtn:        { padding: 4 },
  emailRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emailText:      { fontSize: 13, color: '#9CA3AF' },
  section:        { marginBottom: 20 },
  sectionTitle:   { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 },
  settingsCard:   { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' },
  settingRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel:   { fontSize: 15, fontWeight: '500', color: '#111827' },
  settingHint:    { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  divider:        { height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 16 },
  logoutBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 16, marginBottom: 24, borderWidth: 1, borderColor: '#FECACA' },
  logoutText:     { fontSize: 16, fontWeight: '700', color: '#DC2626' },
  version:        { textAlign: 'center', fontSize: 12, color: '#D1D5DB' },
});
