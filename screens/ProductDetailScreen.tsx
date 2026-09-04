import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, FlatList, Image, Pressable,
  Linking, ActivityIndicator, Dimensions, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, ExternalLink, ShoppingBag, ChevronLeft } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
import { Product, ProductImage } from '../lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INDIGO = '#4F46E5';

const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  Amazon:  { bg: '#FEF3C7', text: '#92400E' },
  Flipkart:{ bg: '#DBEAFE', text: '#1E40AF' },
  Meesho:  { bg: '#FCE7F3', text: '#9D174D' },
  Myntra:  { bg: '#FEE2E2', text: '#991B1B' },
};

type Props = { navigation: NativeStackNavigationProp<any>; route: any };

export default function ProductDetailScreen({ navigation, route }: Props) {
  const { product } = route.params;
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true);
  // TODO: Connect to wishlists table (supabase.from('wishlists').insert/delete)
  const [wishlisted, setWishlisted] = useState(false);

  const platformStyle = product.platform ? PLATFORM_COLORS[product.platform] : null;

  useEffect(() => {
    async function fetchImages() {
      const { data } = await supabase
        .from('product_images')
        .select('image_url, display_order')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });

      const galleryImages: string[] = data?.map((r: Pick<ProductImage, 'image_url'>) => r.image_url) ?? [];

      if (galleryImages.length === 0 && product.image_url) {
        setImages([product.image_url]);
      } else {
        setImages(galleryImages);
      }
      setLoadingImages(false);
    }
    fetchImages();
  }, [product.id, product.image_url]);

  const handleBuyNow = async () => {
    const supported = await Linking.canOpenURL(product.original_url);
    if (supported) {
      Linking.openURL(product.original_url);
    } else {
      Alert.alert('Error', 'Cannot open this URL');
    }
  };

  const onScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(idx);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={{ backgroundColor: '#F9FAFB' }}>
          {loadingImages ? (
            <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={INDIGO} />
            </View>
          ) : images.length > 0 ? (
            <>
              <FlatList
                data={images}
                keyExtractor={(_, i) => String(i)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85 }}
                    resizeMode="contain"
                  />
                )}
              />
              {/* Dot indicators */}
              {images.length > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 12, gap: 6 }}>
                  {images.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: i === activeIndex ? 20 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: i === activeIndex ? INDIGO : '#D1D5DB',
                      }}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85, alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={64} color="#D1D5DB" />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={{ padding: 20 }}>
          {/* Platform badge */}
          {product.platform && platformStyle && (
            <View style={{ backgroundColor: platformStyle.bg, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, marginBottom: 10 }}>
              <Text style={{ color: platformStyle.text, fontSize: 12, fontWeight: '700' }}>{product.platform}</Text>
            </View>
          )}

          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', lineHeight: 28, marginBottom: 8 }}>
            {product.name}
          </Text>

          {product.price != null && (
            <Text style={{ fontSize: 28, fontWeight: '800', color: INDIGO, marginBottom: 16 }}>
              ₹{product.price.toLocaleString('en-IN')}
            </Text>
          )}

          {product.category && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>Category: </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{product.category}</Text>
            </View>
          )}

          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 20 }} />

          <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>
            Tap "Buy Now" to get the best price on {product.platform ?? 'the store'}. Raikaro earns a small affiliate commission at no extra cost to you.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingVertical: 14,
        borderTopWidth: 1, borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
      }}>
        {/* Wishlist button */}
        <Pressable
          onPress={() => setWishlisted((w) => !w)}
          style={{
            width: 52, height: 52, borderRadius: 16,
            borderWidth: 1.5, borderColor: wishlisted ? '#EF4444' : '#E5E7EB',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: wishlisted ? '#FEF2F2' : '#fff',
          }}
        >
          <Heart
            size={22}
            color={wishlisted ? '#EF4444' : '#9CA3AF'}
            fill={wishlisted ? '#EF4444' : 'transparent'}
          />
        </Pressable>

        {/* Buy Now button */}
        <Pressable
          onPress={handleBuyNow}
          style={{
            flex: 1, height: 52, borderRadius: 16,
            backgroundColor: INDIGO, flexDirection: 'row',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Buy Now</Text>
          <ExternalLink size={16} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
