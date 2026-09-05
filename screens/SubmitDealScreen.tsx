import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const INDIGO = '#4F46E5';
const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Food', 'Travel', 'Other'];

export default function SubmitDealScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;
    if (!productName.trim()) { Alert.alert('Required', 'Please enter the product name.'); return; }
    if (!productUrl.trim()) { Alert.alert('Required', 'Please enter the product URL.'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('community_deals').insert({
      user_id: userId,
      product_name: productName.trim(),
      product_url: productUrl.trim(),
      price: price ? parseFloat(price) : null,
      category: category || null,
      description: description.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48 }}>🎉</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 16, marginBottom: 8, textAlign: 'center' }}>Deal Submitted!</Text>
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 }}>
          Our team will review your deal. If approved, it will appear on the app for everyone!
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={{ backgroundColor: '#EEF2FF', borderRadius: 14, padding: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: INDIGO, marginBottom: 4 }}>Found a great deal?</Text>
          <Text style={{ fontSize: 13, color: '#4338CA', lineHeight: 20 }}>Share it with the community! Approved deals earn you bonus rewards.</Text>
        </View>

        <Label text="Product Name *" />
        <Input placeholder="e.g. boAt Rockerz 450 Headphones" value={productName} onChangeText={setProductName} />

        <Label text="Product URL *" />
        <Input placeholder="https://amazon.in/..." value={productUrl} onChangeText={setProductUrl} autoCapitalize="none" keyboardType="url" />

        <Label text="Price (₹)" />
        <Input placeholder="e.g. 999" value={price} onChangeText={setPrice} keyboardType="numeric" />

        <Label text="Category" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(category === cat ? '' : cat)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: category === cat ? INDIGO : '#E5E7EB', backgroundColor: category === cat ? '#EEF2FF' : '#fff' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: category === cat ? INDIGO : '#6B7280' }}>{cat}</Text>
            </Pressable>
          ))}
        </View>

        <Label text="Description (optional)" />
        <TextInput
          style={{ borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', minHeight: 100, textAlignVertical: 'top', marginBottom: 24, backgroundColor: '#fff' }}
          placeholder="Why is this a great deal? Any discount codes?"
          placeholderTextColor="#9CA3AF"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={{ backgroundColor: INDIGO, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Submit Deal</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>{text}</Text>;
}

function Input({ placeholder, value, onChangeText, autoCapitalize, keyboardType }: any) {
  return (
    <TextInput
      style={{ borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', marginBottom: 18, backgroundColor: '#fff' }}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      autoCapitalize={autoCapitalize ?? 'sentences'}
      keyboardType={keyboardType ?? 'default'}
    />
  );
}
