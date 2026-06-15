import type { ItemListing } from '@domain/shared/ItemListing';
import { NeoPoint } from '@domain/shared';

export type ExtractorFunc = (html: string) => ItemListing[];

export function extractShopWizardResults(html: string): ItemListing[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const listings: ItemListing[] = [];

  for (const li of doc.querySelectorAll('div.wizard-results-grid-shop li')) {
    const link = li.querySelector<HTMLAnchorElement>('a[href*="browseshop.phtml"]');
    const stockEl = li.querySelector('p');
    const priceEl = li.querySelector('div.wizard-results-price');

    if (!link || !stockEl || !priceEl) continue;

    const priceMatch = priceEl.textContent?.trim().match(/^([\d,]+)\s+NP$/);
    if (!priceMatch) continue;

    const priceAmount = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    if (Number.isNaN(priceAmount) || priceAmount <= 0) continue;

    listings.push({
      shopOwner: link.textContent?.trim() ?? '',
      stock: parseInt(stockEl.textContent?.trim() ?? '0', 10),
      price: NeoPoint.from(priceAmount),
      purchaseLink: link.getAttribute('href') ?? '',
    });
  }

  return listings;
}
