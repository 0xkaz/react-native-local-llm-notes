import { NavigatorScreenParams } from '@react-navigation/native';
import { SummaryLength, ToneStyle, TargetLang } from '../../core';

/** AI operations that the result screen can run on a note body. */
export type AiAction =
  | { kind: 'summary'; length: SummaryLength }
  | { kind: 'todos' }
  | { kind: 'proofread' }
  | { kind: 'translate'; target: TargetLang }
  | { kind: 'tone'; tone: ToneStyle }
  | { kind: 'continue' };

/** Bottom tabs: notes / pinned / trash / settings. */
export type MainTabParamList = {
  Notes: undefined;
  Pinned: undefined;
  Trash: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  /** `sharedText` prefills the body when opened via the OS share sheet. */
  Editor: { noteId?: string; sharedText?: string };
  /** `sourceNoteId` lets the result be applied back to the originating note. */
  AiResult: { sourceText: string; action: AiAction; sourceNoteId?: string };
  Chat: undefined;
};
