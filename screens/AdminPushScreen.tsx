import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  Alert, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export default function AdminPushScreen() {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Enter a notification title.'); return; }
    if (!body.trim())  { Alert.alert('Required', 'Enter a notification message.'); return; }

    Alert.alert(
      'Send to all users?',
      `This will push:\n\n"${title.trim()}"\n${body.trim()}\n\nto every user with notifications enabled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send', style: 'default', onPress: async () => {
            setSending(true);
            const { data, error } = await supabase.functions.invoke('send-push', {
              body: { title: title.trim(), body: body.trim() },
            });
            setSending(false);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Sent!', `Delivered to ${data?.sent ?? 0} device(s).`);
              setTitle('');
              setBody('');
            }
          },
        },
      ],
    );
  };

  const handleTestSelf = async () => {
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSending(false); Alert.alert('Not logged in'); return; }

    const { data, error } = await supabase.functions.invoke('send-push', {
      body: {
        title: 'Test notification ✅',
        body: 'Push notifications are working end-to-end!',
        target_user_ids: [session.user.id],
      },
    });
    setSending(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Test sent!', `Delivered to ${data?.sent ?? 0} device(s).\n\nIf you don't see it, check that notifications are enabled for this app in your device settings.`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={{ padding: 20, gap: 4 }} keyboardShouldPersistTaps="handled">
        <Text style={[s.heading, { color: colors.text }]}>Push Notifications</Text>
        <Text style={[s.sub, { color: colors.textSub }]}>
          Send a broadcast to all users, or tap "Send test to myself" to verify the pipeline first.
        </Text>

        <Text style={[s.label, { color: colors.textSub }]}>TITLE</Text>
        <TextInput
          style={[s.input, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Flash Sale — 60% off Electronics!"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[s.label, { color: colors.textSub }]}>MESSAGE</Text>
        <TextInput
          style={[s.input, s.multiline, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.card }]}
          value={body}
          onChangeText={setBody}
          placeholder="e.g. Grab the best deals on Amazon before midnight tonight."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Pressable
          onPress={handleSend}
          disabled={sending}
          style={[s.btn, { backgroundColor: colors.indigo }]}
        >
          {sending
            ? <ActivityIndicator color="#fff" />
            : <>
                <Send size={18} color="#fff" />
                <Text style={s.btnText}>Send to all users</Text>
              </>}
        </Pressable>

        <Pressable
          onPress={handleTestSelf}
          disabled={sending}
          style={[s.btn, s.testBtn, { borderColor: colors.indigo }]}
        >
          <Text style={[s.btnText, { color: colors.indigo }]}>Send test to myself</Text>
        </Pressable>

        <View style={[s.note, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.noteText, { color: colors.textSub }]}>
            💡 Price drop alerts are sent automatically when you update a product price in the Products admin and there are users with active price alerts for that product.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  heading:   { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  sub:       { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  label:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  input:     { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 4 },
  multiline: { minHeight: 100 },
  btn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, marginTop: 16 },
  testBtn:   { backgroundColor: 'transparent', borderWidth: 1.5 },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  note:      { marginTop: 28, padding: 14, borderRadius: 12, borderWidth: 1 },
  noteText:  { fontSize: 13, lineHeight: 19 },
});
