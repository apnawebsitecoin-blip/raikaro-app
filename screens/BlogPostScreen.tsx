import React from 'react';
import { View, Text, ScrollView, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlogPost } from '../lib/types';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../lib/theme';

function applyInline(text: string, colors: ThemeColors): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return (
            <Text key={i} style={{ fontWeight: '700', color: colors.text }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

function renderLine(line: string, index: number, colors: ThemeColors): React.ReactNode {
  if (/^### /.test(line)) {
    return (
      <Text key={index} style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 12 }}>
        {line.slice(4)}
      </Text>
    );
  }
  if (/^## /.test(line)) {
    return (
      <Text key={index} style={{ fontSize: 19, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 16, lineHeight: 26 }}>
        {line.slice(3)}
      </Text>
    );
  }
  if (/^# /.test(line)) {
    return (
      <Text key={index} style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 12, marginTop: 18, lineHeight: 30 }}>
        {line.slice(2)}
      </Text>
    );
  }
  if (/^[-*] /.test(line)) {
    return (
      <View key={index} style={{ flexDirection: 'row', marginBottom: 6, paddingLeft: 8 }}>
        <Text style={{ fontSize: 15, color: colors.indigo, marginRight: 8, marginTop: 2 }}>•</Text>
        <Text style={{ flex: 1, fontSize: 14, color: colors.textSub, lineHeight: 22 }}>
          {applyInline(line.slice(2), colors)}
        </Text>
      </View>
    );
  }
  if (!line.trim()) {
    return <View key={index} style={{ height: 8 }} />;
  }
  return (
    <Text key={index} style={{ fontSize: 14, color: colors.textSub, lineHeight: 23, marginBottom: 8 }}>
      {applyInline(line, colors)}
    </Text>
  );
}

export default function BlogPostScreen({ route }: { route: any }) {
  const { post } = route.params as { post: BlogPost };
  const { colors } = useTheme();
  const lines = (post.content ?? '').split('\n');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <StatusBar barStyle={colors.statusBar} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {post.cover_image ? (
          <Image source={{ uri: post.cover_image }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
        ) : null}

        <View style={{ padding: 20 }}>
          {post.category ? (
            <View style={{ backgroundColor: colors.indigoMuted, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.indigo }}>{post.category}</Text>
            </View>
          ) : null}

          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, lineHeight: 32, marginBottom: 8 }}>
            {post.title}
          </Text>

          {post.published_at ? (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 20 }}>
              {new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          ) : null}

          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 20 }} />

          {lines.map((line, i) => renderLine(line, i, colors))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
