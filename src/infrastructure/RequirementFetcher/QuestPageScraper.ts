import type { QuestPageScraperContract } from '@application/RequirementFetcher/QuestUseCase';
import type { ItemName } from '@domain/shared/ItemName';

export class QuestPageScraper implements QuestPageScraperContract {
  scrapeRequiredItems(_doc: Document): ItemName[] {
    throw new Error('Not implemented');
  }
}
