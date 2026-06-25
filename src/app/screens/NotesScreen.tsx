import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Appbar,
  Card,
  FAB,
  Text,
  Icon,
  Chip,
  Menu,
  Dialog,
  Button,
  Portal,
  Searchbar,
  Snackbar,
} from 'react-native-paper';
import {
  Note,
  NoteSort,
  formatTimestamp,
  searchNotes,
  sortNotes,
} from '../../core';
import { useServices } from '../services/ServicesContext';
import { useSettings } from '../services/SettingsContext';
import { useT } from '../i18n';
import { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Notes' | 'Pinned'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SORT_ORDERS: NoteSort[] = ['updated', 'created', 'title'];

export default function NotesScreen({ navigation, route }: Props) {
  const { noteStore } = useServices();
  const { settings } = useSettings();
  const t = useT();
  const pinnedOnly = route.name === 'Pinned';

  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<NoteSort>('updated');
  const [sortMenu, setSortMenu] = useState(false);
  const [selected, setSelected] = useState<Note | null>(null);
  const [snack, setSnack] = useState<{ text: string; undoId?: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setNotes(await noteStore.list());
  }, [noteStore]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      noteStore.list().then((list) => active && setNotes(list));
      return () => {
        active = false;
      };
    }, [noteStore]),
  );

  const visible = useMemo(() => {
    const base = pinnedOnly ? notes.filter((n) => n.pinned) : notes;
    return sortNotes(searchNotes(base, query), order);
  }, [notes, query, order, pinnedOnly]);

  const togglePin = async () => {
    if (!selected) return;
    await noteStore.setPinned(selected.id, !selected.pinned);
    setSelected(null);
    load();
  };

  const softDelete = async () => {
    if (!selected) return;
    const id = selected.id;
    await noteStore.remove(id);
    setSelected(null);
    setSnack({ text: t('snack.movedToTrash'), undoId: id });
    load();
  };

  const undo = async () => {
    if (snack?.undoId) {
      await noteStore.restore(snack.undoId);
      load();
    }
    setSnack(null);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content
          title={pinnedOnly ? t('notes.pinnedTitle') : t('app.title')}
        />
        <Menu
          visible={sortMenu}
          onDismiss={() => setSortMenu(false)}
          anchor={
            <Appbar.Action
              icon="sort"
              accessibilityLabel={t('notes.sort')}
              onPress={() => setSortMenu(true)}
            />
          }
        >
          {SORT_ORDERS.map((o) => (
            <Menu.Item
              key={o}
              title={t(`sort.${o}` as 'sort.updated')}
              trailingIcon={order === o ? 'check' : undefined}
              onPress={() => {
                setOrder(o);
                setSortMenu(false);
              }}
            />
          ))}
        </Menu>
        <Appbar.Action
          icon="chat-outline"
          accessibilityLabel={t('notes.chat')}
          onPress={() => navigation.navigate('Chat')}
        />
      </Appbar.Header>

      <Searchbar
        placeholder={t('notes.search')}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={visible.length ? styles.list : styles.emptyList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon
              source={
                query ? 'magnify' : pinnedOnly ? 'pin-outline' : 'note-plus-outline'
              }
              size={64}
              color="#9aa0a6"
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {query
                ? t('notes.empty.noMatch')
                : pinnedOnly
                  ? t('notes.empty.noPinned')
                  : t('notes.empty.none')}
            </Text>
            {!query && !pinnedOnly && (
              <Text variant="bodyMedium" style={styles.emptyHint}>
                {t('notes.empty.hint')}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            mode="contained"
            onPress={() => navigation.navigate('Editor', { noteId: item.id })}
            onLongPress={() => setSelected(item)}
          >
            <Card.Title
              title={item.title || t('note.untitled')}
              titleVariant="titleMedium"
              subtitle={formatTimestamp(item.updatedAt, undefined, settings.language)}
              right={() =>
                item.pinned ? (
                  <Icon source="pin" size={18} color="#4F5BD5" />
                ) : null
              }
            />
            {item.body.trim().length > 0 && (
              <Card.Content>
                <Text variant="bodyMedium" numberOfLines={2} style={styles.preview}>
                  {item.body}
                </Text>
              </Card.Content>
            )}
            {item.tags && item.tags.length > 0 && (
              <Card.Content style={styles.tagRow}>
                {item.tags.map((tag) => (
                  <Chip key={tag} compact style={styles.tag}>
                    {tag}
                  </Chip>
                ))}
              </Card.Content>
            )}
          </Card>
        )}
      />

      <FAB
        icon="plus"
        label={t('action.newNote')}
        style={styles.fab}
        onPress={() => navigation.navigate('Editor', {})}
      />

      <Portal>
        <Dialog visible={selected != null} onDismiss={() => setSelected(null)}>
          <Dialog.Title numberOfLines={1}>
            {selected?.title || t('note.untitled')}
          </Dialog.Title>
          <Dialog.Actions style={styles.dialogActions}>
            <Button icon={selected?.pinned ? 'pin-off' : 'pin'} onPress={togglePin}>
              {selected?.pinned ? t('action.unpin') : t('action.pin')}
            </Button>
            <Button icon="trash-can-outline" textColor="#B3261E" onPress={softDelete}>
              {t('action.delete')}
            </Button>
            <Button onPress={() => setSelected(null)}>{t('action.close')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snack != null}
        onDismiss={() => setSnack(null)}
        duration={5000}
        action={snack?.undoId ? { label: t('action.undo'), onPress: undo } : undefined}
      >
        {snack?.text ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { marginHorizontal: 12, marginTop: 8, marginBottom: 4 },
  list: { padding: 12, paddingBottom: 96 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  card: { marginVertical: 6 },
  preview: { opacity: 0.8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 4 },
  tag: { marginRight: 2 },
  empty: { alignItems: 'center', paddingHorizontal: 32, gap: 8 },
  emptyTitle: { marginTop: 8 },
  emptyHint: { textAlign: 'center', opacity: 0.6 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  dialogActions: { flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
});
