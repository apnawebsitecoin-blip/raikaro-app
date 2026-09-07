import React from 'react';
import { View, Text, Image, Pressable, Dimensions, StyleSheet } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { Product } from '../lib/types';
import { cleanProductTitle } from '../lib/utils';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

// Muted pastel platform colors — professional fintech feel
const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  Amazon:   { bg: '#FEF9EC', text: '#92400E' },
  Flipkart: { bg: '#EFF6FF', text: '#1E40AF' },
  Meesho:   { bg: '#FAF5FF', text: '#7C3AED' },
  Myntra:   { bg: '#FFF1F2', text: '#BE123C' },
};

function ImageOrPlaceholder({ uri, width, height }: { uri: string | null; width: number; height: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width, height }} resizeMode="cover" />;
  }
  return (
    <View style={[s.placeholder, { width, height }]}>
      <View style={s.placeholderCircle}>
        <ShoppingBag size={22} color="#9CA3AF" />
      </View>
    </View>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const c = PLATFORM_COLORS[platform] ?? { bg: '#F3F4F6', text: '#6B7280' };
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.badgeText, { color: c.text }]}>{platform}</Text>
    </View>
  );
}

type Props = {
  product: Product;
  onPress: (product: Product) => void;
  featured?: boolean;
};

export default function ProductCard({ product, onPress, featured = false }: Props) {
  const displayName = cleanProductTitle(product.name);

  if (featured) {
    return (
      <Pressable onPress={() => onPress(product)} style={[s.card, s.featuredCard]}>
        <ImageOrPlaceholder uri={product.image_url} width={176} height={124} />
        <View style={s.body}>
          {product.platform && <PlatformBadge platform={product.platform} />}
          <Text style={s.name} numberOfLines={2}>{displayName}</Text>
          {product.price != null && (
            <Text style={s.price}>₹{product.price.toLocaleString('en-IN')}</Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => onPress(product)} style={[s.card, { width: CARD_WIDTH, marginBottom: 16 }]}>
      <ImageOrPlaceholder uri={product.image_url} width={CARD_WIDTH} height={CARD_WIDTH * 0.82} />
      <View style={s.body}>
        {product.platform && <PlatformBadge platform={product.platform} />}
        <Text style={[s.name, { fontWeight: '500' }]} numberOfLines={2}>{displayName}</Text>
        {product.price != null && (
          <Text style={s.price}>₹{product.price.toLocaleString('en-IN')}</Text>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F2',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featuredCard: {
    width: 176,
    marginRight: 12,
  },
  body: {
    padding: 10,
    gap: 3,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    marginBottom: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
  },
  placeholderCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9EAEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
