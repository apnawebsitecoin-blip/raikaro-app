import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, BellOff } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../lib/types';

const INDIGO = '#4F46E5';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data as Notification[]);
  }, [userId]);

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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

      {unreadCount > 0 && (
        <Pressable style={s.markAllRow} onPress={markAllRead}>
          <Text style={s.markAllText}>Mark all as read ({unreadCount})</Text>
        </Pressable>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notifications.length === 0 ? s.emptyFlex : s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={INDIGO} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <BellOff size={56} color="#E5E7EB" />
            <Text style={s.emptyTitle}>Koi notification nahi</Text>
            <Text style={s.emptySubtitle}>Nayi notifications yahan dikhayenge</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[s.card, !item.read && s.cardUnread]}
            onPress={() => !item.read && markRead(item.id)}
          >
            <View style={[s.dot, item.read ? s.dotRead : s.dotUnread]} />
            <View style={s.cardBody}>
              <Text style={[s.message, !item.read && s.messageUnread]}>{item.message}</Text>
              <Text style={s.time}>{formatTime(item.created_at)}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#F9FAFB' },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  markAllRow:    { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'flex-end' },
  markAllText:   { fontSize: 13, fontWeight: '600', color: INDIGO },
  list:          { paddingHorizontal: 16, paddingBottom: 32 },
  emptyFlex:     { flexGrow: 1 },
  emptyContainer:{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  card:          { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  cardUnread:    { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  dot:           { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 12, flexShrink: 0 },
  dotUnread:     { backgroundColor: INDIGO },
  dotRead:       { backgroundColor: '#D1D5DB' },
  cardBody:      { flex: 1 },
  message:       { fontSize: 14, color: '#374151', lineHeight: 20 },
  messageUnread: { fontWeight: '600', color: '#111827' },
  time:          { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
});
