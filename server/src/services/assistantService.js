const Product = require("../models/Product");
const { generateContent } = require("../config/gemini");

const CHAT_SYSTEM = `You are the AI shopping assistant for TextileHub, a B2B textile marketplace connecting fabric buyers and suppliers.
Rules:
- You may ONLY recommend or reference products from the CANDIDATE PRODUCTS list provided in the user message. Never invent products, prices, suppliers, or specs that are not in that list.
- If the candidate list is empty or nothing truly fits what the buyer asked for, say so honestly and suggest they broaden their search or browse the full marketplace.
- Keep replies concise (2-5 sentences, or a short bullet list), professional, and B2B in tone — buyers are sourcing bulk fabric for their business.
- When recommending, mention product name, category/fabric, price per unit, and MOQ where relevant.
- Never output raw JSON or the word "candidate" — write naturally, as if you already know the catalog.`;

const RECOMMEND_SYSTEM = `You are the AI shopping assistant for TextileHub, a B2B textile marketplace.
You are given a buyer's sourcing profile and a list of CANDIDATE PRODUCTS already selected from live inventory to match that profile.
Write a short, friendly 2-3 sentence introduction to these picks, referencing the buyer's stated preferences (categories/fabric types/order scale) where relevant.
Only reference products from the candidate list. Do not invent products or numbers not present in the list.`;

const COMPARE_SYSTEM = `You are the AI shopping assistant for TextileHub, a B2B textile marketplace.
You are given 2-4 PRODUCTS (JSON) to compare for a bulk fabric buyer.
Write a concise comparison (a short paragraph or bullet list) highlighting real differences: price per unit, MOQ, stock availability, fabric/material, colors, and notable spec differences.
End with a one-line recommendation of which best fits a cost-conscious buyer vs. a quality-focused buyer, if the data supports it.
Only use values present in the given JSON. Never invent numbers or specs.`;

const QNA_SYSTEM = `You are the AI shopping assistant for TextileHub, a B2B textile marketplace.
Answer the buyer's question about a single product using ONLY the PRODUCT JSON provided.
If the answer cannot be determined from the given fields, say plainly that detail isn't listed and suggest contacting the supplier.
Be concise: 1-3 sentences. Never invent specs, prices, or policies not present in the data.`;

const ONBOARDING_SYSTEM = `You help users complete onboarding for a B2B textile marketplace.
Extract only details explicitly stated or safely implied in the user's description. Return ONLY valid JSON, with no markdown and no explanation.

For a buyer return exactly these string fields:
{"businessType":"","industry":"","productCategories":"comma-separated categories","fabricTypes":"comma-separated fabrics","typicalOrderQuantity":"","budgetRange":""}

For a supplier return exactly these string fields:
{"businessName":"","businessType":"","contactInfo":"","address":"","operatingHours":"","productCategories":"comma-separated categories","fabricTypes":"comma-separated fabrics","moq":""}

Use an empty string for unknown fields. Do not invent a company name, contact information, address, quantities, budget, or operating hours.`;

const ONBOARDING_FIELDS = {
  buyer: ["businessType", "industry", "productCategories", "fabricTypes", "typicalOrderQuantity", "budgetRange"],
  supplier: ["businessName", "businessType", "contactInfo", "address", "operatingHours", "productCategories", "fabricTypes", "moq"],
};

function parseOnboardingFields(role, raw) {
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("The AI returned an invalid onboarding response");

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("The AI returned an invalid onboarding response");
  }

  return ONBOARDING_FIELDS[role].reduce((fields, key) => {
    const value = parsed[key];
    fields[key] = typeof value === "string" ? value.slice(0, 300).trim() : "";
    return fields;
  }, {});
}

function extractPriceRange(message) {
  let minPrice = null;
  let maxPrice = null;

  const between = message.match(/between\s*\$?(\d+(?:\.\d+)?)\s*(?:and|-|to)\s*\$?(\d+(?:\.\d+)?)/i);
  if (between) {
    const a = Number(between[1]);
    const b = Number(between[2]);
    return { minPrice: Math.min(a, b), maxPrice: Math.max(a, b) };
  }

  const under = message.match(/(?:under|below|less than|cheaper than)\s*\$?(\d+(?:\.\d+)?)/i);
  if (under) maxPrice = Number(under[1]);

  const over = message.match(/(?:over|above|more than|greater than)\s*\$?(\d+(?:\.\d+)?)/i);
  if (over) minPrice = Number(over[1]);

  return { minPrice, maxPrice };
}

function toSummary(product) {
  return {
    id: product._id,
    name: product.name,
    category: product.category,
    fabricType: product.fabricType,
    price: product.price,
    stock: product.stock,
    moq: product.moq,
    colors: product.colors,
    status: product.status,
    specifications: product.specifications,
    description: product.description,
  };
}

async function retrieveCandidates(message, limit = 10) {
  const [categories, fabricTypes] = await Promise.all([
    Product.distinct("category"),
    Product.distinct("fabricType"),
  ]);

  const lower = message.toLowerCase();
  const matchedCategory = categories.find((c) => c && lower.includes(c.toLowerCase()));
  const matchedFabric = fabricTypes.find((f) => f && lower.includes(f.toLowerCase()));
  const { minPrice, maxPrice } = extractPriceRange(message);

  const structuredQuery = { status: "available" };
  let hasStructured = false;
  if (matchedCategory) {
    structuredQuery.category = matchedCategory;
    hasStructured = true;
  }
  if (matchedFabric) {
    structuredQuery.fabricType = matchedFabric;
    hasStructured = true;
  }
  if (minPrice != null || maxPrice != null) {
    structuredQuery.price = {};
    if (minPrice != null) structuredQuery.price.$gte = minPrice;
    if (maxPrice != null) structuredQuery.price.$lte = maxPrice;
    hasStructured = true;
  }

  let products = [];
  if (hasStructured) {
    products = await Product.find(structuredQuery).sort({ createdAt: -1 }).limit(limit).lean();
  }

  if (products.length === 0) {
    try {
      products = await Product.find({ status: "available", $text: { $search: message } })
        .limit(limit)
        .lean();
    } catch {
      products = [];
    }
  }

  if (products.length === 0) {
    products = await Product.find({ status: "available" }).sort({ createdAt: -1 }).limit(limit).lean();
  }

  return products;
}

async function chat(message) {
  const products = await retrieveCandidates(message);
  const summaries = products.map(toSummary);

  const prompt = `Buyer message: "${message}"\n\nCANDIDATE PRODUCTS (only source of truth, JSON):\n${JSON.stringify(
    summaries
  )}`;

  try {
    const reply = await generateContent(CHAT_SYSTEM, prompt);
    return { reply, products: products.slice(0, 6) };
  } catch (err) {
    return {
      reply:
        products.length > 0
          ? "Here are some matching products from our live marketplace (AI summary is temporarily unavailable)."
          : "I couldn't reach the AI service right now, and no matching products were found. Try browsing the marketplace directly.",
      products: products.slice(0, 6),
      aiUnavailable: true,
    };
  }
}

async function recommendations(user) {
  const buyerProfile = user?.buyerProfile;
  const query = { status: "available" };

  if (buyerProfile?.productCategories?.length || buyerProfile?.fabricTypes?.length) {
    const or = [];
    if (buyerProfile.productCategories?.length) or.push({ category: { $in: buyerProfile.productCategories } });
    if (buyerProfile.fabricTypes?.length) or.push({ fabricType: { $in: buyerProfile.fabricTypes } });
    if (or.length) query.$or = or;
  }

  let products = await Product.find(query).sort({ createdAt: -1 }).limit(8).lean();
  if (products.length === 0) {
    products = await Product.find({ status: "available" }).sort({ createdAt: -1 }).limit(8).lean();
  }

  const summaries = products.map(toSummary);
  const prompt = `Buyer profile: ${JSON.stringify(buyerProfile || {})}\n\nCANDIDATE PRODUCTS (JSON):\n${JSON.stringify(
    summaries
  )}`;

  try {
    const reply = await generateContent(RECOMMEND_SYSTEM, prompt);
    return { reply, products };
  } catch {
    return { reply: "Picks from our live inventory based on your sourcing preferences.", products, aiUnavailable: true };
  }
}

async function compareProducts(productIds) {
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  if (products.length < 2) {
    const err = new Error("At least 2 valid product IDs are required to compare");
    err.statusCode = 400;
    throw err;
  }

  const summaries = products.map(toSummary);
  const prompt = `PRODUCTS TO COMPARE (JSON):\n${JSON.stringify(summaries)}`;

  try {
    const reply = await generateContent(COMPARE_SYSTEM, prompt);
    return { reply, products };
  } catch {
    return { reply: "AI comparison summary is temporarily unavailable — see the product details below.", products, aiUnavailable: true };
  }
}

async function similarProducts(productId, limit = 4) {
  const product = await Product.findById(productId).lean();
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const products = await Product.find({
    _id: { $ne: product._id },
    status: "available",
    $or: [{ category: product.category }, { fabricType: product.fabricType }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return products;
}

async function productQna(productId, question) {
  const product = await Product.findById(productId).lean();
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const prompt = `Buyer question: "${question}"\n\nPRODUCT (JSON):\n${JSON.stringify(toSummary(product))}`;

  try {
    const reply = await generateContent(QNA_SYSTEM, prompt);
    return { reply };
  } catch {
    return {
      reply: "The AI assistant is temporarily unavailable. Please check the product details above or contact the supplier.",
      aiUnavailable: true,
    };
  }
}

async function onboardingAutofill(role, description) {
  const prompt = `Role: ${role}\n\nBusiness description:\n${description}`;
  const reply = await generateContent(ONBOARDING_SYSTEM, prompt);
  return parseOnboardingFields(role, reply);
}

module.exports = { chat, recommendations, compareProducts, similarProducts, productQna, onboardingAutofill };
