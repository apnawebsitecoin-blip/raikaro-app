/**
 * PremiumScreen — DEMO/PLACEHOLDER only.
 * The "Subscribe" button toggles is_premium in the DB locally
 * so UI gating can be tested. Real payment (RevenueCat / in-app purchase)
 * will replace this flow in a separate integration sprint.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Crown, CheckCircle2, ChevronLeft, Zap, Shield, Star, Clock,
} from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const GOLD = '#F59E0B';
const GOLD_LIGHT = '#FEF3C7';
const GOLD_DARK = '#92400E';

const BENEFITS = [
  { Icon: Zap,        title: 'Ad-free experience',         desc: 'Browse deals without any interruptions' },
  { Icon: Star,       title: 'Early access to deals',      desc: 'See flash deals 24 hours before everyone else' },
  { Icon: Shield,     title: 'Priority cashback support',  desc: 'Missing cashback resolved in 24 hrs, not 7 days' },
  { Icon: Crown,      title: 'Premium badge & profile',    desc: 'Gold crown on your profile and reviews' },
  { Icon: Clock,      title: 'Extended coupon window',     desc: 'Coupons stay valid 2× longer for Premium members' },
];

type Props = { navigation: any };

export default function PremiumScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from('profiles').select('is_premium').eq('id', userId).single()
      .then(({ data }) => {
        setIsPremium(data?.is_premium ?? false);
        setLoading(false);
      });
  }, [userId]);

  const handleSubscribe = async () => {
    if (!userId) return;
    setSubscribing(true);
    const newVal = !isPremium;
    await supabase.from('profiles').update({ is_premium: newVal }).eq('id', userId);
    setIsPremium(newVal);
    setSubscribing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={GOLD} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Nav bar */}
      <View style={s.nav}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[s.navTitle, { color: colors.text }]}>Raikaro Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero */}
        <View style={[s.hero, { backgroundColor: GOLD_LIGHT }]}>
          <View style={s.crownCircle}>
            <Crown size={36} color={GOLD} />
          </View>
          <Text style={s.heroTitle}>Raikaro Premium</Text>
          <Text style={s.heroSub}>Unlock the full cashback experience</Text>

          {/* Price pill */}
          <View style={s.pricePill}>
            <Text style={s.priceAmount}>₹99</Text>
            <Text style={s.priceUnit}>/month</Text>
          </View>

          {isPremium && (
            <View style={s.activeBadge}>
              <CheckCircle2 size={14} color="#059669" />
              <Text style={s.activeBadgeText}>Active on your account</Text>
            </View>
          )}
        </View>

        {/* Demo disclaimer */}
        <View style={[s.disclaimer, { backgroundColor: colors.amberMuted, borderColor: colors.amber + '40' }]}>
          <Text style={[s.disclaimerText, { color: GOLD_DARK }]}>
            ⚠️ Demo mode: The Subscribe button toggles a flag in your profile for UI testing only. Real payment integration (via in-app purchases) will be added in a separate sprint.
          </Text>
        </View>

        {/* Benefits */}
        <Text style={[s.sectionTitle, { color: colors.text }]}>What you get</Text>
        <View style={[s.benefitsCard, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
          {BENEFITS.map(({ Icon, title, desc }, i) => (
            <View key={title}>
              {i > 0 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
              <View style={s.benefitRow}>
                <View style={s.benefitIcon}>
                  <Icon size={18} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.benefitTitle, { color: colors.text }]}>{title}</Text>
                  <Text style={[s.benefitDesc, { color: colors.textSub }]}>{desc}</Text>
                </View>
                <CheckCircle2 size={16} color={isPremium ? '#059669' : colors.textMuted} />
              </View>
            </View>
          ))}
        </View>

        {/* Subscribe / Unsubscribe button */}
        <Pressable
          onPress={handleSubscribe}
          disabled={subscribing}
          style={[s.cta, { backgroundColor: isPremium ? '#FEE2E2' : GOLD }]}
        >
          {subscribing
            ? <ActivityIndicator color={isPremium ? '#DC2626' : '#fff'} />
            : (
              <>
                <Crown size={18} color={isPremium ? '#DC2626' : '#fff'} />
                <Text style={[s.ctaText, { color: isPremium ? '#DC2626' : '#fff' }]}>
                  {isPremium ? 'Cancel Premium (Demo)' : 'Subscribe — ₹99/month (Demo)'}
                </Text>
              </>
            )}
        </Pressable>

        <Text style={[s.footerNote, { color: colors.textMuted }]}>
          No real charge will be made. This is a UI prototype for testing premium-gated features.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  nav:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle:     { fontSize: 17, fontWeight: '800' },

  hero:         { marginHorizontal: 16, borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 16 },
  crownCircle:  { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: GOLD, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  heroTitle:    { fontSize: 24, fontWeight: '900', color: GOLD_DARK, letterSpacing: -0.5, marginBottom: 6 },
  heroSub:      { fontSize: 14, color: GOLD_DARK, opacity: 0.7, textAlign: 'center', marginBottom: 16 },
  pricePill:    { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10, gap: 3 },
  priceAmount:  { fontSize: 28, fontWeight: '900', color: GOLD_DARK },
  priceUnit:    { fontSize: 14, fontWeight: '600', color: GOLD_DARK, paddingBottom: 4 },
  activeBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: '#ECFDF5', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  activeBadgeText: { fontSize: 12, fontWeight: '700', color: '#059669' },

  disclaimer:   { marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1 },
  disclaimerText: { fontSize: 12, lineHeight: 18 },

  sectionTitle: { fontSize: 17, fontWeight: '700', paddingHorizontal: 16, marginBottom: 10 },
  benefitsCard: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  benefitRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  benefitIcon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: GOLD_LIGHT, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  benefitDesc:  { fontSize: 12, lineHeight: 17 },
  divider:      { height: 1, marginHorizontal: 16 },

  cta:          { marginHorizontal: 16, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  ctaText:      { fontSize: 16, fontWeight: '800' },
  footerNote:   { fontSize: 11, textAlign: 'center', paddingHorizontal: 24, lineHeight: 16 },
});
