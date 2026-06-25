import { StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { ChatRole } from '../../core';

export interface ChatBubbleProps {
  role: ChatRole;
  content: string;
}

/**
 * A single chat turn. User turns align right, assistant turns left. Pure and
 * provider-free apart from paper theming, so it is easy to snapshot-test.
 */
export default function ChatBubble({ role, content }: ChatBubbleProps) {
  return (
    <Surface
      style={[styles.bubble, role === 'user' ? styles.user : styles.assistant]}
      elevation={1}
    >
      <Text>{content}</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  bubble: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
    maxWidth: '85%',
  },
  user: { alignSelf: 'flex-end' },
  assistant: { alignSelf: 'flex-start' },
});
