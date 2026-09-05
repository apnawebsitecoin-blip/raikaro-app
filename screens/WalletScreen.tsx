import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, RefreshControl,
  Modal, TextInput, Alert, ActivityIndicator, StatusBar, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wallet, ArrowDownCircle, CheckCircle, Clock, XCircle,
  Gift, X, AlertCircle, ImagePlus, ChevronDown,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Profile, WithdrawalRequest, DailyCheckin, MissingCashbackRequest } from '../lib/types';

const INDIGO = '#4F46E5';
const PLATFORMS = ['Amazon', 'Flipkart', 'Meesho', 'Myntra'];

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: React.ComponentType<any> }> = {
  pending:  { label: 'Pending',  color: '#D97706', Icon: Clock },
  approved: { label: 'Approved', color: '#059669', Icon: CheckCircle },
  paid:     { label: 'Paid',     color: '#2563EB', Icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#DC2626', Icon: XCircle },
  resolved: { label: 'Resolved', color: '#059669', Icon: CheckCircle },
};

export default function WalletScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [missingRequests, setMissingRequests] = useState<MissingCashbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  // Withdraw modal
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Missing cashback modal
  const [missingModal, setMissingModal] = useState(false);
  const [mcOrderUrl, setMcOrderUrl] = useState('');
  const [mcPlatform, setMcPlatform] = useState('');
  const [mcAmount, setMcAmount] = useState('');
  const [mcDate, setMcDate] = useState('');
  const [mcScreenshotUrl, setMcScreenshotUrl] = useState('');
  const [mcUploading, setMcUploading] = useState(false);
  const [mcSubmitting, setMcSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    const [profileRes, withdrawalRes, checkinRes, missingRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('withdrawal_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
      supabase.from('daily_checkins').select('*').eq('user_id', userId).eq('checked_in_at', today).maybeSingle(),
      supabase.from('missing_cashback_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    ]);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (withdrawalRes.data) setWithdrawals(withdrawalRes.data as WithdrawalRequest[]);
    setTodayCheckin(checkinRes.data as DailyCheckin | null);
    if (missingRes.data) setMissingRequests(missingRes.data as MissingCashbackRequest[]);
  }, [userId]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleCheckin = async () => {
    if (!userId) return;
    setCheckinLoading(true);
    const { error } = await supabase.from('daily_checkins').insert({ user_id: userId });
    setCheckinLoading(false);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('', '₹5 credited to your wallet!'); await fetchData(); }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!userId) return;
    if (isNaN(amount) || amount < 100) { Alert.alert('Invalid amount', 'Minimum withdrawal is ₹100'); return; }
    if (!withdrawUpi.trim()) { Alert.alert('UPI required', 'Please enter your UPI ID'); return; }
    if (profile && amount > profile.wallet_balance) { Alert.alert('Insufficient balance', `Your balance is ₹${profile.wallet_balance}`); return; }
    setWithdrawLoading(true);
    const { error } = await supabase.from('withdrawal_requests').insert({ user_id: userId, amount, upi_id: withdrawUpi.trim() });
    setWithdrawLoading(false);
    if (error) Alert.alert('Error', error.message);
    else {
      setWithdrawModal(false); setWithdrawAmount(''); setWithdrawUpi('');
      Alert.alert('Request submitted', 'Your withdrawal will be processed within 2-3 business days.');
      await fetchData();
    }
  };

  const pickScreenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to upload screenshot'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;

    setMcUploading(true);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop() ?? 'jpg';
      const path = `missing-cashback/${userId}/${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('review-media').upload(path, blob, { contentType: `image/${ext}` });
      if (error) throw error;
      const { data } = supabase.storage.from('review-media').getPublicUrl(path);
      setMcScreenshotUrl(data.publicUrl);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Could not upload screenshot');
    } finally {
      setMcUploading(false);
    }
  };

  const handleMissingSubmit = async () => {
    if (!userId) return;
    if (!mcOrderUrl.trim()) { Alert.alert('Required', 'Please enter the order URL'); return; }
    if (!mcPlatform) { Alert.alert('Required', 'Please select a platform'); return; }
    const amount = parseFloat(mcAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Required', 'Please enter a valid order amount'); return; }
    if (!mcDate.trim()) { Alert.alert('Required', 'Please enter the order date (YYYY-MM-DD)'); return; }

    setMcSubmitting(true);
    const { error } = await supabase.from('missing_cashback_requests').insert({
      user_id: userId,
      order_url: mcOrderUrl.trim(),
      platform: mcPlatform,
      order_amount: amount,
      order_date: mcDate.trim(),
      screenshot_url: mcScreenshotUrl || null,
    });
    setMcSubmitting(false);
    if (error) Alert.alert('Error', error.message);
    else {
      setMissingModal(false);
      setMcOrderUrl(''); setMcPlatform(''); setMcAmount(''); setMcDate(''); setMcScreenshotUrl('');
      Alert.alert('Submitted!', 'We will review your missing cashback request within 3-5 business days.');
      await fetchData();
    }
  };

  const resetMissingModal = () => {
    setMissingModal(false);
    setMcOrderUrl(''); setMcPlatform(''); setMcAmount(''); setMcDate(''); setMcScreenshotUrl('');
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return <SafeAreaView style={s.centered}><ActivityIndicator size="large" color={INDIGO} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={INDIGO} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance card */}
        <View style={s.balanceCard}>
          <View style={s.balanceRow}>
            <Wallet size={22} color="#C7D2FE" />
            <Text style={s.balanceLabel}>Wallet Balance</Text>
          </View>
          <Text style={s.balanceAmount}>₹{(profile?.wallet_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          <View style={s.balanceBtnRow}>
            <Pressable style={s.withdrawBtn} onPress={() => setWithdrawModal(true)}>
              <ArrowDownCircle size={16} color="#fff" />
              <Text style={s.withdrawBtnText}>Withdraw</Text>
            </Pressable>
            <Pressable style={s.missingBtn} onPress={() => setMissingModal(true)}>
              <AlertCircle size={16} color="#C7D2FE" />
              <Text style={s.missingBtnText}>Cashback missing?</Text>
            </Pressable>
          </View>
        </View>

        {/* Daily check-in */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Gift size={18} color={INDIGO} />
            <Text style={s.cardTitle}>Daily Check-in</Text>
          </View>
          {todayCheckin ? (
            <View style={s.checkinDone}>
              <CheckCircle size={18} color="#059669" />
              <Text style={s.checkinDoneText}>Checked in today! ₹{todayCheckin.reward_amount} earned</Text>
            </View>
          ) : (
            <>
              <Text style={s.checkinHint}>Check in daily and earn ₹5 each day</Text>
              <Pressable style={s.checkinBtn} onPress={handleCheckin} disabled={checkinLoading}>
                {checkinLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.checkinBtnText}>Check in — Earn ₹5</Text>}
              </Pressable>
            </>
          )}
        </View>

        {/* Withdrawal history */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Withdrawal History</Text>
          {withdrawals.length === 0 ? (
            <Text style={s.emptyText}>No withdrawals yet</Text>
          ) : (
            withdrawals.map((w) => {
              const cfg = STATUS_CONFIG[w.status] ?? STATUS_CONFIG.pending;
              return (
                <View key={w.id} style={s.txRow}>
                  <View style={s.txLeft}>
                    <cfg.Icon size={16} color={cfg.color} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={s.txAmount}>₹{w.amount.toLocaleString('en-IN')}</Text>
                      <Text style={s.txDate}>{formatDate(w.created_at)}</Text>
                    </View>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: cfg.color + '1A' }]}>
                    <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Missing cashback requests */}
        {missingRequests.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Missing Cashback Requests</Text>
            {missingRequests.map((r) => {
              const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
              return (
                <View key={r.id} style={s.txRow}>
                  <View style={s.txLeft}>
                    <cfg.Icon size={16} color={cfg.color} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={s.txAmount}>{r.platform} — ₹{r.order_amount.toLocaleString('en-IN')}</Text>
                      <Text style={s.txDate}>{formatDate(r.created_at)}</Text>
                    </View>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: cfg.color + '1A' }]}>
                    <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Withdraw modal */}
      <Modal visible={withdrawModal} transparent animationType="slide">
        <Pressable style={s.overlay} onPress={() => setWithdrawModal(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Withdraw Funds</Text>
              <Pressable onPress={() => setWithdrawModal(false)} hitSlop={12}><X size={20} color="#6B7280" /></Pressable>
            </View>
            <Text style={s.sheetBalance}>Balance: ₹{(profile?.wallet_balance ?? 0).toLocaleString('en-IN')}</Text>
            <Text style={s.inputLabel}>Amount (min ₹100)</Text>
            <TextInput style={s.input} placeholder="Enter amount" value={withdrawAmount} onChangeText={setWithdrawAmount} keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            <Text style={s.inputLabel}>UPI ID</Text>
            <TextInput style={s.input} placeholder="yourname@upi" value={withdrawUpi} onChangeText={setWithdrawUpi} autoCapitalize="none" placeholderTextColor="#9CA3AF" />
            <Pressable style={s.modalBtn} onPress={handleWithdraw} disabled={withdrawLoading}>
              {withdrawLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.modalBtnText}>Submit Request</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Missing cashback modal */}
      <Modal visible={missingModal} transparent animationType="slide">
        <Pressable style={s.overlay} onPress={resetMissingModal}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Report Missing Cashback</Text>
              <Pressable onPress={resetMissingModal} hitSlop={12}><X size={20} color="#6B7280" /></Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.inputLabel}>Order URL / Order ID</Text>
              <TextInput style={s.input} placeholder="https://amazon.in/order/..." value={mcOrderUrl} onChangeText={setMcOrderUrl} autoCapitalize="none" placeholderTextColor="#9CA3AF" />

              <Text style={s.inputLabel}>Platform</Text>
              <View style={s.platformRow}>
                {PLATFORMS.map((p) => (
                  <Pressable
                    key={p}
                    style={[s.platformChip, mcPlatform === p && s.platformChipActive]}
                    onPress={() => setMcPlatform(p)}
                  >
                    <Text style={[s.platformChipText, mcPlatform === p && s.platformChipTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={s.inputLabel}>Order Amount (₹)</Text>
              <TextInput style={s.input} placeholder="1299" value={mcAmount} onChangeText={setMcAmount} keyboardType="numeric" placeholderTextColor="#9CA3AF" />

              <Text style={s.inputLabel}>Order Date (YYYY-MM-DD)</Text>
              <TextInput style={s.input} placeholder="2026-08-15" value={mcDate} onChangeText={setMcDate} placeholderTextColor="#9CA3AF" />

              <Text style={s.inputLabel}>Screenshot (optional)</Text>
              <TouchableOpacity style={s.uploadBtn} onPress={pickScreenshot} disabled={mcUploading}>
                {mcUploading
                  ? <ActivityIndicator size="small" color={INDIGO} />
                  : <>
                      <ImagePlus size={18} color={mcScreenshotUrl ? '#059669' : INDIGO} />
                      <Text style={[s.uploadBtnText, mcScreenshotUrl ? { color: '#059669' } : {}]}>
                        {mcScreenshotUrl ? 'Screenshot uploaded ✓' : 'Upload screenshot'}
                      </Text>
                    </>}
              </TouchableOpacity>

              <Pressable style={s.modalBtn} onPress={handleMissingSubmit} disabled={mcSubmitting}>
                {mcSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={s.modalBtnText}>Submit Request</Text>}
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:                { flex: 1, backgroundColor: '#F9FAFB' },
  centered:            { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:              { padding: 16, paddingBottom: 40 },
  balanceCard:         { backgroundColor: INDIGO, borderRadius: 20, padding: 24, marginBottom: 16 },
  balanceRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  balanceLabel:        { color: '#C7D2FE', fontSize: 14, fontWeight: '500' },
  balanceAmount:       { fontSize: 40, fontWeight: '800', color: '#fff', marginBottom: 20, letterSpacing: -1 },
  balanceBtnRow:       { flexDirection: 'row', gap: 10 },
  withdrawBtn:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  withdrawBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  missingBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  missingBtnText:      { color: '#C7D2FE', fontSize: 13, fontWeight: '600' },
  card:                { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle:           { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  checkinHint:         { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  checkinBtn:          { backgroundColor: INDIGO, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  checkinBtnText:      { color: '#fff', fontWeight: '700', fontSize: 14 },
  checkinDone:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkinDoneText:     { color: '#059669', fontWeight: '600', fontSize: 14 },
  emptyText:           { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  txRow:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  txLeft:              { flexDirection: 'row', alignItems: 'center' },
  txAmount:            { fontSize: 15, fontWeight: '700', color: '#111827' },
  txDate:              { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText:          { fontSize: 12, fontWeight: '700' },
  overlay:             { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:               { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  sheetHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sheetTitle:          { fontSize: 18, fontWeight: '700', color: '#111827' },
  sheetBalance:        { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  inputLabel:          { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:               { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', marginBottom: 16 },
  platformRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  platformChip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  platformChipActive:  { borderColor: INDIGO, backgroundColor: '#EEF2FF' },
  platformChipText:    { fontSize: 13, fontWeight: '600', color: '#374151' },
  platformChipTextActive:{ color: INDIGO },
  uploadBtn:           { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 20, justifyContent: 'center' },
  uploadBtnText:       { fontSize: 14, fontWeight: '600', color: INDIGO },
  modalBtn:            { backgroundColor: INDIGO, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  modalBtnText:        { color: '#fff', fontWeight: '700', fontSize: 16 },
});
