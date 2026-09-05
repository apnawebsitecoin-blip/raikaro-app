import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Share, Alert, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Copy, Share2, Users, Trophy, CheckCheck } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Profile, TopReferrer } from '../lib/types';

const INDIGO = '#4F46E5';

export default function ReferScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<TopReferrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    const [profileRes, countRes, leaderRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('referred_by', userId),
      supabase.rpc('get_top_referrers', { lim: 10 }),
    ]);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    setReferralCount(countRes.count ?? 0);
    if (leaderRes.data) setLeaderboard(leaderRes.data as TopReferrer[]);
  }, [userId]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleCopy = async () => {
    if (!profile?.referral_code) return;
    await Clipboard.setStringAsync(profile.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!profile?.referral_code) return;
    try {
      await Share.share({
        message: `Join Raikaro and earn cashback on every purchase! Use my referral code: ${profile.referral_code}\n\nDownload the app and start saving today! 🎉`,
        title: 'Join Raikaro',
      });
    } catch {
      Alert.alert('Error', 'Could not open share sheet');
    }
  };

  const myRank = leaderboard.findIndex((r) => r.id === userId) + 1;

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
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={INDIGO} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Referral code card */}
        <View style={s.codeCard}>
          <Text style={s.codeLabel}>Your Referral Code</Text>
          <Text style={s.codeText}>{profile?.referral_code ?? '—'}</Text>
          <Text style={s.codeHint}>Share this code and earn ₹50 per successful referral</Text>
          <View style={s.btnRow}>
            <Pressable style={s.copyBtn} onPress={handleCopy} android_ripple={{ color: '#6366F1' }}>
              {copied ? <CheckCheck size={16} color="#fff" /> : <Copy size={16} color="#fff" />}
              <Text style={s.copyBtnText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
            </Pressable>
            <Pressable style={s.shareBtn} onPress={handleShare} android_ripple={{ color: '#E0E7FF' }}>
              <Share2 size={16} color={INDIGO} />
              <Text style={s.shareBtnText}>Share</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Users size={22} color={INDIGO} />
            <Text style={s.statNumber}>{referralCount}</Text>
            <Text style={s.statLabel}>Friends Referred</Text>
          </View>
          <View style={s.statCard}>
            <Trophy size={22} color={INDIGO} />
            <Text style={s.statNumber}>{myRank > 0 ? `#${myRank}` : '—'}</Text>
            <Text style={s.statLabel}>Your Rank</Text>
          </View>
        </View>

        {/* Leaderboard */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Trophy size={18} color={INDIGO} />
            <Text style={s.cardTitle}>Top Referrers</Text>
          </View>
          {leaderboard.length === 0 ? (
            <Text style={s.emptyText}>No referrals yet — be the first!</Text>
          ) : (
            leaderboard.map((r, i) => {
              const isMe = r.id === userId;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
              return (
                <View key={r.id} style={[s.leaderRow, isMe && s.leaderRowMe]}>
                  <Text style={s.medal}>{medal}</Text>
                  <Text style={[s.leaderName, isMe && s.leaderNameMe]} numberOfLines={1}>
                    {r.name ?? 'Anonymous'}{isMe ? ' (You)' : ''}
                  </Text>
                  <View style={s.leaderBadge}>
                    <Users size={12} color="#6B7280" />
                    <Text style={s.leaderCount}>{r.referral_count}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* How it works */}
        <View style={s.card}>
          <Text style={s.cardTitle}>How it works</Text>
          {[
            { step: '1', text: 'Share your referral code with friends' },
            { step: '2', text: 'They sign up using your code' },
            { step: '3', text: 'You both earn cashback rewards' },
          ].map((item) => (
            <View key={item.step} style={s.stepRow}>
              <View style={s.stepBadge}>
                <Text style={s.stepNum}>{item.step}</Text>
              </View>
              <Text style={s.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#F9FAFB' },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:        { padding: 16, paddingBottom: 40 },
  codeCard:      { backgroundColor: INDIGO, borderRadius: 20, padding: 24, marginBottom: 16 },
  codeLabel:     { color: '#C7D2FE', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  codeText:      { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 4, marginBottom: 8 },
  codeHint:      { color: '#C7D2FE', fontSize: 13, marginBottom: 20 },
  btnRow:        { flexDirection: 'row', gap: 12 },
  copyBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 12 },
  copyBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12 },
  shareBtnText:  { color: INDIGO, fontWeight: '700', fontSize: 14 },
  statsRow:      { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard:      { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#F3F4F6' },
  statNumber:    { fontSize: 28, fontWeight: '800', color: '#111827' },
  statLabel:     { fontSize: 12, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
  card:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle:     { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyText:     { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  leaderRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  leaderRowMe:   { backgroundColor: '#EEF2FF', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 8 },
  medal:         { fontSize: 18, width: 36 },
  leaderName:    { flex: 1, fontSize: 14, fontWeight: '500', color: '#374151' },
  leaderNameMe:  { color: INDIGO, fontWeight: '700' },
  leaderBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  leaderCount:   { fontSize: 13, fontWeight: '700', color: '#374151' },
  stepRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stepBadge:     { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  stepNum:       { fontSize: 14, fontWeight: '800', color: INDIGO },
  stepText:      { flex: 1, fontSize: 14, color: '#374151' },
});
