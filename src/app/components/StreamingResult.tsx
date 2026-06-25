import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Banner, Text } from 'react-native-paper';

export interface StreamingResultProps {
  /** Final or in-flight text to render. */
  text: string;
  /** Show a spinner while generation is running. */
  loading: boolean;
  /** Output hit the token cap and may be incomplete. */
  truncated: boolean;
  /** Error message, if the run failed. */
  error?: string;
  /** Re-run handler offered in the truncation banner. */
  onRetry?: () => void;
  /** Localized labels (default to English). */
  truncatedMessage?: string;
  retryLabel?: string;
  errorPrefix?: string;
  generatingLabel?: string;
}

/**
 * Presentational view for an AI result: optional truncation banner, the text
 * (live or final) and a trailing spinner while streaming. Strings are passed in
 * as props so the component stays pure and easy to unit-test.
 */
export default function StreamingResult({
  text,
  loading,
  truncated,
  error,
  onRetry,
  truncatedMessage = 'Output may be incomplete (hit the token limit).',
  retryLabel = 'Try again',
  errorPrefix = 'Error: ',
  generatingLabel = 'generating',
}: StreamingResultProps) {
  return (
    <View style={styles.container}>
      {truncated && (
        <Banner
          visible
          icon="content-cut"
          actions={onRetry ? [{ label: retryLabel, onPress: onRetry }] : []}
        >
          {truncatedMessage}
        </Banner>
      )}
      {error != null && error.length > 0 && (
        <Text style={styles.error}>
          {errorPrefix}
          {error}
        </Text>
      )}
      {text.length > 0 && (
        <Text variant="bodyLarge" selectable>
          {text}
        </Text>
      )}
      {loading && (
        <ActivityIndicator
          style={styles.spinner}
          accessibilityLabel={generatingLabel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  error: { color: '#B3261E' },
  spinner: { marginTop: 24, alignSelf: 'flex-start' },
});
