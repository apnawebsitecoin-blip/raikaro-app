import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StatusBar, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

type Props = { route: any };

export default function ContentPageScreen({ route }: Props) {
  const { slug, title: headerTitle } = route.params;
  const { colors } = useTheme();
  const [title, setTitle] = useState(headerTitle ?? '');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('content_pages').select('title,body').eq('slug', slug).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTitle(data.title);
          setBody(data.body ?? '');
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[s.title, { color: colors.text }]}>{title}</Text>
        <Text style={[s.body, { color: colors.textSub }]}>{body || 'Content coming soon.'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  title:  { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  body:   { fontSize: 14, lineHeight: 22 },
});
