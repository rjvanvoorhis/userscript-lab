import { createLogger } from '@core/logger';
import { createPanel } from '@presentation/shared/dom';
import { Button } from '@presentation/shared/components/Button';
import type { QuestUseCase } from '@application/RequirementFetcher/QuestUseCase';
import type { QuestRequirement } from '@domain/RequirementFetcher/QuestRequirement';

const logger = createLogger({ context: 'QuestPresenter' });

export class QuestPresenter {
  constructor(private readonly useCase: QuestUseCase) {}

  async start(): Promise<void> {
    const result = await this.useCase.fetch();
    result.match({
      err: err => logger.error('Failed to fetch quest requirements', err),
      ok: requirements => this.render(requirements),
    });
  }

  private render(requirements: QuestRequirement[]): void {
    const panel = createPanel('Quest Requirements');
    const list = document.createElement('ul');

    for (const req of requirements) {
      const li = document.createElement('li');
      const owned = req.quantityOwned >= req.quantityNeeded;
      li.textContent = `${req.itemName} — need ${req.quantityNeeded}, own ${req.quantityOwned}`;
      if (req.estimatedCost) li.textContent += ` (~${req.estimatedCost} NP)`;
      li.style.color = owned ? 'green' : 'red';
      list.appendChild(li);
    }

    panel.appendChild(list);
    panel.appendChild(
      Button({
        label: 'Buy Missing Items',
        onClick: () => {
          this.useCase.purchase(requirements).catch(() => logger.error('Purchase failed'));
        },
      }),
    );
    document.body.appendChild(panel);
  }
}
