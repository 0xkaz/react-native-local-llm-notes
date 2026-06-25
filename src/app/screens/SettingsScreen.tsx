import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Appbar,
  List,
  Button,
  ProgressBar,
  SegmentedButtons,
  Switch,
  Text,
  Divider,
  Chip,
  Snackbar,
} from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import {
  MODEL_CATALOG,
  ModelInfo,
  Settings,
  isWifiOnlyDownloadBlocked,
  WifiOnlyDownloadBlockedError,
} from '../../core';
import { useServices } from '../services/ServicesContext';
import { useSettings } from '../services/SettingsContext';
import { useEngine } from '../services/EngineContext';
import { useT } from '../i18n';

function sizeLabel(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function SettingsScreen() {
  const { noteStore, chatStore } = useServices();
  const { settings, update } = useSettings();
  const { prepare, remove, getState, downloadProgress } = useEngine();
  const t = useT();

  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({});
  const [working, setWorking] = useState<string | null>(null);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    refreshStates();
  }, []);

  const refreshStates = async () => {
    const entries = await Promise.all(
      MODEL_CATALOG.map(async (m) => {
        const state = await getState(m);
        return [m.id, state.status === 'downloaded'] as const;
      }),
    );
    setDownloaded(Object.fromEntries(entries));
  };

  const patch = (p: Partial<Settings>): void => {
    void update(p);
  };

  const onDownload = async (model: ModelInfo) => {
    setWorking(model.id);
    try {
      // The Wi-Fi-only check runs inside prepare()'s onWillDownload hook, which
      // fires only when a real download is actually needed (missing/partial/
      // corrupt file) — so it is authoritative even if the stored state still
      // says "downloaded" but the file is gone.
      await prepare(model, {
        onWillDownload: async () => {
          if (!settings.wifiOnlyDownload) return;
          const net = await NetInfo.fetch();
          if (
            isWifiOnlyDownloadBlocked({
              wifiOnly: true,
              isCellular: net.type === 'cellular',
              alreadyDownloaded: false,
            })
          ) {
            throw new WifiOnlyDownloadBlockedError();
          }
        },
      });
      await update({ selectedModelId: model.id });
      setSnack(t('settings.loaded', { name: model.displayName }));
    } catch (e) {
      setSnack(
        e instanceof WifiOnlyDownloadBlockedError
          ? t('settings.wifiBlocked')
          : t('settings.downloadFailed', {
              error: e instanceof Error ? e.message : String(e),
            }),
      );
    } finally {
      setWorking(null);
      refreshStates();
    }
  };

  const onDelete = async (model: ModelInfo) => {
    setWorking(model.id);
    try {
      await remove(model);
    } catch (e) {
      setSnack(
        t('settings.deleteFailed', {
          error: e instanceof Error ? e.message : String(e),
        }),
      );
    } finally {
      setWorking(null);
      refreshStates();
    }
  };

  const wipeData = async () => {
    await noteStore.clear();
    await chatStore.clear();
    setSnack(t('settings.wiped'));
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title={t('settings.title')} />
      </Appbar.Header>

      <ScrollView>
        <List.Section title={t('settings.aiModel')}>
          {MODEL_CATALOG.map((model) => (
            <View key={model.id}>
              <List.Item
                title={model.displayName}
                description={`${sizeLabel(model.sizeBytes)} ・ RAM ${model.minRamGB}GB+ ・ ${model.license}`}
                right={() =>
                  model.commercialUse === 'restricted' ? (
                    <Chip compact style={styles.chip}>
                      {t('settings.commercialCheck')}
                    </Chip>
                  ) : null
                }
              />
              {working === model.id && downloadProgress != null && (
                <ProgressBar progress={downloadProgress} style={styles.bar} />
              )}
              <View style={styles.row}>
                {settings.selectedModelId === model.id && (
                  <Chip compact icon="check" style={styles.chip}>
                    {t('settings.selected')}
                  </Chip>
                )}
                <Button
                  onPress={() => onDownload(model)}
                  loading={working === model.id}
                  disabled={working != null}
                >
                  {downloaded[model.id]
                    ? t('settings.reload')
                    : t('settings.download')}
                </Button>
                {downloaded[model.id] && (
                  <Button
                    onPress={() => onDelete(model)}
                    disabled={working != null}
                  >
                    {t('action.delete')}
                  </Button>
                )}
              </View>
              <Divider />
            </View>
          ))}
        </List.Section>

        <List.Section title={t('settings.display')}>
          <View style={styles.block}>
            <Text variant="labelLarge" style={styles.label}>
              {t('settings.theme')}
            </Text>
            <SegmentedButtons
              value={settings.theme}
              onValueChange={(v) => patch({ theme: v as Settings['theme'] })}
              buttons={[
                { value: 'system', label: t('settings.theme.system') },
                { value: 'light', label: t('settings.theme.light') },
                { value: 'dark', label: t('settings.theme.dark') },
              ]}
            />
          </View>
          <View style={styles.block}>
            <Text variant="labelLarge" style={styles.label}>
              {t('settings.language')}
            </Text>
            <SegmentedButtons
              value={settings.language}
              onValueChange={(v) =>
                patch({ language: v as Settings['language'] })
              }
              buttons={[
                { value: 'ja', label: t('settings.lang.ja') },
                { value: 'en', label: t('settings.lang.en') },
              ]}
            />
          </View>
        </List.Section>

        <List.Section title={t('settings.download.section')}>
          <List.Item
            title={t('settings.wifiOnly')}
            right={() => (
              <Switch
                value={settings.wifiOnlyDownload}
                onValueChange={(v) => patch({ wifiOnlyDownload: v })}
              />
            )}
          />
        </List.Section>

        <List.Section title={t('settings.data')}>
          <View style={styles.block}>
            <Button mode="outlined" textColor="#B3261E" onPress={wipeData}>
              {t('settings.wipe')}
            </Button>
          </View>
        </List.Section>
      </ScrollView>

      <Snackbar
        visible={snack.length > 0}
        onDismiss={() => setSnack('')}
        duration={5000}
      >
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  block: { paddingHorizontal: 16, paddingVertical: 8 },
  label: { marginBottom: 8 },
  chip: { alignSelf: 'center' },
  bar: { marginHorizontal: 16, marginBottom: 8 },
});
