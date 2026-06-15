import { createLogger } from '@core/logger';
import { NeoPoint } from '@domain/shared/NeoPoint';
import { NavigatorAdapter } from '@infrastructure/shared/NavigatorAdapter';
import { LocalStorageAdapter } from '@infrastructure/shared/LocalStorageAdapter';
import { HistoricalPriceAdapter } from '@infrastructure/PriceChecker/HistoricalPriceAdapter';
import { ShopWizardPriceAdapter } from '@infrastructure/PriceChecker/ShopWizardPriceAdapter';
import { LegacyShopWizardAdapter } from '@infrastructure/PriceChecker/LegacyShopWizardAdapter';
import { LivePriceAdapter } from '@infrastructure/PriceChecker/LivePriceAdapter';
import { GetItemPriceUseCase } from '@application/PriceChecker/GetItemPriceUseCase';
import { ShopWizardAdapter } from '@infrastructure/ItemBuyer/ShopWizardAdapter';
import { UserShopBuyerAdapter } from '@infrastructure/ItemBuyer/UserShopBuyerAdapter';
import { BuyItemUseCase } from '@application/ItemBuyer/BuyItemUseCase';
import { SDBPageScraper } from '@infrastructure/SDBManager/SDBPageScraper';
import { SDBManager } from '@application/SDBManager/SDBManager';
import { QuestPageScraper } from '@infrastructure/RequirementFetcher/QuestPageScraper';
import { QuestUseCase } from '@application/RequirementFetcher/QuestUseCase';
import { QuestController } from '@presentation/RequirementFetcher/QuestController';
import { RestockShopScraper } from '@infrastructure/Restocker/RestockShopScraper';
import { RestockBuyAdapter } from '@infrastructure/Restocker/RestockBuyAdapter';
import { ScanRestockShopUseCase } from '@application/Restocker/ScanRestockShopUseCase';
import { RestockController } from '@presentation/Restocker/RestockController';
import { NPCShopBuyerAdapter } from '@infrastructure/ItemBuyer/NPCShopBuyerAdapter';
import { DocumentServiceAdapter } from '@infrastructure/shared/DocumentServiceAdapter';
import { UrlMapCaptchaSolver } from '@infrastructure/ItemBuyer/CaptchaSolver/UrlMapCaptchaSolver';
import { GenerateSDBReportUseCase } from '@application/SDBManager/GenerateSDBReportUseCase';
import { SDBController } from '@presentation/SDBManager/SDBController';
import { BetPageScraper } from '@infrastructure/BetForecast/BetPageScraper';
import { BetSubmitterAdapter } from '@infrastructure/BetForecast/BetSubmitterAdapter';
import { BetRecordAdapter } from '@infrastructure/BetForecast/BetRecordAdapter';
import { LocalBetAdvisor } from '@infrastructure/BetForecast/LocalBetAdvisor';
import { PlaceOptimalBetsUseCase } from '@application/BetForecast/PlaceOptimalBetsUseCase';
import { BetForecastController } from '@presentation/BetForecast/BetForecastController';
import { ShopPricerPageAdapter } from '@infrastructure/ShopPricer/ShopPricerPageAdapter';
import { PriceShopItemsUseCase } from '@application/ShopPricer/PriceShopItemsUseCase';
import { ShopPricerController } from '@presentation/ShopPricer/ShopPricerController';

const logger = createLogger({ context: 'main' });

const RESTOCKER_DEFAULTS = {
  autobuyEnabled: false,
  autorefreshEnabled: false,
  refreshFrequencyMs: 5000,
  minProfitMargin: NeoPoint.from(1000),
};

async function activateRequirementFetcher() {
  const nav = new NavigatorAdapter();
  const useCase = new QuestUseCase(
    nav,
    new QuestPageScraper(),
    new SDBManager(new SDBPageScraper(), nav),
    new GetItemPriceUseCase(new HistoricalPriceAdapter({}), new LivePriceAdapter(new ShopWizardPriceAdapter(), new LegacyShopWizardAdapter())),
    new BuyItemUseCase(new ShopWizardAdapter(), new UserShopBuyerAdapter()),
  );
  await new QuestController(useCase).start();
}

async function activateRestocker(param: (k: string) => string | null) {
  const storage = new LocalStorageAdapter();
  const nav = new NavigatorAdapter();
  const pricer = await HistoricalPriceAdapter.loadCached(storage);
  const useCase = new ScanRestockShopUseCase(
    nav,
    new RestockShopScraper(),
    pricer,
    new RestockBuyAdapter(
      new NPCShopBuyerAdapter(new UrlMapCaptchaSolver(), new DocumentServiceAdapter()),
      nav,
    ),
  );
  await new RestockController(useCase).start({ shopId: param('obj_type') ?? '', ...RESTOCKER_DEFAULTS });
}

async function activateShopPricer() {
  const useCase = new PriceShopItemsUseCase(
    new ShopPricerPageAdapter(),
    new LivePriceAdapter(new ShopWizardPriceAdapter(), new LegacyShopWizardAdapter()),
  );
  await new ShopPricerController(useCase).start();
}

async function activateSDBManager() {
  const nav = new NavigatorAdapter();
  const sdbManager = new SDBManager(new SDBPageScraper(), nav);
  const useCase = new GenerateSDBReportUseCase(sdbManager);
  await new SDBController(useCase, sdbManager).start();
}

async function activateBetForecast() {
  const nav = new NavigatorAdapter();
  const useCase = new PlaceOptimalBetsUseCase(
    new LocalBetAdvisor(new BetPageScraper(nav), new BetRecordAdapter()),
    new BetSubmitterAdapter(),
  );
  await new BetForecastController(useCase).start();
}

function main() {
  const url = globalThis.location.href;
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
      activate: () => activateRestocker(param),
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
}

main();
