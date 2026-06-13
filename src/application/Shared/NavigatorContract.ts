import type { Result } from '@core/result';

export interface NavigatorContract {
  fetchDocument(url: string): Promise<Result<Document>>;
  navigateTo(url: string): Promise<Result<void>>;
  currentDocument(): Document;
}
