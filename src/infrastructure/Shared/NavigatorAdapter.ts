import { attemptAsync } from '@core/result';
import type { Result } from '@core/result';
import type { NavigatorContract } from '@application/shared/NavigatorContract';

export class NavigatorAdapter implements NavigatorContract {
  async fetchDocument(url: string): Promise<Result<Document>> {
    return attemptAsync(async () => {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
      const text = await response.text();
      return new DOMParser().parseFromString(text, 'text/html');
    });
  }

  async navigateTo(url: string): Promise<Result<void>> {
    return attemptAsync(async () => {
      window.location.href = url;
    });
  }

  currentDocument(): Document {
    return window.document;
  }
}
