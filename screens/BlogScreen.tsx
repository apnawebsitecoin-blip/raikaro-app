import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, Image, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, ChevronRight } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { BlogPost } from '../lib/types';
import { useTheme } from '../context/ThemeContext';

export default function BlogScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setPosts(data as BlogPost[]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle={colors.statusBar} />
        <ActivityIndicator size="large" color={colors.indigo} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <StatusBar barStyle={colors.statusBar} />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <BookOpen size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textSub, marginTop: 12, fontSize: 15 }}>No guides yet — check back soon!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('BlogPost', { post: item })}
            style={{ backgroundColor: colors.card, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
          >
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
            ) : (
              <View style={{ width: '100%', height: 100, backgroundColor: colors.indigoMuted, alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={32} color={colors.indigo} />
              </View>
            )}
            <View style={{ padding: 14 }}>
              {item.category && (
                <View style={{ backgroundColor: colors.indigoMuted, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.indigo }}>{item.category}</Text>
                </View>
              )}
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6, lineHeight: 22 }} numberOfLines={2}>
                {item.title}
              </Text>
              {item.meta_description ? (
                <Text style={{ fontSize: 13, color: colors.textSub, lineHeight: 19 }} numberOfLines={3}>
                  {item.meta_description}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {item.published_at
                    ? new Date(item.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : ''}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.indigo }}>Read</Text>
                  <ChevronRight size={14} color={colors.indigo} />
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
