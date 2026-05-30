/**
 * TermsScreen — Terms of Use for PawStep.
 *
 * Terms text is stored as TypeScript string constants in this file (not in i18n)
 * because it is long-form legal prose, not UI copy. Only navigation labels are i18n'd.
 */
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

// ---------------------------------------------------------------------------
// Terms content
// ---------------------------------------------------------------------------

const TERMS_SECTIONS: [string, string][] = [
  [
    '',
    'Last updated: 2026-05-30\n\nContact: Chang Chia-En, Deng Jing-Jing\nBy downloading or using PawStep you agree to these Terms of Use.',
  ],
  [
    '1. App Provided As-Is',
    'PawStep is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the app will be error-free, uninterrupted, or suitable for any particular purpose. Your use of the app is at your sole risk.',
  ],
  [
    '2. Physical Safety',
    'PawStep encourages physical activity including walking outdoors. You are solely responsible for your safety during any physical activity. Always be aware of your surroundings. Do not use the app while driving or operating machinery. The AR camera view may partially obscure your vision — never use AR mode in situations requiring full situational awareness. Consult a doctor before beginning any new exercise programme.',
  ],
  [
    '3. In-App Purchases and Refunds',
    'Some features of PawStep are available for purchase through the Apple App Store or Google Play Store. All purchases are processed by Apple or Google under their respective terms. Refund requests must be made directly to Apple (https://reportaproblem.apple.com/) or Google (https://play.google.com/store/account/orderhistory). We do not process refunds directly.',
  ],
  [
    '4. Virtual Currency and Items',
    'Tokens and virtual items (equipment, cosmetics) have no real-world monetary value. They cannot be redeemed for cash or transferred between accounts. We reserve the right to modify, suspend, or discontinue virtual items or the token economy at any time.',
  ],
  [
    '5. Intellectual Property',
    'All content within PawStep — including but not limited to pet artwork, 3D models, user interface design, music, and sound effects — is the intellectual property of the PawStep team and is protected by copyright law. You may not reproduce, distribute, or create derivative works from this content without prior written permission.',
  ],
  [
    '6. Acceptable Use',
    'You agree not to: (a) reverse engineer, decompile, or disassemble the app; (b) use the app in any way that violates applicable laws or regulations; (c) attempt to gain unauthorised access to any part of the app or its backend systems; (d) use automated tools to simulate steps or game actions.',
  ],
  [
    '7. Limitation of Liability',
    'To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the app, including any physical injury sustained during exercise.',
  ],
  [
    '8. Changes to Terms',
    'We may update these terms from time to time. Continued use of the app after changes are published constitutes acceptance of the updated terms.',
  ],
  [
    '9. Governing Law',
    'These terms are governed by the laws of Taiwan (R.O.C.) without regard to its conflict of law provisions.',
  ],
  [
    '10. Contact',
    'For questions about these terms, contact:\nChang Chia-En\nDeng Jing-Jing\nEmail: PLACEHOLDER@example.com (replace before submission)',
  ],
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TermsScreen() {
  const navigation = useNavigation();

  function handleBack() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={t.legal.backButton}
        >
          <Text style={styles.backButtonText}>{t.legal.backButton}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.legal.termsTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {TERMS_SECTIONS.map(([heading, body], index) => (
          <View key={index} style={styles.section}>
            {heading !== '' && <Text style={styles.sectionHeading}>{heading}</Text>}
            <Text style={styles.sectionBody}>{body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    minWidth: 56,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  title: {
    flex: 1,
    ...typography.heading3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 56,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
