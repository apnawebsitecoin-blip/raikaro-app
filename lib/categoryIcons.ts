import {
  Smartphone, Shirt, Home as HomeIcon, Sparkles, Dumbbell,
  BookOpen, ShoppingBag, UtensilsCrossed, Plane, Package,
  Laptop, Watch, Headphones, Camera, Gift, Tag, Coffee,
  Music, Tv, Baby, Car, Star, Heart, Zap, Globe, Gem,
} from 'lucide-react-native';
import React from 'react';

export const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Smartphone, Shirt, Home: HomeIcon, Sparkles, Dumbbell,
  BookOpen, ShoppingBag, UtensilsCrossed, Plane, Package,
  Laptop, Watch, Headphones, Camera, Gift, Tag, Coffee,
  Music, Tv, Baby, Car, Star, Heart, Zap, Globe, Gem,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export function resolveIcon(name: string): React.ComponentType<{ size: number; color: string }> {
  return ICON_MAP[name] ?? ShoppingBag;
}
