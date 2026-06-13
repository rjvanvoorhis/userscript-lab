import { createLogger } from '@core/logger';
import { NeoPoint } from '@domain/shared/NeoPoint';
import { NavigatorAdapter } from '@infrastructure/shared/NavigatorAdapter';
import { HistoricalPriceAdapter } from '@infrastructure/PriceChecker/HistoricalPriceAdapter';
import { LiveScraperAdapter } from '@infrastructure/PriceChecker/LiveScraperAdapter';
import { GetItemPriceUseCase } from '@application/PriceChecker/GetItemPriceUseCase';
import { ShopWizardAdapter } from '@infrastructure/ItemBuyer/ShopWizardAdapter';
import { ShopNavigatorAdapter } from '@infrastructure/ItemBuyer/ShopNavigatorAdapter';
import { BuyItemUseCase } from '@application/ItemBuyer/BuyItemUseCase';
import { SDBPageScraper } from '@infrastructure/SDBManager/SDBPageScraper';
import { SDBManager } from '@application/SDBManager/SDBManager';
import { QuestPageScraper } from '@infrastructure/RequirementFetcher/QuestPageScraper';
import { FetchQuestRequirementsUseCase } from '@application/RequirementFetcher/FetchQuestRequirementsUseCase';
import { PurchaseQuestItemsUseCase } from '@application/RequirementFetcher/PurchaseQuestItemsUseCase';
import { RestockShopScraper } from '@infrastructure/Restocker/RestockShopScraper';
import { RestockBuyAdapter } from '@infrastructure/Restocker/RestockBuyAdapter';
import { ScanRestockShopUseCase } from '@application/Restocker/ScanRestockShopUseCase';
import { RestockBackoffUseCase } from '@application/Restocker/RestockBackoffUseCase';
import { GenerateSDBReportUseCase } from '@application/SDBManager/GenerateSDBReportUseCase';
import { BetPageScraper } from '@infrastructure/BetForecast/BetPageScraper';
import { BetSubmitterAdapter } from '@infrastructure/BetForecast/BetSubmitterAdapter';
import { BetRecordAdapter } from '@infrastructure/BetForecast/BetRecordAdapter';
import { LocalBetAdvisor } from '@infrastructure/BetForecast/LocalBetAdvisor';
import { PlaceOptimalBetsUseCase } from '@application/BetForecast/PlaceOptimalBetsUseCase';

const logger = createLogger({ context: 'main' });

function main() {
  const url = window.location.href;

  // --- Shared infrastructure ---
  const navigator = new NavigatorAdapter();

  // --- Shared application services ---
  const historical = new HistoricalPriceAdapter();
  const livePrice = new LiveScraperAdapter();
  const priceChecker = new GetItemPriceUseCase(historical, livePrice);

  const shopWizard = new ShopWizardAdapter();
  const shopPurchaser = new ShopNavigatorAdapter();
  const itemBuyer = new BuyItemUseCase(shopWizard, shopPurchaser);

  const sdbScraper = new SDBPageScraper();
  const sdbManager = new SDBManager(sdbScraper, navigator);

  // --- URL routing ---
  const routes: Array<{ pattern: RegExp; activate: () => void }> = [
    {
      pattern: /quests\.phtml|faeriequestcorner/,
      activate: () => activateRequirementFetcher(),
    },
    {
      pattern: /npcshops\.phtml|bargainshop\.phtml|mall\/shop\.phtml/,
      activate: () => activateRestocker(),
    },
    {
      pattern: /safetydeposit\.phtml/,
      activate: () => activateSDBManager(),
    },
    {
      pattern: /medieval\/foodclub\.phtml/,
      activate: () => activateBetForecast(),
    },
  ];

  const matched = routes.find(r => r.pattern.test(url));
  if (matched) {
    logger.info('Activating feature', { url });
    matched.activate();
  }

  // --- Feature activators ---

  function activateRequirementFetcher() {
    const questScraper = new QuestPageScraper();
    const fetchUseCase = new FetchQuestRequirementsUseCase(navigator, questScraper, sdbManager, priceChecker);
    const purchaseUseCase = new PurchaseQuestItemsUseCase(itemBuyer);

    fetchUseCase.execute().then(result => result.match({
      err: err => logger.error('Failed to fetch quest requirements', err),
      ok: requirements => renderRequirementsPanel(requirements, () => purchaseUseCase.execute(requirements)),
    }));
  }

  function activateRestocker() {
    const shopScraper = new RestockShopScraper();
    const buyAdapter = new RestockBuyAdapter();
    const scanUseCase = new ScanRestockShopUseCase(navigator, shopScraper, priceChecker, buyAdapter);
    const backoffUseCase = new RestockBackoffUseCase(scanUseCase);

    backoffUseCase.execute(
      { profitThreshold: NeoPoint.from(1000) },
      { maxCycles: 10 },
    ).then(opportunities => {
      logger.info('Restock cycle complete', { opportunities: opportunities.length });
    });
  }

  function activateSDBManager() {
    const reportUseCase = new GenerateSDBReportUseCase(sdbManager);
    sdbManager.loadSDB().then(() =>
      reportUseCase.execute().then(result => {
        if (result.isOK()) renderSDBReport(result.unwrap());
      }),
    );
  }

  function activateBetForecast() {
    const betScraper = new BetPageScraper(navigator);
    const betRecords = new BetRecordAdapter();
    const advisor = new LocalBetAdvisor(betScraper, betRecords);
    const betSubmitter = new BetSubmitterAdapter();
    const placeUseCase = new PlaceOptimalBetsUseCase(advisor, betSubmitter);

    placeUseCase.execute().then(result => {
      if (result.isErr()) logger.error('Bet placement failed');
    });
  }
}

// --- UI helpers (thin DOM injection — no framework dependency) ---

function renderRequirementsPanel(
  requirements: import('@domain/RequirementFetcher/QuestRequirement').QuestRequirement[],
  onPurchaseAll: () => void,
) {
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

  const btn = document.createElement('button');
  btn.textContent = 'Buy Missing Items';
  btn.addEventListener('click', onPurchaseAll);

  panel.appendChild(list);
  panel.appendChild(btn);
  document.body.appendChild(panel);
}

function renderSDBReport(report: import('@application/SDBManager/GenerateSDBReportUseCase').SDBReport) {
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


function createPanel(title: string): HTMLDivElement {
  const panel = document.createElement('div');
  panel.style.cssText = [
    'position:fixed', 'top:10px', 'right:10px', 'z-index:99999',
    'background:#fff', 'border:2px solid #333', 'border-radius:6px',
    'padding:12px', 'max-width:300px', 'font-family:sans-serif', 'font-size:13px',
  ].join(';');

  const h = document.createElement('h3');
  h.textContent = title;
  h.style.margin = '0 0 8px';
  panel.appendChild(h);

  return panel;
}

main();
