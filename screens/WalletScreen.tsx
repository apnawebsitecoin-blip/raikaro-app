import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, RefreshControl,
  Modal, TextInput, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, ArrowDownCircle, CheckCircle, Clock, XCircle, Gift, X } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Profile, WithdrawalRequest, DailyCheckin } from '../lib/types';

const INDIGO = '#4F46E5';

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: React.ComponentType<any> }> = {
  pending:  { label: 'Pending',  color: '#D97706', Icon: Clock },
  approved: { label: 'Approved', color: '#059669', Icon: CheckCircle },
  paid:     { label: 'Paid',     color: '#2563EB', Icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#DC2626', Icon: XCircle },
};

export default function WalletScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    const [profileRes, withdrawalRes, checkinRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('withdrawal_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
      supabase.from('daily_checkins').select('*').eq('user_id', userId).eq('checked_in_at', today).maybeSingle(),
    ]);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (withdrawalRes.data) setWithdrawals(withdrawalRes.data as WithdrawalRequest[]);
    setTodayCheckin(checkinRes.data as DailyCheckin | null);
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
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('', '₹5 credited to your wallet!');
      await fetchData();
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!userId) return;
    if (isNaN(amount) || amount < 100) {
      Alert.alert('Invalid amount', 'Minimum withdrawal is ₹100');
      return;
    }
    if (!withdrawUpi.trim()) {
      Alert.alert('UPI required', 'Please enter your UPI ID');
      return;
    }
    if (profile && amount > profile.wallet_balance) {
      Alert.alert('Insufficient balance', `Your balance is ₹${profile.wallet_balance}`);
      return;
    }
    setWithdrawLoading(true);
    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: userId,
      amount,
      upi_id: withdrawUpi.trim(),
    });
    setWithdrawLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setModalVisible(false);
      setWithdrawAmount('');
      setWithdrawUpi('');
      Alert.alert('Request submitted', 'Your withdrawal request has been submitted. It will be processed within 2-3 business days.');
      await fetchData();
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
          <Pressable style={s.withdrawBtn} onPress={() => setModalVisible(true)} android_ripple={{ color: '#6366F1' }}>
            <ArrowDownCircle size={16} color="#fff" />
            <Text style={s.withdrawBtnText}>Withdraw</Text>
          </Pressable>
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
                {checkinLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.checkinBtnText}>Check in — Earn ₹5</Text>}
              </Pressable>
            </>
          )}
        </View>

        {/* Transaction history */}
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
      </ScrollView>

      {/* Withdraw modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Withdraw Funds</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>
            <Text style={s.modalBalance}>Balance: ₹{(profile?.wallet_balance ?? 0).toLocaleString('en-IN')}</Text>

            <Text style={s.inputLabel}>Amount (min ₹100)</Text>
            <TextInput
              style={s.input}
              placeholder="Enter amount"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={s.inputLabel}>UPI ID</Text>
            <TextInput
              style={s.input}
              placeholder="yourname@upi"
              value={withdrawUpi}
              onChangeText={setWithdrawUpi}
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            <Pressable style={s.modalBtn} onPress={handleWithdraw} disabled={withdrawLoading}>
              {withdrawLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.modalBtnText}>Submit Request</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#F9FAFB' },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:          { padding: 16, paddingBottom: 40 },
  balanceCard:     { backgroundColor: INDIGO, borderRadius: 20, padding: 24, marginBottom: 16 },
  balanceRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  balanceLabel:    { color: '#C7D2FE', fontSize: 14, fontWeight: '500' },
  balanceAmount:   { fontSize: 40, fontWeight: '800', color: '#fff', marginBottom: 20, letterSpacing: -1 },
  withdrawBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  withdrawBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle:       { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  checkinHint:     { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  checkinBtn:      { backgroundColor: INDIGO, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  checkinBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  checkinDone:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkinDoneText: { color: '#059669', fontWeight: '600', fontSize: 14 },
  emptyText:       { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  txRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  txLeft:          { flexDirection: 'row', alignItems: 'center' },
  txAmount:        { fontSize: 15, fontWeight: '700', color: '#111827' },
  txDate:          { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText:      { fontSize: 12, fontWeight: '700' },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalTitle:      { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalBalance:    { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  inputLabel:      { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:           { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', marginBottom: 16 },
  modalBtn:        { backgroundColor: INDIGO, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  modalBtnText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
});
