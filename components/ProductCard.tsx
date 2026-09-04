import React from 'react';
import { View, Text, Image, Pressable, Dimensions } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { Product } from '../lib/types';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  Amazon:  { bg: '#FEF3C7', text: '#92400E' },
  Flipkart:{ bg: '#DBEAFE', text: '#1E40AF' },
  Meesho:  { bg: '#FCE7F3', text: '#9D174D' },
  Myntra:  { bg: '#FEE2E2', text: '#991B1B' },
};

function ImageOrPlaceholder({ uri, width, height }: { uri: string | null; width: number; height: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width, height }} resizeMode="cover" />;
  }
  return (
    <View style={{ width, height }} className="items-center justify-center bg-gray-100">
      <ShoppingBag size={32} color="#9CA3AF" />
    </View>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors = PLATFORM_COLORS[platform] ?? { bg: '#F3F4F6', text: '#374151' };
  return (
    <View style={{ backgroundColor: colors.bg, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, marginBottom: 4 }}>
      <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>{platform}</Text>
    </View>
  );
}

type Props = {
  product: Product;
  onPress: (product: Product) => void;
  featured?: boolean;
};

export default function ProductCard({ product, onPress, featured = false }: Props) {
  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  };

  if (featured) {
    return (
      <Pressable onPress={() => onPress(product)} style={[cardStyle, { width: 180, marginRight: 12 }]}>
        <ImageOrPlaceholder uri={product.image_url} width={180} height={130} />
        <View style={{ padding: 10 }}>
          {product.platform && <PlatformBadge platform={product.platform} />}
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={2}>{product.name}</Text>
          {product.price != null && (
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#4F46E5', marginTop: 4 }}>
              ₹{product.price.toLocaleString('en-IN')}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => onPress(product)} style={[cardStyle, { width: CARD_WIDTH, marginBottom: 16 }]}>
      <ImageOrPlaceholder uri={product.image_url} width={CARD_WIDTH} height={CARD_WIDTH * 0.85} />
      <View style={{ padding: 10 }}>
        {product.platform && <PlatformBadge platform={product.platform} />}
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#1F2937' }} numberOfLines={2}>{product.name}</Text>
        {product.price != null && (
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#4F46E5', marginTop: 4 }}>
            ₹{product.price.toLocaleString('en-IN')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
