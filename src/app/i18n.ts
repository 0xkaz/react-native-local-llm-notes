import { useCallback } from 'react';
import { Language } from '../core';
import { useSettings } from './services/SettingsContext';

/**
 * Tiny dependency-free i18n. Strings live here keyed by a stable id; `useT()`
 * returns a `t(key)` bound to the current language (from settings, reactive).
 * English is the default language.
 */
const STRINGS = {
  en: {
    'app.title': 'AI Memo',
    'tab.notes': 'Notes',
    'tab.pinned': 'Pinned',
    'tab.trash': 'Trash',
    'tab.settings': 'Settings',

    'notes.pinnedTitle': 'Pinned',
    'notes.search': 'Search notes',
    'notes.sort': 'Sort',
    'notes.chat': 'Chat',
    'notes.menu': 'Menu',
    'sort.updated': 'Last updated',
    'sort.created': 'Date created',
    'sort.title': 'Title',
    'notes.empty.noMatch': 'No matching notes',
    'notes.empty.noPinned': 'No pinned notes',
    'notes.empty.none': 'No notes yet',
    'notes.empty.hint':
      'Tap ＋ to create one, or add via another app’s share menu.',
    'note.untitled': '(untitled)',
    'action.pin': 'Pin',
    'action.unpin': 'Unpin',
    'action.delete': 'Delete',
    'action.close': 'Close',
    'action.newNote': 'New note',
    'snack.movedToTrash': 'Moved to trash.',
    'action.undo': 'Undo',

    'editor.editTitle': 'Edit note',
    'editor.newTitle': 'New note',
    'editor.title': 'Title',
    'editor.body': 'Body',
    'editor.addTag': 'Add a tag',
    'editor.aiLabel': 'AI actions (on the body)',
    'editor.save': 'Save',
    'editor.pin': 'Pin',
    'editor.share': 'Share',
    'editor.emptyBody': 'Please enter some text.',
    'editor.nothingToShare': 'Nothing to share.',

    'ai.summary': 'Summary',
    'ai.todos': 'Extract TODOs',
    'ai.proofread': 'Proofread',
    'ai.summary.oneLine': 'Summary (1 line)',
    'ai.summary.threeLines': 'Summary (3 lines)',
    'ai.summary.detailed': 'Summary (detailed)',
    'ai.todos.label': 'Extract TODOs',
    'ai.proofread.label': 'Proofread',
    'ai.translate': 'Translate',
    'ai.tone': 'Change tone',
    'ai.continue': 'Continue',
    'ai.translate.en': 'Translate → English',
    'ai.translate.ja': 'Translate → Japanese',
    'ai.tone.formal': 'Make formal',
    'ai.tone.casual': 'Make casual',
    'ai.continue.label': 'Continue writing',
    'ai.title.label': 'Generate title',
    'ai.title.done': 'Title generated.',
    'ai.notLoaded':
      'No AI model is loaded. Download one from Settings.',
    'ai.toSettings': 'Open model settings',
    'ai.rerun': 'Re-run',
    'ai.appendToNote': 'Append to note',
    'ai.applyToNote': 'Apply to note',
    'ai.saveNew': 'Save as new',
    'action.copy': 'Copy',
    'snack.copied': 'Copied.',
    'snack.savedNew': 'Saved as a new note.',
    'ai.noTodos': 'No TODOs found.',
    'ai.sourceMissing': 'The original note was not found.',
    'ai.truncated': 'Output may be incomplete (hit the token limit).',
    'ai.retry': 'Try again',
    'ai.errorPrefix': 'Error: ',

    'chat.title': 'Chat',
    'chat.input': 'Type a message',

    'settings.title': 'Settings',
    'settings.aiModel': 'AI model',
    'settings.commercialCheck': 'Check license',
    'settings.selected': 'Selected',
    'settings.reload': 'Reload',
    'settings.download': 'Download',
    'settings.display': 'Display',
    'settings.theme': 'Theme',
    'settings.theme.system': 'System',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.language': 'Language',
    'settings.lang.ja': '日本語',
    'settings.lang.en': 'English',
    'settings.download.section': 'Download',
    'settings.wifiOnly': 'Download over Wi-Fi only',
    'settings.wifiBlocked':
      'Wi-Fi only is on. Connect to Wi-Fi, or turn off “Download over Wi-Fi only” to download on cellular.',
    'settings.data': 'Data',
    'settings.wipe': 'Delete all notes and chat history',
    'settings.loaded': 'Loaded {name}.',
    'settings.downloadFailed': 'Download failed: {error}',
    'settings.deleteFailed': 'Delete failed: {error}',
    'settings.wiped': 'Deleted all notes and chat history.',

    'trash.title': 'Trash',
    'trash.empty': 'Trash is empty',
    'trash.emptyAction': 'Empty trash',
    'trash.deletedAt': 'Deleted: {when}',
    'trash.restore': 'Restore',
    'trash.purge': 'Delete forever',
    'trash.confirmTitle': 'Empty trash',
    'trash.confirmBody':
      'Permanently delete all notes in the trash. This cannot be undone.',
    'action.cancel': 'Cancel',
    'trash.confirmEmpty': 'Empty',
    'trash.restored': 'Note restored.',
    'trash.purged': 'Note permanently deleted.',
    'trash.emptied': 'Trash emptied.',

    'time.today': 'Today {time}',
  },
  ja: {
    'app.title': 'AIメモ',
    'tab.notes': 'メモ',
    'tab.pinned': 'ピン',
    'tab.trash': 'ゴミ箱',
    'tab.settings': '設定',

    'notes.pinnedTitle': 'ピン留め',
    'notes.search': 'メモを検索',
    'notes.sort': '並び替え',
    'notes.chat': 'チャット',
    'notes.menu': 'メニュー',
    'sort.updated': '更新日順',
    'sort.created': '作成日順',
    'sort.title': 'タイトル順',
    'notes.empty.noMatch': '一致するメモがありません',
    'notes.empty.noPinned': 'ピン留めしたメモはありません',
    'notes.empty.none': 'メモはまだありません',
    'notes.empty.hint':
      '右下の ＋ から作成、または他のアプリの共有メニューからも追加できます。',
    'note.untitled': '(無題)',
    'action.pin': 'ピン留め',
    'action.unpin': 'ピン留めを解除',
    'action.delete': '削除',
    'action.close': '閉じる',
    'action.newNote': '新規メモ',
    'snack.movedToTrash': 'メモをゴミ箱に移動しました。',
    'action.undo': '元に戻す',

    'editor.editTitle': 'メモを編集',
    'editor.newTitle': '新規メモ',
    'editor.title': 'タイトル',
    'editor.body': '本文',
    'editor.addTag': 'タグを追加',
    'editor.aiLabel': 'AIで処理（本文をもとに）',
    'editor.save': '保存',
    'editor.pin': 'ピン留め',
    'editor.share': '共有',
    'editor.emptyBody': '本文を入力してください。',
    'editor.nothingToShare': '共有する内容がありません。',

    'ai.summary': '要約',
    'ai.todos': 'TODO抽出',
    'ai.proofread': '校正・リライト',
    'ai.summary.oneLine': '要約(1行)',
    'ai.summary.threeLines': '要約(3行)',
    'ai.summary.detailed': '要約(詳細)',
    'ai.todos.label': 'TODO抽出',
    'ai.proofread.label': '校正・リライト',
    'ai.translate': '翻訳',
    'ai.tone': 'トーン変換',
    'ai.continue': '続きを書く',
    'ai.translate.en': '英語に翻訳',
    'ai.translate.ja': '日本語に翻訳',
    'ai.tone.formal': '敬体に変換',
    'ai.tone.casual': 'カジュアルに変換',
    'ai.continue.label': '続きを書く',
    'ai.title.label': 'タイトルを生成',
    'ai.title.done': 'タイトルを生成しました。',
    'ai.notLoaded':
      'AIモデルが読み込まれていません。設定からモデルをダウンロードしてください。',
    'ai.toSettings': 'モデル設定へ',
    'ai.rerun': '再処理',
    'ai.appendToNote': '元に追記',
    'ai.applyToNote': '元に反映',
    'ai.saveNew': '新規保存',
    'action.copy': 'コピー',
    'snack.copied': 'コピーしました。',
    'snack.savedNew': '新しいメモとして保存しました。',
    'ai.noTodos': 'TODOは見つかりませんでした。',
    'ai.sourceMissing': '元のメモが見つかりませんでした。',
    'ai.truncated': '出力が長さの上限に達して途中で止まった可能性があります。',
    'ai.retry': 'もう一度',
    'ai.errorPrefix': 'エラー: ',

    'chat.title': '壁打ちチャット',
    'chat.input': 'メッセージを入力',

    'settings.title': '設定',
    'settings.aiModel': 'AIモデル',
    'settings.commercialCheck': '商用要確認',
    'settings.selected': '選択中',
    'settings.reload': '再読み込み',
    'settings.download': 'ダウンロード',
    'settings.display': '表示',
    'settings.theme': 'テーマ',
    'settings.theme.system': 'システム',
    'settings.theme.light': 'ライト',
    'settings.theme.dark': 'ダーク',
    'settings.language': '言語',
    'settings.lang.ja': '日本語',
    'settings.lang.en': 'English',
    'settings.download.section': 'ダウンロード',
    'settings.wifiOnly': 'Wi-Fiのみでダウンロード',
    'settings.wifiBlocked':
      'Wi-Fiのみ設定が有効です。Wi-Fiに接続するか、「Wi-Fiのみでダウンロード」をオフにするとモバイル通信でダウンロードできます。',
    'settings.data': 'データ',
    'settings.wipe': 'すべてのメモとチャット履歴を削除',
    'settings.loaded': '{name} を読み込みました。',
    'settings.downloadFailed': 'ダウンロードに失敗しました: {error}',
    'settings.deleteFailed': '削除に失敗しました: {error}',
    'settings.wiped': 'すべてのメモとチャット履歴を削除しました。',

    'trash.title': 'ゴミ箱',
    'trash.empty': 'ゴミ箱は空です',
    'trash.emptyAction': 'ゴミ箱を空にする',
    'trash.deletedAt': '削除: {when}',
    'trash.restore': '復元',
    'trash.purge': '完全に削除',
    'trash.confirmTitle': 'ゴミ箱を空にする',
    'trash.confirmBody':
      'ゴミ箱内のすべてのメモを完全に削除します。この操作は取り消せません。',
    'action.cancel': 'キャンセル',
    'trash.confirmEmpty': '空にする',
    'trash.restored': 'メモを復元しました。',
    'trash.purged': 'メモを完全に削除しました。',
    'trash.emptied': 'ゴミ箱を空にしました。',

    'time.today': '今日 {time}',
  },
} as const;

export type StringKey = keyof (typeof STRINGS)['en'];

export function translate(
  lang: Language,
  key: StringKey,
  params?: Record<string, string>,
): string {
  const table = STRINGS[lang] ?? STRINGS.en;
  let s: string = table[key] ?? STRINGS.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(`{${k}}`, v);
    }
  }
  return s;
}

export type TFunc = (key: StringKey, params?: Record<string, string>) => string;

/**
 * Hook returning a translator bound to the current language setting. The
 * returned function is memoized on the language so its identity is stable
 * across renders — otherwise effects/callbacks that depend on `t` would re-run
 * on every render (which, on the AI screen, re-triggered generation in a loop).
 */
export function useT(): TFunc {
  const { settings } = useSettings();
  const lang = settings.language;
  return useCallback(
    (key, params) => translate(lang, key, params),
    [lang],
  );
}
