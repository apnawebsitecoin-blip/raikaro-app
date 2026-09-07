import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      Alert.alert('Signup Error', error.message);
      return;
    }
    // Ensure profile row exists. The DB trigger should handle this, but we
    // also upsert here as a safety net for cases where the trigger is missing.
    if (data.user) {
      const refCode = data.user.id.substring(0, 8).toUpperCase();
      await supabase.from('profiles').upsert(
        { id: data.user.id, name: email.split('@')[0], referral_code: refCode },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    }
    setLoading(false);
    Alert.alert(
      'Check your email',
      'We sent a confirmation link. Open it and then sign in.',
      [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
    );
  }

  return (
    <View style={s.container}>
      <Pressable style={s.closeBtn} onPress={() => navigation.goBack()} hitSlop={12}>
        <X size={22} color="#9CA3AF" />
      </Pressable>

      <Text style={s.brand}>Raikaro</Text>
      <Text style={s.subtitle}>Create your account</Text>

      <TextInput
        style={s.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#9CA3AF"
      />
      <TextInput
        style={[s.input, s.inputLast]}
        placeholder="Password (min 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#9CA3AF"
      />

      <TouchableOpacity style={s.btn} onPress={handleSignup} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
        <Text style={s.link}>
          Already have an account? <Text style={s.linkBold}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24, justifyContent: 'center' },
  closeBtn:  { position: 'absolute', top: 56, right: 24 },
  brand:     { fontSize: 32, fontWeight: '800', color: '#4F46E5', marginBottom: 6 },
  subtitle:  { fontSize: 15, color: '#6B7280', marginBottom: 32 },
  input:     { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16, color: '#111827' },
  inputLast: { marginBottom: 24 },
  btn:       { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:      { textAlign: 'center', color: '#6B7280', fontSize: 14 },
  linkBold:  { color: '#4F46E5', fontWeight: '700' },
});
