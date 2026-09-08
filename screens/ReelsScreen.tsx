import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, Pressable, Image, Linking,
  ActivityIndicator, StatusBar, Share, Dimensions, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Share2, ShoppingBag } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { VideoReview, Product } from '../lib/types';

const { width: W, height: H } = Dimensions.get('window');

type ReelItem = VideoReview & { product: Product | null };

type Props = { navigation: NativeStackNavigationProp<any> };

export default function ReelsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const flatRef = useRef<FlatList>(null);

  const fetchReels = useCallback(async () => {
    const { data } = await supabase
      .from('video_reviews')
      .select('*')
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!data || data.length === 0) { setLoading(false); return; }

    const videos = data as VideoReview[];
    const productIds = [...new Set(videos.map((v) => v.product_id))];
    const { data: products } = await supabase
      .from('products')
      .select('id, name, image_url, platform, original_url')
      .in('id', productIds);
    const productMap = new Map((products ?? []).map((p: any) => [p.id, p as Product]));

    setReels(videos.map((v) => ({ ...v, product: productMap.get(v.product_id) ?? null })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  const openYouTube = (videoId: string) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  const handleShare = async (item: ReelItem) => {
    try {
      await Share.share({
        title: item.title,
        message: `Watch this review: ${item.title}\nhttps://www.youtube.com/watch?v=${item.youtube_video_id}`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={[s.loader, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={s.loader}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={{ color: '#9CA3AF', fontSize: 15, textAlign: 'center', paddingHorizontal: 40 }}>
          No video reviews yet. Be the first to submit one!
        </Text>
      </View>
    );
  }

  const REEL_H = H;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      <FlatList
        ref={flatRef}
        data={reels}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: REEL_H, offset: REEL_H * index, index })}
        renderItem={({ item }) => (
          <ReelCard
            item={item}
            height={REEL_H}
            insets={insets}
            onPlay={() => openYouTube(item.youtube_video_id)}
            onShare={() => handleShare(item)}
            onProduct={() => item.product && navigation.navigate('ProductDetail', { product: item.product })}
          />
        )}
      />

      {/* Back button — floats top-left over the dark reel */}
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={16}
        style={[s.backBtn, { top: insets.top + 8 }]}
      >
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '300' }}>←</Text>
      </Pressable>
    </View>
  );
}

function ReelCard({
  item, height, insets, onPlay, onShare, onProduct,
}: {
  item: ReelItem;
  height: number;
  insets: { top: number; bottom: number };
  onPlay: () => void;
  onShare: () => void;
  onProduct: () => void;
}) {
  const thumbUri = `https://img.youtube.com/vi/${item.youtube_video_id}/maxresdefault.jpg`;

  return (
    <Pressable onPress={onPlay} style={[s.reel, { height }]}>
      {/* Full-screen YouTube thumbnail */}
      <Image
        source={{ uri: thumbUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        defaultSource={require('../assets/icon.png')}
      />

      {/* Dark gradient overlay — bottom 50% */}
      <View style={s.gradient} />

      {/* Play button — center */}
      <View style={s.playWrap}>
        <View style={s.playBtn}>
          <Text style={{ color: '#fff', fontSize: 28, marginLeft: 5 }}>▶</Text>
        </View>
        <Text style={s.playLabel}>Tap to watch on YouTube</Text>
      </View>

      {/* Bottom info overlay */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {/* Product row */}
        {item.product && (
          <Pressable onPress={onProduct} style={s.productRow}>
            {item.product.image_url ? (
              <Image source={{ uri: item.product.image_url }} style={s.productThumb} resizeMode="cover" />
            ) : (
              <View style={[s.productThumb, { backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' }]}>
                <ShoppingBag size={14} color="#9CA3AF" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.productName} numberOfLines={1}>{item.product.name}</Text>
              {item.product.platform && (
                <Text style={s.productPlatform}>{item.product.platform}</Text>
              )}
            </View>
          </Pressable>
        )}

        {/* Title + description */}
        <Text style={s.reelTitle} numberOfLines={2}>{item.title}</Text>
        {item.description && (
          <Text style={s.reelDesc} numberOfLines={2}>{item.description}</Text>
        )}
      </View>

      {/* Right-side action icons */}
      <View style={[s.sideBar, { bottom: insets.bottom + 80 }]}>
        <Pressable onPress={onShare} style={s.sideBtn}>
          <Share2 size={22} color="#fff" />
          <Text style={s.sideBtnLabel}>Share</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  loader:       { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  backBtn:      { position: 'absolute', left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  reel:         { width: W, backgroundColor: '#111' },
  gradient:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.6)' },
  playWrap:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 10 },
  playBtn:      { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  playLabel:    { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },
  bottomBar:    { position: 'absolute', bottom: 0, left: 0, right: 72, paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  productRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  productThumb: { width: 36, height: 36, borderRadius: 8 },
  productName:  { fontSize: 12, fontWeight: '700', color: '#fff' },
  productPlatform: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  reelTitle:    { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 20 },
  reelDesc:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17 },
  sideBar:      { position: 'absolute', right: 12, gap: 20 },
  sideBtn:      { alignItems: 'center', gap: 4 },
  sideBtnLabel: { color: '#fff', fontSize: 10, fontWeight: '600' },
});
