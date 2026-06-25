import { KeyValueStorage } from '../storage/types';
import { ChatMessage } from '../llm/types';

const STORAGE_KEY = 'chat/history/v1';

/**
 * Persists a single brainstorming conversation thread on device.
 *
 * The MVP keeps one ongoing thread (not multiple sessions). Messages are
 * stored as a JSON array under one key. An optional `maxMessages` cap trims
 * the oldest turns so history cannot grow without bound.
 */
export class ChatStore {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly maxMessages = 200,
  ) {}

  async load(): Promise<ChatMessage[]> {
    const raw = await this.storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
    } catch {
      return [];
    }
  }

  private async save(messages: ChatMessage[]): Promise<void> {
    const trimmed =
      messages.length > this.maxMessages
        ? messages.slice(messages.length - this.maxMessages)
        : messages;
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }

  async append(message: ChatMessage): Promise<ChatMessage[]> {
    const messages = await this.load();
    messages.push(message);
    await this.save(messages);
    return this.load();
  }

  async appendExchange(
    userMessage: string,
    assistantMessage: string,
  ): Promise<ChatMessage[]> {
    const messages = await this.load();
    messages.push({ role: 'user', content: userMessage });
    messages.push({ role: 'assistant', content: assistantMessage });
    await this.save(messages);
    return this.load();
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEY);
  }
}
