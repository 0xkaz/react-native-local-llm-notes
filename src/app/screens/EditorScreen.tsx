import { useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Appbar,
  TextInput,
  Button,
  Menu,
  Snackbar,
  Chip,
  Text,
  Divider,
} from 'react-native-paper';
import { useServices } from '../services/ServicesContext';
import { useEngine } from '../services/EngineContext';
import { useT, StringKey } from '../i18n';
import { RootStackParamList, AiAction } from '../navigation/types';

type AiActionItem = { labelKey: StringKey; icon: string; action: AiAction };

/** Core AI actions, shown as discoverable chips + in the menu. */
const AI_ACTIONS: AiActionItem[] = [
  { labelKey: 'ai.summary.oneLine', icon: 'text-short', action: { kind: 'summary', length: 'oneLine' } },
  { labelKey: 'ai.summary.threeLines', icon: 'format-list-bulleted', action: { kind: 'summary', length: 'threeLines' } },
  { labelKey: 'ai.summary.detailed', icon: 'text-long', action: { kind: 'summary', length: 'detailed' } },
  { labelKey: 'ai.todos.label', icon: 'checkbox-marked-outline', action: { kind: 'todos' } },
  { labelKey: 'ai.proofread.label', icon: 'spellcheck', action: { kind: 'proofread' } },
];

/** Additional AI actions, menu-only to avoid crowding the chip row. */
const AI_MENU_EXTRA: AiActionItem[] = [
  { labelKey: 'ai.translate.en', icon: 'translate', action: { kind: 'translate', target: 'en' } },
  { labelKey: 'ai.translate.ja', icon: 'translate', action: { kind: 'translate', target: 'ja' } },
  { labelKey: 'ai.tone.formal', icon: 'tie', action: { kind: 'tone', tone: 'formal' } },
  { labelKey: 'ai.tone.casual', icon: 'emoticon-happy-outline', action: { kind: 'tone', tone: 'casual' } },
  { labelKey: 'ai.continue.label', icon: 'pencil-plus-outline', action: { kind: 'continue' } },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

export default function EditorScreen({ navigation, route }: Props) {
  const { noteStore } = useServices();
  const { ai } = useEngine();
  const t = useT();
  const noteId = route.params?.noteId;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState(route.params?.sharedText ?? '');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [pinned, setPinned] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    if (!noteId) return;
    noteStore.get(noteId).then((note) => {
      if (note) {
        setTitle(note.title);
        setBody(note.body);
        setTags(note.tags ?? []);
        setPinned(note.pinned ?? false);
      }
    });
  }, [noteId, noteStore]);

  // For an existing note persist the pin immediately; a new note saves it on 保存.
  const togglePin = async () => {
    const next = !pinned;
    setPinned(next);
    if (noteId) await noteStore.setPinned(noteId, next);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((x) => x !== tag));

  const save = async () => {
    if (noteId) {
      await noteStore.update(noteId, { title, body, tags, pinned });
    } else {
      const created = await noteStore.create({ title, body, tags });
      if (pinned) await noteStore.update(created.id, { pinned: true });
    }
    navigation.goBack();
  };

  const remove = async () => {
    if (noteId) await noteStore.remove(noteId);
    navigation.goBack();
  };

  const share = async () => {
    const message = [title, body].filter((s) => s.trim().length > 0).join('\n\n');
    if (message.length === 0) {
      setSnack(t('editor.nothingToShare'));
      return;
    }
    try {
      await Share.share({ message });
    } catch {
      // cancelled
    }
  };

  const runAi = (action: AiAction) => {
    setAiMenuOpen(false);
    if (body.trim().length === 0) {
      setSnack(t('editor.emptyBody'));
      return;
    }
    navigation.navigate('AiResult', {
      sourceText: body,
      action,
      sourceNoteId: noteId,
    });
  };

  // Title generation runs inline and fills the title field (not a result screen).
  const genTitle = async () => {
    setAiMenuOpen(false);
    if (body.trim().length === 0) {
      setSnack(t('editor.emptyBody'));
      return;
    }
    if (!ai) {
      setSnack(t('ai.notLoaded'));
      return;
    }
    const r = await ai.generateTitle(body);
    if (r.text.length > 0) {
      setTitle(r.text);
      setSnack(t('ai.title.done'));
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={noteId ? t('editor.editTitle') : t('editor.newTitle')} />
        <Appbar.Action
          icon={pinned ? 'pin' : 'pin-outline'}
          accessibilityLabel={t('editor.pin')}
          onPress={togglePin}
        />
        <Appbar.Action
          icon="share-variant"
          accessibilityLabel={t('editor.share')}
          onPress={share}
        />
        {noteId && <Appbar.Action icon="delete-outline" onPress={remove} />}
        <Menu
          visible={aiMenuOpen}
          onDismiss={() => setAiMenuOpen(false)}
          anchor={
            <Appbar.Action icon="robot-outline" onPress={() => setAiMenuOpen(true)} />
          }
        >
          {AI_ACTIONS.map((a) => (
            <Menu.Item
              key={a.labelKey}
              leadingIcon={a.icon}
              onPress={() => runAi(a.action)}
              title={t(a.labelKey)}
            />
          ))}
          <Divider />
          {AI_MENU_EXTRA.map((a) => (
            <Menu.Item
              key={a.labelKey}
              leadingIcon={a.icon}
              onPress={() => runAi(a.action)}
              title={t(a.labelKey)}
            />
          ))}
          <Menu.Item
            leadingIcon="format-title"
            onPress={genTitle}
            title={t('ai.title.label')}
          />
        </Menu>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.form}>
        <TextInput
          label={t('editor.title')}
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.title}
        />
        <TextInput
          label={t('editor.body')}
          value={body}
          onChangeText={setBody}
          mode="outlined"
          multiline
          style={styles.body}
        />

        <TextInput
          label={t('editor.addTag')}
          value={tagInput}
          onChangeText={setTagInput}
          mode="outlined"
          dense
          onSubmitEditing={addTag}
          returnKeyType="done"
          right={tagInput.length > 0 ? <TextInput.Icon icon="plus" onPress={addTag} /> : undefined}
          style={styles.tagInput}
        />
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <Chip key={tag} compact onClose={() => removeTag(tag)} style={styles.tag}>
                {tag}
              </Chip>
            ))}
          </View>
        )}

        <Text variant="labelLarge" style={styles.aiLabel}>
          {t('editor.aiLabel')}
        </Text>
        <View style={styles.aiRow}>
          {AI_ACTIONS.map((a) => (
            <Chip
              key={a.labelKey}
              icon={a.icon}
              mode="outlined"
              onPress={() => runAi(a.action)}
              style={styles.aiChip}
            >
              {t(a.labelKey)}
            </Chip>
          ))}
        </View>

        <Button mode="contained" onPress={save} style={styles.save}>
          {t('editor.save')}
        </Button>
      </ScrollView>

      <Snackbar visible={snack.length > 0} onDismiss={() => setSnack('')}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 16 },
  title: { marginBottom: 12 },
  body: { minHeight: 160, marginBottom: 12 },
  tagInput: { marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { marginBottom: 4 },
  aiLabel: { marginBottom: 8 },
  aiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  aiChip: { marginBottom: 4 },
  save: { marginTop: 4 },
});
