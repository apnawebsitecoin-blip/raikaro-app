import React from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, ClipboardList, ChevronRight, ShieldCheck, Ticket, Landmark, Bell, Link, LayoutGrid, Store, Crown, Settings, FileText } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function AdminScreen({ navigation }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <ShieldCheck size={20} color={colors.indigo} />
        <Text style={[s.title, { color: colors.text }]}>Admin Panel</Text>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <AdminRow
          icon={<Package size={20} color={colors.indigo} />}
          iconBg={colors.indigoMuted}
          label="Products"
          subtitle="Add, edit, and manage all products"
          colors={colors}
          onPress={() => navigation.navigate('AdminProducts')}
        />
        <AdminRow
          icon={<ClipboardList size={20} color="#D97706" />}
          iconBg="#FEF3C7"
          label="Submitted Deals"
          subtitle="Review and approve community submissions"
          colors={colors}
          onPress={() => navigation.navigate('AdminSubmittedDeals')}
        />
        <AdminRow
          icon={<Ticket size={20} color="#059669" />}
          iconBg="#DCFCE7"
          label="Coupons"
          subtitle="Add coupons, verify freshness, mark expired"
          colors={colors}
          onPress={() => navigation.navigate('AdminCoupons')}
        />
        <AdminRow
          icon={<Landmark size={20} color="#2563EB" />}
          iconBg="#DBEAFE"
          label="Bank Offers"
          subtitle="Manage bank/card discount offers"
          colors={colors}
          onPress={() => navigation.navigate('AdminBankOffers')}
        />
        <AdminRow
          icon={<Bell size={20} color="#7C3AED" />}
          iconBg="#EDE9FE"
          label="Push Notifications"
          subtitle="Broadcast alerts and test the pipeline"
          colors={colors}
          onPress={() => navigation.navigate('AdminPush')}
        />
        <AdminRow
          icon={<Link size={20} color="#059669" />}
          iconBg="#DCFCE7"
          label="Affiliate Settings"
          subtitle="Configure affiliate tags per platform"
          colors={colors}
          onPress={() => navigation.navigate('AdminAffiliate')}
        />
        <AdminRow
          icon={<LayoutGrid size={20} color="#0284C7" />}
          iconBg="#E0F2FE"
          label="Categories"
          subtitle="Add, edit, and reorder product categories"
          colors={colors}
          onPress={() => navigation.navigate('AdminCategories')}
        />
        <AdminRow
          icon={<Store size={20} color="#D97706" />}
          iconBg="#FEF3C7"
          label="Platforms"
          subtitle="Manage cashback platforms and their labels"
          colors={colors}
          onPress={() => navigation.navigate('AdminPlatforms')}
        />
        <AdminRow
          icon={<Crown size={20} color="#F59E0B" />}
          iconBg="#FEF3C7"
          label="Premium Plan"
          subtitle="Edit price, period, and benefits list"
          colors={colors}
          onPress={() => navigation.navigate('AdminPremium')}
        />
        <AdminRow
          icon={<Settings size={20} color="#6B7280" />}
          iconBg="#F3F4F6"
          label="App Settings"
          subtitle="Maintenance mode and global toggles"
          colors={colors}
          onPress={() => navigation.navigate('AdminSettings')}
        />
        <AdminRow
          icon={<FileText size={20} color="#7C3AED" />}
          iconBg="#EDE9FE"
          label="Content Pages"
          subtitle="Edit FAQ, Help, Terms & Privacy"
          colors={colors}
          onPress={() => navigation.navigate('AdminContent')}
        />
      </View>
    </SafeAreaView>
  );
}

function AdminRow({
  icon, iconBg, label, subtitle, colors, onPress,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[s.rowSub, { color: colors.textSub }]}>{subtitle}</Text>
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  header:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1 },
  title:    { fontSize: 20, fontWeight: '800' },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub:   { fontSize: 12, marginTop: 2 },
});
