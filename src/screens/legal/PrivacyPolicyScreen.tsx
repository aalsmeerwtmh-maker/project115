/**
 * PrivacyPolicyScreen — full-text privacy policy for PawStep.
 *
 * Policy text is stored as TypeScript string constants in this file (not in i18n)
 * because it is long-form legal prose, not UI copy. Only navigation labels are i18n'd.
 *
 * PLACEHOLDER: Replace the policy URL on line below with the hosted URL before
 * public App Store submission.
 */
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { t } from '@/i18n/index';

// ---------------------------------------------------------------------------
// Policy content
// ---------------------------------------------------------------------------

// Each tuple is [heading, body]. Heading may be empty string for body-only paragraphs.
const POLICY_SECTIONS: [string, string][] = [
  [
    '',
    'Last updated: 2026-05-30\n\nContact: Chang Chia-En, Deng Jing-Jing\nPolicy URL: https://PLACEHOLDER.example.com/privacy (replace before submission)',
  ],
  [
    '1. Overview',
    'PawStep ("we", "our", "the app") is a mobile exercise companion application. This policy describes what data we collect, how we use it, and your rights. We are committed to your privacy: PawStep is designed as a local-first application — almost all of your data stays on your device.',
  ],
  [
    '2. Data We Do Not Collect',
    'We do not collect, store, or transmit any personally identifiable information (PII). We do not operate a backend server that receives your step counts, location history, pet state, game progress, or any other app-generated data. All such data is stored exclusively in a SQLite database on your device.',
  ],
  [
    '3. Camera',
    'PawStep accesses your device camera solely to render the augmented reality (AR) view in which your pet appears in the real world. Camera frames are processed entirely on-device by ARKit (iOS) or ARCore (Android). No images or video are stored by the app, and no camera data is transmitted to any server.',
  ],
  [
    '4. Location',
    'PawStep accesses your precise location to track the route of your walks and to detect when you enter new geographic areas (exploration events). Location data is recorded in the local SQLite database on your device only. Background location access is used only while an active walk session is running. We do not upload location data to any server. You may revoke location permission at any time in your device settings; this will disable walk tracking.',
  ],
  [
    '5. Motion and Step Counting',
    "PawStep uses your device's motion sensors (accelerometer, step counter chip) to count steps and detect physical activity. This data is processed on-device and stored locally. No motion data is transmitted.",
  ],
  [
    '6. In-App Purchases (IAP)',
    'Token bundles and cosmetic items may be purchased through Apple App Store (StoreKit) or Google Play Billing. Payment is handled entirely by Apple or Google. PawStep does not receive, process, or store your payment card information. We receive only a transaction completion confirmation from the platform. Refunds are handled directly by Apple or Google per their respective policies.',
  ],
  [
    '7. Crash Reporting (Sentry)',
    "When crash reporting is active, PawStep uses Sentry (sentry.io) to collect anonymous crash reports. A crash report may include: device model, operating system version, app version, and a stack trace of the error. Crash reports do not include your name, email, location history, step data, or any other personally identifiable information. Sentry's privacy policy is available at https://sentry.io/privacy/.",
  ],
  [
    '8. Maps',
    "The walk map view uses Apple Maps (on iOS) and Google Maps (on Android) via their system SDK. These SDKs may transmit tile requests to Apple or Google servers. Refer to Apple's privacy policy (https://www.apple.com/privacy/) and Google's privacy policy (https://policies.google.com/privacy) for details.",
  ],
  [
    '9. Children',
    'PawStep is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided personal information through the app, please contact us and we will take steps to delete it.',
  ],
  [
    '10. Data Retention and Deletion',
    'Because all data is stored locally on your device, you can delete all app data at any time by uninstalling PawStep. Uninstalling removes the local SQLite database and all associated data.',
  ],
  [
    '11. Changes to This Policy',
    'We may update this privacy policy from time to time. The updated policy will be available within the app and at the policy URL above. Continued use of the app after changes are published constitutes acceptance of the updated policy.',
  ],
  [
    '12. Contact',
    'For questions or concerns about this privacy policy, contact:\nChang Chia-En\nDeng Jing-Jing\nEmail: PLACEHOLDER@example.com (replace before submission)',
  ],
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrivacyPolicyScreen() {
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
        <Text style={styles.title}>{t.legal.privacyPolicyTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {POLICY_SECTIONS.map(([heading, body], index) => (
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
    borderRadius: radius.sm,
  },
  sectionBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
