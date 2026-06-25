import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Appbar, Button, Banner, Snackbar } from 'react-native-paper';
import { useServices } from '../services/ServicesContext';
import { useEngine } from '../services/EngineContext';
import { useT, TFunc } from '../i18n';
import { RootStackParamList, AiAction } from '../navigation/types';
import StreamingResult from '../components/StreamingResult';

type Props = NativeStackScreenProps<RootStackParamList, 'AiResult'>;

function titleFor(action: AiAction, t: TFunc): string {
  switch (action.kind) {
    case 'summary':
      return t('ai.summary');
    case 'todos':
      return t('ai.todos');
    case 'proofread':
      return t('ai.proofread');
    case 'translate':
      return t('ai.translate');
    case 'tone':
      return t('ai.tone');
    case 'continue':
      return t('ai.continue');
  }
}

export default function AiResultScreen({ navigation, route }: Props) {
  const { sourceText, action, sourceNoteId } = route.params;
  const { ai, isReady } = useEngine();
  const { noteStore } = useServices();
  const t = useT();

  const [loading, setLoading] = useState(false);
  const [streamed, setStreamed] = useState('');
  const [result, setResult] = useState('');
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');

  const runId = useRef(0);

  const run = useCallback(async () => {
    if (!ai) return;
    const myRun = ++runId.current;
    setLoading(true);
    setError('');
    setResult('');
    setStreamed('');
    setTruncated(false);

    const onToken = (chunk: string) => {
      if (runId.current === myRun) setStreamed((s) => s + chunk);
    };

    try {
      if (action.kind === 'summary') {
        const r = await ai.summarize(sourceText, action.length, { onToken });
        if (runId.current !== myRun) return;
        setResult(r.text);
        setTruncated(r.truncated);
      } else if (action.kind === 'todos') {
        const todos = await ai.extractTodos(sourceText);
        if (runId.current !== myRun) return;
        setResult(
          todos.length
            ? todos.map((todo) => `- [ ] ${todo}`).join('\n')
            : t('ai.noTodos'),
        );
      } else if (action.kind === 'translate') {
        const r = await ai.translate(sourceText, action.target, { onToken });
        if (runId.current !== myRun) return;
        setResult(r.text);
        setTruncated(r.truncated);
      } else if (action.kind === 'tone') {
        const r = await ai.changeTone(sourceText, action.tone, { onToken });
        if (runId.current !== myRun) return;
        setResult(r.text);
        setTruncated(r.truncated);
      } else if (action.kind === 'continue') {
        const r = await ai.continueText(sourceText, { onToken });
        if (runId.current !== myRun) return;
        setResult(r.text);
        setTruncated(r.truncated);
      } else {
        const r = await ai.proofread(sourceText, { onToken });
        if (runId.current !== myRun) return;
        setResult(r.text);
        setTruncated(r.truncated);
      }
    } catch (e) {
      if (runId.current === myRun) {
        setError(String(e instanceof Error ? e.message : e));
      }
    } finally {
      if (runId.current === myRun) setLoading(false);
    }
  }, [ai, action, sourceText, t]);

  useEffect(() => {
    if (isReady) run();
  }, [isReady, run]);

  const copy = () => {
    Clipboard.setString(result);
    setSnack(t('snack.copied'));
  };

  const share = async () => {
    if (result.length === 0) return;
    try {
      await Share.share({ message: result });
    } catch {
      // cancelled
    }
  };

  const saveAsNote = async () => {
    await noteStore.create({ title: titleFor(action, t), body: result });
    setSnack(t('snack.savedNew'));
  };

  const applyToSource = async (mode: 'replace' | 'append') => {
    if (!sourceNoteId) return;
    const note = await noteStore.get(sourceNoteId);
    if (!note) {
      setSnack(t('ai.sourceMissing'));
      return;
    }
    const body =
      mode === 'replace' ? result : `${note.body}\n\n${result}`.trim();
    await noteStore.update(sourceNoteId, { body });
    navigation.popToTop();
  };

  const shown = result.length > 0 ? result : streamed;
  const hasResult = !loading && result.length > 0;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={titleFor(action, t)} />
        <Appbar.Action
          icon="content-copy"
          accessibilityLabel={t('action.copy')}
          disabled={!hasResult}
          onPress={copy}
        />
        <Appbar.Action
          icon="share-variant"
          accessibilityLabel={t('editor.share')}
          disabled={!hasResult}
          onPress={share}
        />
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

      <ScrollView contentContainerStyle={styles.body}>
        <StreamingResult
          text={shown}
          loading={loading}
          truncated={truncated}
          error={error}
          onRetry={run}
          truncatedMessage={t('ai.truncated')}
          retryLabel={t('ai.retry')}
          errorPrefix={t('ai.errorPrefix')}
        />
      </ScrollView>

      {isReady && (
        <View style={styles.actions}>
          <Button onPress={run} disabled={loading}>
            {t('ai.rerun')}
          </Button>
          {sourceNoteId && (
            <>
              <Button onPress={() => applyToSource('append')} disabled={!hasResult}>
                {t('ai.appendToNote')}
              </Button>
              <Button
                mode="contained-tonal"
                onPress={() => applyToSource('replace')}
                disabled={!hasResult}
              >
                {t('ai.applyToNote')}
              </Button>
            </>
          )}
          <Button mode="contained" onPress={saveAsNote} disabled={!hasResult}>
            {t('ai.saveNew')}
          </Button>
        </View>
      )}

      <Snackbar visible={snack.length > 0} onDismiss={() => setSnack('')}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16, flexGrow: 1 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
});
