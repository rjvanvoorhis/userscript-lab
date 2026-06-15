import type { QuestUseCase } from '@application/RequirementFetcher/QuestUseCase';
import { QuestPresenter } from './QuestPresenter';

export class QuestController {
  private readonly presenter: QuestPresenter;

  constructor(useCase: QuestUseCase) {
    this.presenter = new QuestPresenter(useCase);
  }

  start(): Promise<void> {
    return this.presenter.start();
  }
}
