import { createLogger } from '@core/logger';
import { createPanel } from '@presentation/shared/dom';
import type { GenerateSDBReportUseCase, SDBReport } from '@application/SDBManager/GenerateSDBReportUseCase';
import type { SDBManager } from '@application/SDBManager/SDBManager';

const logger = createLogger({ context: 'SDBPresenter' });

export class SDBPresenter {
  constructor(
    private readonly useCase: GenerateSDBReportUseCase,
    private readonly sdbManager: SDBManager,
  ) {}

  async start(): Promise<void> {
    await this.sdbManager.loadSDB();
    const result = await this.useCase.execute();
    if (result.isOK()) {
      this.render(result.unwrap());
    } else {
      logger.error('Failed to generate SDB report');
    }
  }

  private render(report: SDBReport): void {
    const panel = createPanel('SDB Report');
    panel.innerHTML += `<p>${report.totalUniqueItems} unique items, ${report.totalItems} total</p>`;
    const list = document.createElement('ul');
    for (const entry of report.entries) {
      const li = document.createElement('li');
      li.textContent = `${entry.name} ×${entry.quantity}`;
      list.appendChild(li);
    }
    panel.appendChild(list);
    document.body.appendChild(panel);
  }
}
