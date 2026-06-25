import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Appbar,
  Card,
  Button,
  Text,
  Icon,
  Dialog,
  Portal,
  Snackbar,
} from 'react-native-paper';
import { Note, formatTimestamp } from '../../core';
import { useServices } from '../services/ServicesContext';
import { useSettings } from '../services/SettingsContext';
import { useT } from '../i18n';

export default function TrashScreen() {
  const { noteStore } = useServices();
  const { settings } = useSettings();
  const t = useT();
  const [notes, setNotes] = useState<Note[]>([]);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [snack, setSnack] = useState('');

  const load = useCallback(async () => {
    setNotes(await noteStore.listTrashed());
  }, [noteStore]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      noteStore.listTrashed().then((l) => active && setNotes(l));
      return () => {
        active = false;
      };
    }, [noteStore]),
  );

  const restore = async (id: string) => {
    await noteStore.restore(id);
    setSnack(t('trash.restored'));
    load();
  };

  const purge = async (id: string) => {
    await noteStore.purge(id);
    setSnack(t('trash.purged'));
    load();
  };

  const emptyTrash = async () => {
    await noteStore.emptyTrash();
    setConfirmEmpty(false);
    setSnack(t('trash.emptied'));
    load();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title={t('trash.title')} />
        {notes.length > 0 && (
          <Appbar.Action
            icon="delete-sweep-outline"
            accessibilityLabel={t('trash.emptyAction')}
            onPress={() => setConfirmEmpty(true)}
          />
        )}
      </Appbar.Header>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notes.length ? styles.list : styles.emptyList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon source="trash-can-outline" size={64} color="#9aa0a6" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {t('trash.empty')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card} mode="contained">
            <Card.Title
              title={item.title || t('note.untitled')}
              titleVariant="titleMedium"
              subtitle={t('trash.deletedAt', {
                when: formatTimestamp(
                  item.deletedAt ?? item.updatedAt,
                  undefined,
                  settings.language,
                ),
              })}
            />
            {item.body.trim().length > 0 && (
              <Card.Content>
                <Text variant="bodyMedium" numberOfLines={2} style={styles.preview}>
                  {item.body}
                </Text>
              </Card.Content>
            )}
            <Card.Actions>
              <Button icon="restore" onPress={() => restore(item.id)}>
                {t('trash.restore')}
              </Button>
              <Button
                icon="delete-forever-outline"
                textColor="#B3261E"
                onPress={() => purge(item.id)}
              >
                {t('trash.purge')}
              </Button>
            </Card.Actions>
          </Card>
        )}
      />

      <Portal>
        <Dialog visible={confirmEmpty} onDismiss={() => setConfirmEmpty(false)}>
          <Dialog.Title>{t('trash.confirmTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('trash.confirmBody')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmEmpty(false)}>
              {t('action.cancel')}
            </Button>
            <Button textColor="#B3261E" onPress={emptyTrash}>
              {t('trash.confirmEmpty')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={snack.length > 0} onDismiss={() => setSnack('')}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 12 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  card: { marginVertical: 6 },
  preview: { opacity: 0.8 },
  empty: { alignItems: 'center', gap: 8 },
  emptyTitle: { marginTop: 8 },
});
