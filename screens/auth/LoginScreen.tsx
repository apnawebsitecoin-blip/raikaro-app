import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function LoginScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Login Error', error.message);
    } else {
      navigation.goBack();
    }
  }

  return (
    <View style={s.container}>
      <Pressable style={s.closeBtn} onPress={() => navigation.goBack()} hitSlop={12}>
        <X size={22} color="#9CA3AF" />
      </Pressable>

      <Text style={s.brand}>Raikaro</Text>
      <Text style={s.subtitle}>{t('login_subtitle')}</Text>

      <TextInput
        style={s.input}
        placeholder={t('login_email_placeholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#9CA3AF"
      />
      <TextInput
        style={[s.input, s.inputLast]}
        placeholder={t('login_password_placeholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#9CA3AF"
      />

      <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{t('btn_sign_in')}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
        <Text style={s.link}>
          {t('login_no_account')} <Text style={s.linkBold}>{t('login_sign_up_link')}</Text>
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
