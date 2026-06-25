import { fireEvent, screen } from '@testing-library/react-native';
import StreamingResult from '../../src/app/components/StreamingResult';
import { renderWithPaper } from './render';

describe('StreamingResult', () => {
  test('renders the result text', () => {
    renderWithPaper(
      <StreamingResult text="要約された本文" loading={false} truncated={false} />,
    );
    expect(screen.getByText('要約された本文')).toBeOnTheScreen();
  });

  test('shows the spinner while loading', () => {
    renderWithPaper(
      <StreamingResult text="部分的な出力" loading truncated={false} />,
    );
    expect(screen.getByLabelText('generating')).toBeOnTheScreen();
  });

  test('hides the spinner when not loading', () => {
    renderWithPaper(
      <StreamingResult text="完了" loading={false} truncated={false} />,
    );
    expect(screen.queryByLabelText('generating')).toBeNull();
  });

  test('shows a truncation banner and fires onRetry', () => {
    const onRetry = jest.fn();
    renderWithPaper(
      <StreamingResult
        text="途中まで"
        loading={false}
        truncated
        onRetry={onRetry}
        truncatedMessage="出力が途中で止まりました"
        retryLabel="もう一度"
      />,
    );
    expect(screen.getByText('出力が途中で止まりました')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('もう一度'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('renders an error message', () => {
    renderWithPaper(
      <StreamingResult
        text=""
        loading={false}
        truncated={false}
        error="モデル未読み込み"
      />,
    );
    expect(screen.getByText(/モデル未読み込み/)).toBeOnTheScreen();
  });

  test('matches snapshot for a plain completed result', () => {
    const tree = renderWithPaper(
      <StreamingResult text="完了した結果" loading={false} truncated={false} />,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
