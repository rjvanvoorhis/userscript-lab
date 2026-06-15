import type { GenerateSDBReportUseCase } from '@application/SDBManager/GenerateSDBReportUseCase';
import type { SDBManager } from '@application/SDBManager/SDBManager';
import { SDBPresenter } from './SDBPresenter';

export class SDBController {
  private readonly presenter: SDBPresenter;

  constructor(useCase: GenerateSDBReportUseCase, sdbManager: SDBManager) {
    this.presenter = new SDBPresenter(useCase, sdbManager);
  }

  start(): Promise<void> {
    return this.presenter.start();
  }
}
