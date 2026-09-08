import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, Modal, Animated,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Home, Wallet, Users, User, Tag, Heart,
  Bell, HelpCircle, LogOut, LogIn, X, ChevronRight,
  ShoppingBag, BookOpen, PenLine,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const DRAWER_W = Dimensions.get('window').width * 0.8;
const INDIGO = '#4F46E5';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
};

export default function AppDrawer({ isOpen, onClose, navigation }: Props) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { t } = useLanguage();
  const slideX = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropAlpha = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, bounciness: 0, speed: 20, useNativeDriver: true }),
        Animated.timing(backdropAlpha, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: -DRAWER_W, duration: 200, useNativeDriver: true }),
        Animated.timing(backdropAlpha, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen, slideX, backdropAlpha]);

  const goTab = (tab: string, screen?: string) => {
    onClose();
    setTimeout(() => {
      if (screen) {
        navigation.getParent()?.navigate(tab, { screen });
      } else {
        navigation.getParent()?.navigate(tab);
      }
    }, 210);
  };

  const goStack = (screen: string) => {
    onClose();
    setTimeout(() => navigation.navigate(screen), 210);
  };

  const handleLogout = async () => {
    onClose();
    await supabase.auth.signOut();
  };

  const handleSignIn = () => {
    onClose();
    setTimeout(() => navigation.navigate('Login'), 210);
  };

  const email = session?.user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();

  const SECTIONS = [
    {
      title: t('drawer_section_menu'),
      items: [
        { label: t('drawer_home'),          Icon: Home,       onPress: onClose },
        { label: t('drawer_wallet'),        Icon: Wallet,     onPress: () => goTab('Wallet') },
        { label: t('drawer_refer'),         Icon: Users,      onPress: () => goTab('Refer') },
        { label: t('drawer_account'),       Icon: User,       onPress: () => goTab('Account') },
        { label: t('drawer_wishlist'),      Icon: Heart,      onPress: () => goTab('Account', 'Wishlist') },
        { label: t('drawer_notifications'), Icon: Bell,       onPress: () => goStack('Notifications') },
      ],
    },
    {
      title: t('drawer_section_shop'),
      items: [
        { label: t('drawer_all_deals'),    Icon: Tag,         onPress: () => goTab('Deals') },
        { label: t('drawer_top_stores'),   Icon: ShoppingBag, onPress: () => goTab('Deals') },
        { label: t('drawer_blog'),         Icon: BookOpen,    onPress: () => goTab('Account', 'Blog') },
        { label: t('drawer_write_review'), Icon: PenLine,     onPress: () => goStack('WriteReview') },
      ],
    },
    {
      title: t('drawer_section_support'),
      items: [
        { label: t('drawer_help'), Icon: HelpCircle, onPress: () => {} },
      ],
    },
  ];

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop — tap to close */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000', opacity: backdropAlpha.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }) },
          ]}
        />
      </Pressable>

      {/* Drawer panel */}
      <Animated.View style={[s.panel, { backgroundColor: colors.card, transform: [{ translateX: slideX }] }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

          {/* Branded header strip */}
          <View style={s.header}>
            <View style={s.headerRow}>
              <Text style={s.brandName}>Raikaro</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <View style={s.profileRow}>
              <View style={s.avatar}>
                {session
                  ? <Text style={s.avatarText}>{initials}</Text>
                  : <User size={20} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                {session ? (
                  <>
                    <Text style={s.emailText} numberOfLines={1}>{email}</Text>
                    <Text style={s.memberText}>{t('member_label')}</Text>
                  </>
                ) : (
                  <>
                    <Text style={s.emailText}>{t('guest_user')}</Text>
                    <Text style={s.memberText}>{t('guest_tagline')}</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Nav sections */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {SECTIONS.map((section) => (
              <View key={section.title} style={s.section}>
                <Text style={[s.sectionLabel, { color: colors.textMuted }]}>{section.title}</Text>
                {section.items.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={item.onPress}
                    style={({ pressed }) => [s.row, { backgroundColor: pressed ? colors.background : 'transparent' }]}
                  >
                    <item.Icon size={18} color={colors.textSub} />
                    <Text style={[s.rowLabel, { color: colors.text }]}>{item.label}</Text>
                    <ChevronRight size={13} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            ))}

            <View style={[s.divider, { backgroundColor: colors.border }]} />

            {session ? (
              <Pressable onPress={handleLogout} style={s.row}>
                <LogOut size={18} color="#EF4444" />
                <Text style={[s.rowLabel, { color: '#EF4444' }]}>{t('drawer_logout')}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleSignIn} style={s.row}>
                <LogIn size={18} color={INDIGO} />
                <Text style={[s.rowLabel, { color: INDIGO }]}>{t('drawer_sign_in')}</Text>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  panel: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: DRAWER_W,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24,
    shadowOffset: { width: 6, height: 0 }, elevation: 12,
  },
  header:     { backgroundColor: INDIGO, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brandName:  { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  emailText:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  memberText: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  section:    { paddingTop: 20, paddingBottom: 4 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 4 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 13 },
  rowLabel:   { flex: 1, fontSize: 14, fontWeight: '600' },
  divider:    { height: 1, marginHorizontal: 20, marginVertical: 8 },
});
