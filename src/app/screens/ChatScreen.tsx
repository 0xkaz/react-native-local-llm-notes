import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Appbar, TextInput, IconButton, Banner } from 'react-native-paper';
import { ChatMessage } from '../../core';
import { useServices } from '../services/ServicesContext';
import { useEngine } from '../services/EngineContext';
import { useT } from '../i18n';
import { RootStackParamList } from '../navigation/types';
import ChatBubble from '../components/ChatBubble';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ navigation }: Props) {
  const { chatStore } = useServices();
  const { ai, isReady } = useEngine();
  const t = useT();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  // The user's in-flight message and the assistant reply as it streams in.
  const [pendingUser, setPendingUser] = useState('');
  const [pendingReply, setPendingReply] = useState('');

  useEffect(() => {
    chatStore.load().then(setMessages);
  }, [chatStore]);

  const send = async () => {
    const text = input.trim();
    if (!text || !ai || busy) return;
    setInput('');
    setBusy(true);
    setPendingUser(text);
    setPendingReply('');
    try {
      const reply = await ai.chat(messages, text, {
        onToken: (chunk) => setPendingReply((s) => s + chunk),
      });
      const updated = await chatStore.appendExchange(text, reply.text);
      setMessages(updated);
    } catch {
      // Re-show the message so the user can retry.
      setInput(text);
    } finally {
      setBusy(false);
      setPendingUser('');
      setPendingReply('');
    }
  };

  const clear = async () => {
    await chatStore.clear();
    setMessages([]);
  };

  // Visible turns = persisted history + the in-flight exchange while busy.
  const visible = messages.filter((m) => m.role !== 'system');
  const live: ChatMessage[] = busy
    ? [
        { role: 'user', content: pendingUser },
        { role: 'assistant', content: pendingReply || '…' },
      ]
    : [];
  const data = [...visible, ...live];

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('chat.title')} />
        <Appbar.Action icon="trash-can-outline" onPress={clear} />
      </Appbar.Header>

      {!isReady && (
        <Banner
          visible
          actions={[
            {
              label: t('ai.toSettings'),
              onPress: () => navigation.navigate('Main', { screen: 'Settings' }),
            },
          ]}
        >
          {t('ai.notLoaded')}
        </Banner>
      )}

      <FlatList
        data={data}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ChatBubble role={item.role} content={item.content} />
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          mode="outlined"
          placeholder={t('chat.input')}
          value={input}
          onChangeText={setInput}
          multiline
          disabled={!isReady}
        />
        <IconButton
          icon="send"
          onPress={send}
          disabled={!isReady || busy || input.trim().length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  input: { flex: 1 },
});
