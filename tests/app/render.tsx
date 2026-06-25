import { ReactElement } from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

/** Render a component tree inside a Paper provider, as the real app does. */
export function renderWithPaper(ui: ReactElement) {
  return render(<PaperProvider>{ui}</PaperProvider>);
}
