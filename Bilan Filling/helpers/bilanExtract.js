// utils/bilanExtraction.js
export function safeDate(d) {
  if (!d) return null;
  const dd = new Date(d);
  return isNaN(dd.getTime()) ? null : dd;
}

/**
 * Essaie d'extraire quelques valeurs (exemple générique, adapte selon ton JSON réel).
 * Si tu ne sais pas encore comment mapper, laisse tout à null.
 */
export function extractQuantitativeFromJson(jsonData) {
  if (!jsonData) return {};

  // EXEMPLES (à adapter) :
  // Supposons jsonData.balanceSheet.assets.tangibleFixedAssets = { netBookValueCurrent, netBookValuePrevious, categories: [...] }
  const tangible = jsonData?.balanceSheet?.assets?.tangibleFixedAssets;

  const netBookValueCurrent  = Number(tangible?.netBookValueCurrent) || null;
  const netBookValuePrevious = Number(tangible?.netBookValuePrevious) || null;
  let netBookValueChangePct  = null;
  if (netBookValueCurrent != null && netBookValuePrevious != null && netBookValuePrevious !== 0) {
    netBookValueChangePct = ((netBookValueCurrent - netBookValuePrevious) / netBookValuePrevious * 100);
  }

  const categories = Array.isArray(tangible?.categories)
    ? tangible.categories.map(c => ({
        code: c.code ?? null,
        label: c.label ?? null,
        netAmountCurrent: c.netAmountCurrent ?? null,
        netAmountPrevious: c.netAmountPrevious ?? null,
        sharePercent: c.sharePercent ?? null
      }))
    : [];

  // (Stocks) supposons jsonData.balanceSheet.assets.inventories?.amount
  const stockAmount = Number(jsonData?.balanceSheet?.assets?.inventories?.amount) || 0;

  return {
    netBookValueCurrent,
    netBookValuePrevious,
    netBookValueChangePct: netBookValueChangePct != null ? Number(netBookValueChangePct.toFixed(2)) : null,
    stockAmount,
    categories
  };
}
