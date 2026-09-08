import React from 'react';
import {
  View, Text, Pressable, Modal, StyleSheet, ScrollView, StatusBar,
} from 'react-native';
import { CheckCircle2, Globe } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { LANGUAGE_OPTIONS, LangCode } from '../lib/i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LanguagePicker({ visible, onClose }: Props) {
  const { lang, setLanguage, t } = useLanguage();
  const { colors } = useTheme();

  const handleSelect = (code: LangCode) => {
    setLanguage(code);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>

          {/* Handle bar */}
          <View style={[s.handle, { backgroundColor: colors.borderStrong }]} />

          {/* Title row */}
          <View style={s.titleRow}>
            <Globe size={18} color={colors.indigo} />
            <Text style={[s.title, { color: colors.text }]}>{t('lang_picker_title')}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = lang === opt.code;
              return (
                <Pressable
                  key={opt.code}
                  onPress={() => handleSelect(opt.code)}
                  style={({ pressed }) => [
                    s.row,
                    { borderBottomColor: colors.border },
                    isSelected && { backgroundColor: colors.indigoMuted },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.nativeName, { color: colors.text }]}>{opt.native}</Text>
                    <Text style={[s.englishName, { color: colors.textSub }]}>{opt.english}</Text>
                  </View>
                  {isSelected && <CheckCircle2 size={20} color={colors.indigo} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  handle:      { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 16 },
  title:       { fontSize: 17, fontWeight: '700' },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  nativeName:  { fontSize: 17, fontWeight: '600', marginBottom: 2 },
  englishName: { fontSize: 13 },
});
