import { createLogger } from '@core/logger';
import { NeoPoint } from '@domain/shared/NeoPoint';
import { NavigatorAdapter } from '@infrastructure/shared/NavigatorAdapter';
import { HistoricalPriceAdapter } from '@infrastructure/PriceChecker/HistoricalPriceAdapter';
import { ShopWizardPriceAdapter } from '@infrastructure/PriceChecker/ShopWizardPriceAdapter';
import { GetItemPriceUseCase } from '@application/PriceChecker/GetItemPriceUseCase';
import { ShopWizardAdapter } from '@infrastructure/ItemBuyer/ShopWizardAdapter';
import { UserShopBuyerAdapter } from '@infrastructure/ItemBuyer/UserShopBuyerAdapter';
import { BuyItemUseCase } from '@application/ItemBuyer/BuyItemUseCase';
import { SDBPageScraper } from '@infrastructure/SDBManager/SDBPageScraper';
import { SDBManager } from '@application/SDBManager/SDBManager';
import { QuestPageScraper } from '@infrastructure/RequirementFetcher/QuestPageScraper';
import { FetchQuestRequirementsUseCase } from '@application/RequirementFetcher/FetchQuestRequirementsUseCase';
import { PurchaseQuestItemsUseCase } from '@application/RequirementFetcher/PurchaseQuestItemsUseCase';
import { RestockShopScraper } from '@infrastructure/Restocker/RestockShopScraper';
import { RestockBuyAdapter } from '@infrastructure/Restocker/RestockBuyAdapter';
import { RestockPanelAdapter } from '@infrastructure/Restocker/RestockPanelAdapter';
import { ScanRestockShopUseCase } from '@application/Restocker/ScanRestockShopUseCase';
import { RestockPageController } from '@application/Restocker/RestockPageController';
import { NPCShopBuyerAdapter } from '@infrastructure/ItemBuyer/NPCShopBuyerAdapter';
import { DocumentServiceAdapter } from '@infrastructure/shared/DocumentServiceAdapter';
import { UrlMapCaptchaSolver } from '@infrastructure/ItemBuyer/CaptchaSolver/UrlMapCaptchaSolver';
import { LocalStorageAdapter } from '@infrastructure/shared/LocalStorageAdapter';
import { HISTORICAL_PRICE_CACHE_KEY } from '@core/constants';
import { NEOPETS_SHOPS } from '@core/shops';
import { GenerateSDBReportUseCase } from '@application/SDBManager/GenerateSDBReportUseCase';
import { BetPageScraper } from '@infrastructure/BetForecast/BetPageScraper';
import { BetSubmitterAdapter } from '@infrastructure/BetForecast/BetSubmitterAdapter';
import { BetRecordAdapter } from '@infrastructure/BetForecast/BetRecordAdapter';
import { LocalBetAdvisor } from '@infrastructure/BetForecast/LocalBetAdvisor';
import { PlaceOptimalBetsUseCase } from '@application/BetForecast/PlaceOptimalBetsUseCase';
import { ShopPricerPageAdapter } from '@infrastructure/ShopPricer/ShopPricerPageAdapter';
import { PriceShopItemsUseCase } from '@application/ShopPricer/PriceShopItemsUseCase';

const logger = createLogger({ context: 'main' });

function main() {
  const url = globalThis.location.href;

  // --- Shared infrastructure ---
  const navigator = new NavigatorAdapter();

  // --- Shared application services ---
  const historical = new HistoricalPriceAdapter({});
  const livePrice = new ShopWizardPriceAdapter();
  const priceChecker = new GetItemPriceUseCase(historical, livePrice);

  const shopWizard = new ShopWizardAdapter();
  const shopPurchaser = new UserShopBuyerAdapter();
  const itemBuyer = new BuyItemUseCase(shopWizard, shopPurchaser);

  const sdbScraper = new SDBPageScraper();
  const sdbManager = new SDBManager(sdbScraper, navigator);

  // --- URL routing ---
  const parsed = new URL(url);
  const path = parsed.pathname;
  const param = (k: string) => parsed.searchParams.get(k);

  const routes: Array<{ match: () => boolean; activate: () => Promise<void> }> = [
    {
      match: () => /quests\.phtml|faeriequestcorner/.test(path),
      activate: () => activateRequirementFetcher(),
    },
    {
      match: () => path.endsWith('objects.phtml') && param('type') === 'shop',
      activate: () => activateRestocker(),
    },
    {
      match: () => path.endsWith('market.phtml') && param('type') === 'your',
      activate: () => activateShopPricer(),
    },
    {
      match: () => path.endsWith('safetydeposit.phtml'),
      activate: () => activateSDBManager(),
    },
    {
      match: () => path.endsWith('foodclub.phtml'),
      activate: () => activateBetForecast(),
    },
  ];

  const matched = routes.find(r => r.match());
  if (matched) {
    logger.info('Activating feature', { url });
    matched.activate().catch(err => logger.error('Feature activation failed', err));
  }

  // --- Feature activators ---

  async function activateRequirementFetcher() {
    const questScraper = new QuestPageScraper();
    const fetchUseCase = new FetchQuestRequirementsUseCase(navigator, questScraper, sdbManager, priceChecker);
    const purchaseUseCase = new PurchaseQuestItemsUseCase(itemBuyer);

    const result = await fetchUseCase.execute();
    result.match({
      err: err => logger.error('Failed to fetch quest requirements', err),
      ok: requirements => renderRequirementsPanel(requirements, () => purchaseUseCase.execute(requirements)),
    });
  }

  async function activateRestocker() {
    const storage = new LocalStorageAdapter();

    const cached = await storage.get(HISTORICAL_PRICE_CACHE_KEY);
    let historicalPricer: HistoricalPriceAdapter;
    if (cached) {
      historicalPricer = HistoricalPriceAdapter.fromData(cached as Record<string, number>);
    } else {
      const snapshot = await HistoricalPriceAdapter.fetchSnapshot();
      historicalPricer = HistoricalPriceAdapter.fromSnapshot(snapshot);
      await storage.set(HISTORICAL_PRICE_CACHE_KEY, historicalPricer.getData());
    }

    const documentService = new DocumentServiceAdapter();
    const captchaSolver = new UrlMapCaptchaSolver();
    const npcBuyer = new NPCShopBuyerAdapter(captchaSolver, documentService);
    const shopScraper = new RestockShopScraper();
    const buyAdapter = new RestockBuyAdapter(npcBuyer);
    const scanUseCase = new ScanRestockShopUseCase(navigator, shopScraper, historicalPricer, buyAdapter);
    const panel = new RestockPanelAdapter();
    const controller = new RestockPageController(panel, scanUseCase, navigator, storage, NEOPETS_SHOPS);

    panel.onRefreshPrices(async () => {
      await storage.remove(HISTORICAL_PRICE_CACHE_KEY);
      const fresh = await HistoricalPriceAdapter.fetchSnapshot();
      const freshPricer = HistoricalPriceAdapter.fromSnapshot(fresh);
      await storage.set(HISTORICAL_PRICE_CACHE_KEY, freshPricer.getData());
      await navigator.navigateTo(globalThis.location.href);
    });

    await controller.start({
      autobuyEnabled: false,
      autorefreshEnabled: false,
      refreshFrequencyMs: 5000,
      shopId: '',
      minProfitMargin: NeoPoint.from(1000),
    });
  }

  async function activateSDBManager() {
    const reportUseCase = new GenerateSDBReportUseCase(sdbManager);
    await sdbManager.loadSDB();
    const result = await reportUseCase.execute();
    if (result.isOK()) renderSDBReport(result.unwrap());
  }

  async function activateShopPricer() {
    const page = new ShopPricerPageAdapter();
    new PriceShopItemsUseCase(page, priceChecker).execute();
  }

  async function activateBetForecast() {
    const betScraper = new BetPageScraper(navigator);
    const betRecords = new BetRecordAdapter();
    const advisor = new LocalBetAdvisor(betScraper, betRecords);
    const betSubmitter = new BetSubmitterAdapter();
    const placeUseCase = new PlaceOptimalBetsUseCase(advisor, betSubmitter);

    const result = await placeUseCase.execute();
    if (result.isErr()) logger.error('Bet placement failed');
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
