import { screen } from '@testing-library/react-native';
import ChatBubble from '../../src/app/components/ChatBubble';
import { renderWithPaper } from './render';

describe('ChatBubble', () => {
  test('renders the message content', () => {
    renderWithPaper(<ChatBubble role="user" content="こんにちは" />);
    expect(screen.getByText('こんにちは')).toBeOnTheScreen();
  });

  test('user and assistant turns render distinct alignment', () => {
    const user = renderWithPaper(
      <ChatBubble role="user" content="質問" />,
    ).toJSON();
    expect(user).toMatchSnapshot('user-bubble');

    const assistant = renderWithPaper(
      <ChatBubble role="assistant" content="返答" />,
    ).toJSON();
    expect(assistant).toMatchSnapshot('assistant-bubble');
  });
});
