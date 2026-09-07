import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, StatusBar, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mail, Edit2, Check, X, LogOut, Bell, Moon, Globe,
  ChevronRight, Shield, Heart, Wallet, Users, PenLine,
  Tag, AlertCircle, BookOpen, Crown, User, LogIn,
} from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { Profile } from '../lib/types';

const APP_VERSION = '1.0.0';

type Props = { navigation: any };

export default function AccountScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { walletBalance } = useProfile();
  const { colors, isDark, toggleTheme } = useTheme();
  const userId = session?.user.id;
  const email = session?.user.email ?? '';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    const [profileRes, notifRes, wishlistRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false),
      supabase.from('wishlists').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    if (profileRes.data) {
      setProfile(profileRes.data as Profile);
      setNameInput(profileRes.data.name ?? '');
    }
    setUnreadCount(notifRes.count ?? 0);
    setWishlistCount(wishlistRes.count ?? 0);
  }, [userId]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

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
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <StatusBar barStyle={colors.statusBar} />
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Guest profile card */}
          <View style={[s.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.avatar, { backgroundColor: colors.cardAlt }]}>
              <User size={28} color={colors.textMuted} />
            </View>
            <Text style={[s.nameText, { color: colors.text, marginTop: 4 }]}>Guest User</Text>
            <Text style={{ fontSize: 13, color: colors.textSub, marginTop: 4 }}>Browsing without an account</Text>
          </View>

          {/* Sign in CTA */}
          <Pressable
            style={{ backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            onPress={() => navigation.navigate('Login')}
          >
            <LogIn size={18} color="#fff" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Sign In</Text>
          </Pressable>
          <Pressable
            style={{ borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 24 }}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Create Account</Text>
          </Pressable>

          {/* Preferences still work for guests */}
          <Text style={[s.sectionTitle, { color: colors.textMuted }]}>Preferences</Text>
          <View style={[s.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.settingRow}>
              <View style={s.settingLeft}>
                <View style={[s.settingIcon, { backgroundColor: colors.cardAlt }]}>
                  <Moon size={16} color={colors.text} />
                </View>
                <Text style={[s.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.borderStrong, true: '#A5B4FC' }}
                thumbColor={isDark ? colors.indigo : colors.textMuted}
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <Pressable
              style={s.settingRow}
              onPress={() => navigation.navigate('Blog')}
            >
              <View style={s.settingLeft}>
                <View style={[s.settingIcon, { backgroundColor: colors.indigoMuted }]}>
                  <BookOpen size={16} color={colors.indigo} />
                </View>
                <View>
                  <Text style={[s.settingLabel, { color: colors.text }]}>Guides & Blog</Text>
                  <Text style={[s.settingHint, { color: colors.textSub }]}>Shopping tips and cashback guides</Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={[s.version, { color: colors.textMuted, marginTop: 24 }]}>Raikaro v{APP_VERSION}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={[s.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.avatar, { backgroundColor: colors.indigo }]}>
            <Text style={s.avatarText}>{(profile?.name ?? email).charAt(0).toUpperCase()}</Text>
          </View>

          {editingName ? (
            <View style={s.nameEditRow}>
              <TextInput
                style={[s.nameInput, { color: colors.text, borderBottomColor: colors.indigo }]}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
              />
              {savingName ? (
                <ActivityIndicator size="small" color={colors.indigo} style={{ marginLeft: 8 }} />
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
              <Text style={[s.nameText, { color: colors.text }]}>{profile?.name ?? 'Set your name'}</Text>
              {profile?.is_premium && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3, marginLeft: 8, gap: 3 }}>
                  <Crown size={11} color="#D97706" />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#D97706' }}>Premium</Text>
                </View>
              )}
              <Edit2 size={14} color={colors.textMuted} style={{ marginLeft: 8 }} />
            </Pressable>
          )}

          <View style={s.emailRow}>
            <Mail size={13} color={colors.textMuted} />
            <Text style={[s.emailText, { color: colors.textMuted }]}>{email}</Text>
          </View>

          {profile?.referral_code && (
            <View style={{ marginTop: 10, backgroundColor: colors.indigoMuted, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: colors.indigo, fontWeight: '700' }}>Code: {profile.referral_code}</Text>
            </View>
          )}
        </View>

        {/* Dashboard: 2-column quick cards */}
        <Text style={[s.sectionTitle, { color: colors.textMuted }]}>Dashboard</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <Pressable style={[s.dashCard, { flex: 1, backgroundColor: colors.indigo }]} onPress={() => navigation.getParent()?.navigate('Wallet')}>
            <Wallet size={22} color="#fff" />
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 6 }}>₹{walletBalance.toFixed(0)}</Text>
            <Text style={{ fontSize: 12, color: '#C7D2FE', marginTop: 2 }}>My Wallet</Text>
          </Pressable>
          <Pressable style={[s.dashCard, { flex: 1, backgroundColor: colors.greenMuted }]} onPress={() => navigation.getParent()?.navigate('Refer')}>
            <Users size={22} color={colors.green} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.green, marginTop: 6 }}>Refer</Text>
            <Text style={{ fontSize: 12, color: colors.green, marginTop: 2 }}>& Earn</Text>
          </Pressable>
        </View>

        {/* List rows */}
        <View style={[s.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <DashRow
            icon={<Bell size={18} color={colors.indigo} />}
            iconBg={colors.indigoMuted}
            label="Notifications"
            badge={unreadCount > 0 ? unreadCount : undefined}
            colors={colors}
            onPress={() => navigation.navigate('Notifications')}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <DashRow
            icon={<Heart size={18} color="#EF4444" />}
            iconBg="#FEF2F2"
            label="My Wishlist"
            badge={wishlistCount > 0 ? wishlistCount : undefined}
            colors={colors}
            onPress={() => navigation.navigate('Wishlist')}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <DashRow
            icon={<PenLine size={18} color={colors.indigo} />}
            iconBg={colors.indigoMuted}
            label="Write a Review"
            subtitle="Earn rewards for honest reviews"
            colors={colors}
            onPress={() => navigation.navigate('WriteReview')}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <DashRow
            icon={<Tag size={18} color="#D97706" />}
            iconBg="#FEF3C7"
            label="Submit a Deal"
            subtitle="Share deals with the community"
            colors={colors}
            onPress={() => navigation.navigate('SubmitDeal')}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <DashRow
            icon={<BookOpen size={18} color={colors.indigo} />}
            iconBg={colors.indigoMuted}
            label="Guides & Blog"
            subtitle="Shopping tips and cashback guides"
            colors={colors}
            onPress={() => navigation.navigate('Blog')}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <DashRow
            icon={<AlertCircle size={18} color="#DC2626" />}
            iconBg="#FEF2F2"
            label="Missing Cashback?"
            subtitle="Report and track your request"
            colors={colors}
            onPress={() => navigation.getParent()?.navigate('Wallet')}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <DashRow
            icon={<Shield size={18} color="#2563EB" />}
            iconBg="#EFF6FF"
            label="Privacy Policy"
            colors={colors}
            onPress={() => {}}
          />
        </View>

        {/* Preferences */}
        <Text style={[s.sectionTitle, { marginTop: 20, color: colors.textMuted }]}>Preferences</Text>
        <View style={[s.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <View style={[s.settingIcon, { backgroundColor: colors.indigoMuted }]}>
                <Bell size={16} color={colors.indigo} />
              </View>
              <Text style={[s.settingLabel, { color: colors.text }]}>Notifications</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: colors.borderStrong, true: '#A5B4FC' }}
              thumbColor={notifEnabled ? colors.indigo : colors.textMuted}
            />
          </View>
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <View style={[s.settingIcon, { backgroundColor: colors.cardAlt }]}>
                <Moon size={16} color={colors.text} />
              </View>
              <Text style={[s.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.borderStrong, true: '#A5B4FC' }}
              thumbColor={isDark ? colors.indigo : colors.textMuted}
            />
          </View>
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <Pressable style={s.settingRow}>
            <View style={s.settingLeft}>
              <View style={[s.settingIcon, { backgroundColor: colors.greenMuted }]}>
                <Globe size={16} color={colors.green} />
              </View>
              <View>
                <Text style={[s.settingLabel, { color: colors.text }]}>Language</Text>
                <Text style={[s.settingHint, { color: colors.textMuted }]}>English — Coming soon</Text>
              </View>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Premium banner */}
        <Pressable
          onPress={() => navigation.navigate('Premium')}
          style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FDE68A', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Crown size={22} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#92400E' }}>
              {profile?.is_premium ? '✓ You\'re Premium!' : 'Go Premium — ₹99/month'}
            </Text>
            <Text style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
              {profile?.is_premium ? 'Enjoy ad-free deals & priority support' : 'Ad-free · Early deals · Priority support'}
            </Text>
          </View>
          <ChevronRight size={18} color="#D97706" />
        </Pressable>

        {/* Logout */}
        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#DC2626" />
          <Text style={s.logoutText}>Sign Out</Text>
        </Pressable>

        <Text style={[s.version, { color: colors.textMuted }]}>Raikaro v{APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DashRow({
  icon, iconBg, label, subtitle, badge, colors, onPress,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle?: string;
  badge?: number;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable style={s.settingRow} onPress={onPress}>
      <View style={s.settingLeft}>
        <View style={[s.settingIcon, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={[s.settingLabel, { color: colors.text }]}>{label}</Text>
          {subtitle && <Text style={[s.settingHint, { color: colors.textSub }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {badge !== undefined && (
          <View style={{ backgroundColor: '#EF4444', borderRadius: 99, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{badge}</Text>
          </View>
        )}
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  scroll:         { padding: 16, paddingBottom: 48 },
  profileCard:    { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1 },
  avatar:         { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:     { fontSize: 28, fontWeight: '800', color: '#fff' },
  nameRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  nameText:       { fontSize: 20, fontWeight: '700' },
  nameEditRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 4, width: '100%', justifyContent: 'center' },
  nameInput:      { fontSize: 18, fontWeight: '600', borderBottomWidth: 2, paddingVertical: 4, minWidth: 150, textAlign: 'center' },
  nameEditBtns:   { flexDirection: 'row', gap: 8, marginLeft: 8 },
  iconBtn:        { padding: 4 },
  emailRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emailText:      { fontSize: 13 },
  sectionTitle:   { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingHorizontal: 4 },
  dashCard:       { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'transparent' },
  settingsCard:   { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  settingRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel:   { fontSize: 15, fontWeight: '500' },
  settingHint:    { fontSize: 12, marginTop: 1 },
  divider:        { height: 1, marginHorizontal: 16 },
  logoutBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 16, marginTop: 20, marginBottom: 24, borderWidth: 1, borderColor: '#FECACA' },
  logoutText:     { fontSize: 16, fontWeight: '700', color: '#DC2626' },
  version:        { textAlign: 'center', fontSize: 12 },
});
