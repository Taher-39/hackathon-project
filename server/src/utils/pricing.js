// Given a product with optional bulk-pricing tiers, returns the per-unit price
// that applies for a given order quantity. Falls back to the base price when
// no tiers are defined or the quantity doesn't reach any tier's minQty.
function effectiveUnitPrice(product, quantity) {
  const tiers = product?.priceTiers;
  if (!Array.isArray(tiers) || tiers.length === 0) return product.price;

  const qualifying = tiers
    .filter((t) => quantity >= t.minQty)
    .sort((a, b) => b.minQty - a.minQty);

  return qualifying.length ? qualifying[0].price : product.price;
}

module.exports = { effectiveUnitPrice };
