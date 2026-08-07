require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const Quote = require("../models/Quote");

const DEMO_ADMIN = {
  name: "Demo Admin",
  email: "demo.admin@textilehub.com",
  password: "Demo@1234",
  role: "admin",
  isOnboarded: true,
  isEmailVerified: true,
  // Never suspendable/demotable by anyone (including other admins) — keeps
  // the always-available demo login stable. See adminController's guard.
  isProtected: true,
};

const DEMO_BUYER = {
  name: "Demo Buyer",
  email: "demo.buyer@textilehub.com",
  password: "Demo@1234",
  role: "buyer",
  isOnboarded: true,
  isEmailVerified: true,
  buyerProfile: {
    businessType: "Retailer",
    industry: "Apparel & Fashion",
    productCategories: ["Cotton", "Denim"],
    fabricTypes: ["Cotton", "Denim"],
    typicalOrderQuantity: "500 - 1000 units",
    budgetRange: "$5,000 - $20,000",
  },
};

const DEMO_SUPPLIER = {
  name: "Demo Supplier",
  email: "demo.supplier@textilehub.com",
  password: "Demo@1234",
  role: "supplier",
  isOnboarded: true,
  isEmailVerified: true,
  supplierProfile: {
    businessName: "Demo Textile Mills",
    businessType: "Manufacturer",
    contactInfo: "+880-1700-000000",
    address: "Gazipur Textile Zone, Dhaka, Bangladesh",
    operatingHours: "Sun - Thu, 9:00 AM - 6:00 PM",
    productCategories: ["Cotton", "Silk", "Denim", "Linen", "Wool"],
    fabricTypes: ["Cotton", "Silk", "Denim", "Linen", "Wool"],
    moq: "100",
    isVerified: true,
  },
};

// Second supplier — diversifies the marketplace into home textiles so it reads
// like a real multi-vendor marketplace instead of a single-storefront demo.
const DEMO_SUPPLIER_2 = {
  name: "Anwar Islam",
  email: "demo.supplier2@textilehub.com",
  password: "Demo@1234",
  role: "supplier",
  isOnboarded: true,
  isEmailVerified: true,
  supplierProfile: {
    businessName: "Anwar Home Textiles",
    businessType: "Manufacturer & Exporter",
    contactInfo: "+880-1811-222333",
    address: "Narayanganj Textile Cluster, Dhaka, Bangladesh",
    operatingHours: "Sat - Thu, 8:30 AM - 6:30 PM",
    productCategories: ["Home Textile"],
    fabricTypes: ["Cotton", "Linen", "Polyester", "Fleece"],
    moq: "50",
    isVerified: true,
  },
};

// A handful of extra buyer accounts used only to author reviews, so ratings on
// the seeded catalog look like real social proof (multiple distinct reviewers)
// instead of one account rating everything.
const EXTRA_REVIEWERS = [
  {
    name: "Farhana Rahman",
    email: "farhana.buyer@textilehub.com",
    password: "Demo@1234",
    role: "buyer",
    isOnboarded: true,
    isEmailVerified: true,
    buyerProfile: {
      businessType: "Wholesaler",
      industry: "Apparel & Fashion",
      productCategories: ["Cotton", "Silk"],
      fabricTypes: ["Cotton", "Silk"],
      typicalOrderQuantity: "100 - 500 units",
      budgetRange: "$1,000 - $5,000",
    },
  },
  {
    name: "Tanvir Ahmed",
    email: "tanvir.buyer@textilehub.com",
    password: "Demo@1234",
    role: "buyer",
    isOnboarded: true,
    isEmailVerified: true,
    buyerProfile: {
      businessType: "Manufacturer",
      industry: "Home Furnishing",
      productCategories: ["Home Textile", "Linen"],
      fabricTypes: ["Linen", "Cotton"],
      typicalOrderQuantity: "500 - 1000 units",
      budgetRange: "$5,000 - $20,000",
    },
  },
  {
    name: "Nusrat Jahan",
    email: "nusrat.buyer@textilehub.com",
    password: "Demo@1234",
    role: "buyer",
    isOnboarded: true,
    isEmailVerified: true,
    buyerProfile: {
      businessType: "Retailer",
      industry: "Apparel & Fashion",
      productCategories: ["Denim", "Wool"],
      fabricTypes: ["Denim", "Wool"],
      typicalOrderQuantity: "under 100 units",
      budgetRange: "under $1,000",
    },
  },
];

// Real, verified Unsplash photos (looked up live via Unsplash search) instead of
// random unrelated placeholder photos — each product shows the actual finished
// garment/item it's selling, not raw fabric yardage.
function unsplashGallery(...ids) {
  return ids.map((id) => ({ url: `https://images.unsplash.com/photo-${id}?w=800&h=600&q=80&auto=format&fit=crop` }));
}

const DEMO_PRODUCTS = [
  // Cotton
  {
    name: "Men's Premium Cotton Crew-Neck T-Shirt",
    category: "Cotton",
    description:
      "Soft 100% combed cotton crew-neck t-shirt, pre-shrunk and garment-dyed for a premium retail-ready finish. Popular for private-label basics and graphic tee programs.",
    colors: ["White", "Black", "Navy", "Heather Grey", "Olive"],
    specifications: "180 GSM combed cotton, single jersey knit | Sizes: S, M, L, XL, XXL",
    fabricType: "Cotton",
    stock: 3200,
    price: 4.5,
    moq: 100,
    // minQty tiers showcase bulk-pricing breaks; sizes let a buyer pick a
    // specific size at checkout with real per-size inventory.
    priceTiers: [
      { minQty: 500, price: 4.2 },
      { minQty: 1000, price: 3.9 },
    ],
    sizes: [
      { label: "S", stock: 600 },
      { label: "M", stock: 900 },
      { label: "L", stock: 900 },
      { label: "XL", stock: 600 },
      { label: "XXL", stock: 200 },
    ],
    images: unsplashGallery("1651761179569-4ba2aa054997", "1523381294911-8d3cead13475", "1780566035913-9233ca20dc29"),
  },
  {
    name: "Cotton Fleece Pullover Hoodie",
    category: "Cotton",
    description:
      "Heavyweight cotton-rich fleece hoodie with a kangaroo pocket and ribbed cuffs — a bestselling streetwear staple ready for bulk private-label orders.",
    colors: ["White", "Black", "Charcoal", "Sage Green"],
    specifications: "320 GSM cotton-poly fleece (80/20) | Sizes: S, M, L, XL, XXL",
    fabricType: "Cotton",
    stock: 1800,
    price: 9.8,
    moq: 100,
    sizes: [
      { label: "S", stock: 300 },
      { label: "M", stock: 500 },
      { label: "L", stock: 500 },
      { label: "XL", stock: 400 },
      { label: "XXL", stock: 100 },
    ],
    images: unsplashGallery("1620799140188-3b2a02fd9a77", "1578768079052-aa76e52ff62e", "1615397587950-3cbb55f95b77"),
  },
  {
    name: "Men's Cotton Panjabi (Kurta)",
    category: "Cotton",
    description:
      "Traditional men's panjabi in breathable cotton with fine embroidery detail — tailored for festive and formal occasions, ready for bulk wholesale orders.",
    colors: ["White", "Off-White", "Forest Green", "Maroon"],
    specifications: "Pure cotton, hand-embroidered placket | Sizes: M, L, XL, XXL",
    fabricType: "Cotton",
    stock: 950,
    price: 14.5,
    moq: 50,
    images: unsplashGallery("1743757452138-554f31bdce81", "1765776748692-ce409b809816", "1734418040900-e964f84e8abb"),
  },
  {
    name: "Cotton Pique Polo Shirt",
    category: "Cotton",
    description:
      "Classic pique-knit cotton polo with a ribbed collar and two-button placket — a wardrobe essential for corporate uniforms and casualwear lines.",
    colors: ["White", "Black", "Sky Blue", "Maroon"],
    specifications: "220 GSM cotton pique | Sizes: S, M, L, XL, XXL",
    fabricType: "Cotton",
    stock: 2200,
    price: 6.2,
    moq: 100,
    images: unsplashGallery("1671438118097-479e63198629", "1714317438040-0e8584215699", "1720514496161-914011a9ee02"),
  },

  // Silk
  {
    name: "Kanjivaram-Style Silk Saree",
    category: "Silk",
    description:
      "Handloom-inspired silk saree with a rich zari border, woven for bridal and festive collections — supplied ready-to-drape with a matching blouse piece.",
    colors: ["Maroon & Gold", "Royal Blue & Gold", "Emerald & Gold"],
    specifications: "Pure mulberry silk, zari border | Length: 6.3 meters with blouse piece",
    fabricType: "Silk",
    stock: 340,
    price: 38,
    moq: 20,
    images: unsplashGallery("1692992193981-d3d92fabd9cb", "1617627143750-d86bc21e42bb"),
  },
  {
    name: "Silk Wrap Blouse",
    category: "Silk",
    description:
      "Fluid mulberry silk blouse with a soft drape and covered placket — designed for premium eveningwear and occasion-wear lines.",
    colors: ["Red", "Ivory", "Champagne", "Black"],
    specifications: "100% mulberry silk, 16 momme | Sizes: XS, S, M, L, XL",
    fabricType: "Silk",
    stock: 480,
    price: 22.5,
    moq: 30,
    images: unsplashGallery("1761117228880-df2425bd70da", "1761121317492-57feee4fc674"),
  },

  // Denim
  {
    name: "Men's Straight-Fit Denim Jeans",
    category: "Denim",
    description:
      "Ring-spun cotton denim jeans in a classic straight fit with light distressing — cut-and-sew ready for private-label denim programs.",
    colors: ["Light Wash", "Mid Blue", "Black"],
    specifications: "12oz ring-spun cotton denim | Sizes: 30-40 waist",
    fabricType: "Denim",
    stock: 1600,
    price: 13.8,
    moq: 100,
    images: unsplashGallery("1602293589930-45aad59ba3ab", "1714729382668-7bc3bb261662", "1721637286605-ae9be19d681f"),
  },
  {
    name: "Classic Denim Trucker Jacket",
    category: "Denim",
    description:
      "Timeless denim trucker jacket with a contrast collar and chest flap pockets — a season-round layering staple for retail programs.",
    colors: ["Indigo Blue", "Washed Blue"],
    specifications: "13oz cotton denim, contrast corduroy collar | Sizes: S, M, L, XL, XXL",
    fabricType: "Denim",
    stock: 780,
    price: 24,
    moq: 60,
    images: unsplashGallery("1611312449408-fcece27cdbb7", "1543076447-215ad9ba6923", "1614699745279-2c61bd9d46b5"),
  },

  // Linen
  {
    name: "Men's Linen Casual Shirt",
    category: "Linen",
    description:
      "Breathable linen-blend shirt with a relaxed fit — tailored for warm-weather and resort wear collections.",
    colors: ["Chambray Blue", "White", "Sand"],
    specifications: "100% European flax linen | Sizes: S, M, L, XL, XXL",
    fabricType: "Linen",
    stock: 1250,
    price: 11.5,
    moq: 80,
    images: unsplashGallery("1740711152088-88a009e877bb", "1713881587420-113c1c43e28a", "1713881842156-3d9ef36418cc"),
  },
  {
    name: "Women's Linen Midi Dress",
    category: "Linen",
    description:
      "Effortless linen midi dress with a relaxed drape — a warm-weather bestseller ready for resortwear and everyday lines.",
    colors: ["Beige", "Sage", "Terracotta"],
    specifications: "100% washed linen | Sizes: XS, S, M, L, XL",
    fabricType: "Linen",
    stock: 640,
    price: 16.9,
    moq: 50,
    images: unsplashGallery("1578747522731-9e5a179b02f7", "1659297949927-06fa02629af0", "1764298493197-a1c1cce57800"),
  },

  // Wool
  {
    name: "Merino Wool Knit Sweater",
    category: "Wool",
    description:
      "Soft merino wool-blend knit sweater with ribbed cuffs and hem — a cold-weather staple for outerwear and knitwear lines.",
    colors: ["Oatmeal", "Charcoal", "Camel"],
    specifications: "70% merino wool / 30% acrylic knit | Sizes: S, M, L, XL",
    fabricType: "Wool",
    stock: 520,
    price: 21,
    moq: 50,
    images: unsplashGallery("1574201635302-388dd92a4c3f", "1601379327928-bedfaf9da2d0", "1610901157620-340856d0a50f"),
  },
  {
    name: "Women's Wool Blend Overcoat",
    category: "Wool",
    description:
      "Tailored wool-blend overcoat with a belted waist and notch lapel — a premium outerwear piece for winter collections.",
    colors: ["Camel", "Charcoal", "Black"],
    specifications: "80% wool / 20% polyester | Sizes: XS, S, M, L, XL",
    fabricType: "Wool",
    stock: 0,
    price: 45,
    moq: 30,
    images: unsplashGallery("1539533113208-f6df8cc8b543", "1619603364904-c0498317e145", "1619603364937-8d7af41ef206"),
  },

  // New additions (appended, not interspersed, so existing positional array
  // destructuring in seedOrders/seedReviews below stays correct)
  {
    name: "Kids' Cotton Graphic T-Shirt",
    category: "Cotton",
    description:
      "Playful printed graphic t-shirt in soft combed cotton jersey, sized for toddlers through pre-teens — a fast-moving SKU for kidswear retail programs.",
    colors: ["White", "Sky Blue", "Yellow", "Coral"],
    specifications: "160 GSM combed cotton jersey, water-based ink print | Sizes: 2T, 4T, 6T, 8T, 10T",
    fabricType: "Cotton",
    price: 3.6,
    moq: 150,
    priceTiers: [
      { minQty: 300, price: 3.3 },
      { minQty: 600, price: 3.0 },
    ],
    sizes: [
      { label: "2T", stock: 240 },
      { label: "4T", stock: 320 },
      { label: "6T", stock: 320 },
      { label: "8T", stock: 240 },
      { label: "10T", stock: 160 },
    ],
    images: unsplashGallery("1622290291468-a28f7a7dc6a8", "1519238263530-99bdd11df2ea"),
  },
  {
    name: "Women's Silk Kimono Robe",
    category: "Silk",
    description:
      "Lightweight mulberry silk kimono robe with a self-tie sash — a fast-selling loungewear and gifting item for premium boutique programs.",
    colors: ["Blush", "Emerald", "Black", "Ivory"],
    specifications: "100% mulberry silk, 19 momme charmeuse | One size (fits XS-L)",
    fabricType: "Silk",
    stock: 260,
    price: 17.5,
    moq: 25,
    images: unsplashGallery("1660576320811-8c8f0b0a4d6b", "1617627143750-d86bc21e42bb"),
  },
  {
    name: "Wool Blend Winter Scarf",
    category: "Wool",
    description:
      "Cozy brushed wool-blend scarf with a fringed edge — a high-margin accessory add-on for winter outerwear and gifting collections.",
    colors: ["Camel", "Charcoal", "Burgundy", "Forest Green"],
    specifications: "60% wool / 40% acrylic brushed knit | Size: 12 x 70 in",
    fabricType: "Wool",
    stock: 890,
    price: 5.4,
    moq: 100,
    priceTiers: [{ minQty: 300, price: 4.8 }],
    images: unsplashGallery("1520903920243-00d872a2d1c9", "1610901157620-340856d0a50f"),
  },
];

// Home Textile catalog for the second supplier — broadens the marketplace
// beyond garments (bedding, bath, curtain, and cushion fabric).
const DEMO_PRODUCTS_2 = [
  {
    name: "Organic Cotton Bedsheet Set (King Size)",
    category: "Home Textile",
    description:
      "GOTS-certified organic cotton bedsheet set with fitted sheet, flat sheet, and two pillowcases — a sustainability-forward staple for hospitality and home-goods retail programs.",
    colors: ["White", "Ivory", "Dove Grey", "Sage"],
    specifications: "300 thread count, sateen weave, 100% organic cotton | Size: King (108x102 in)",
    fabricType: "Cotton",
    stock: 1400,
    price: 18.5,
    moq: 50,
    priceTiers: [
      { minQty: 100, price: 17 },
      { minQty: 250, price: 15.5 },
    ],
    images: unsplashGallery("1550252225-69800809ba78", "1563722047694-a8e189ce8c10"),
  },
  {
    name: "Egyptian Cotton Bath Towel Set",
    category: "Home Textile",
    description:
      "Plush 600 GSM Egyptian cotton bath towel set (bath sheet, hand towel, washcloth) with a dobby border — a hotel-quality staple for bath linen retail programs.",
    colors: ["White", "Charcoal", "Powder Blue", "Blush"],
    specifications: "600 GSM combed Egyptian cotton terry | Set: 1 bath sheet, 1 hand towel, 1 washcloth",
    fabricType: "Cotton",
    stock: 2100,
    price: 12.9,
    moq: 100,
    images: unsplashGallery("1639298108944-76a403a7c38d", "1635352558665-0b01650e9b84"),
  },
  {
    name: "Blackout Curtain Fabric Panel",
    category: "Home Textile",
    description:
      "Triple-weave blackout curtain panel that blocks 99% of light and reduces outside noise — a fast-moving SKU for home decor and hospitality supply chains.",
    colors: ["Charcoal", "Navy", "Beige", "Ivory"],
    specifications: "Triple-weave polyester, thermal-insulated lining | Panel: 52 x 84 in",
    fabricType: "Polyester",
    stock: 900,
    price: 15.75,
    moq: 60,
    images: unsplashGallery("1780155968749-2b45bcd44884"),
  },
  {
    name: "Recycled Fleece Throw Blanket",
    category: "Home Textile",
    description:
      "Ultra-soft throw blanket woven from recycled polyester fleece — an eco-conscious bestseller for home decor and gifting lines.",
    colors: ["Oatmeal", "Charcoal", "Dusty Rose", "Forest"],
    specifications: "300 GSM recycled polyester fleece | Size: 50 x 60 in",
    fabricType: "Fleece",
    stock: 760,
    price: 9.4,
    moq: 50,
    images: unsplashGallery("1531877025030-f7696a50770f"),
  },
  {
    name: "Linen Table Runner & Napkin Set",
    category: "Home Textile",
    description:
      "Stonewashed pure linen table runner with a matching 6-piece napkin set — a premium tabletop staple for dining and hospitality retail.",
    colors: ["Natural", "Charcoal", "Terracotta", "Sage"],
    specifications: "100% stonewashed linen | Set: 1 runner (14x108 in) + 6 napkins (20x20 in)",
    fabricType: "Linen",
    stock: 540,
    price: 21.0,
    moq: 30,
    images: unsplashGallery("1613408112209-426e294ee6fd"),
  },
  {
    name: "Decorative Cushion Cover Set (Cotton-Linen)",
    category: "Home Textile",
    description:
      "Textured cotton-linen blend cushion cover set with a concealed zipper closure — a fast-selling accent piece for home decor programs.",
    colors: ["Natural", "Mustard", "Terracotta", "Slate Blue"],
    specifications: "55% linen / 45% cotton blend | Set of 2, 18x18 in covers",
    fabricType: "Cotton-Linen Blend",
    stock: 1100,
    price: 7.6,
    moq: 100,
    images: unsplashGallery("1617596225496-1d9da33a144b"),
  },

  // New additions (appended — see note in DEMO_PRODUCTS above)
  {
    name: "Waterproof Mattress Protector",
    category: "Home Textile",
    description:
      "Quilted, fully waterproof mattress protector with an elasticized fitted skirt — a steady-selling bedding staple across every mattress size.",
    colors: ["White"],
    specifications: "Cotton terry face, TPU waterproof backing | Sizes: Twin, Full, Queen, King",
    fabricType: "Cotton",
    price: 13.2,
    moq: 40,
    sizes: [
      { label: "Twin", stock: 220 },
      { label: "Full", stock: 260 },
      { label: "Queen", stock: 340 },
      { label: "King", stock: 180 },
    ],
    images: unsplashGallery("1631049307264-da0ec9d70304"),
  },
  {
    name: "Kitchen Towel & Apron Set",
    category: "Home Textile",
    description:
      "Absorbent waffle-weave cotton kitchen towel set bundled with a matching adjustable apron — a fast-moving gift-set SKU for home goods retail.",
    colors: ["Natural", "Sage", "Charcoal", "Terracotta"],
    specifications: "100% waffle-weave cotton | Set: 3 towels (18x28 in) + 1 apron",
    fabricType: "Cotton",
    stock: 980,
    price: 6.9,
    moq: 100,
    priceTiers: [{ minQty: 400, price: 6.0 }],
    images: unsplashGallery("1622480916113-9000ac49b79d"),
  },
];

async function upsertUser(def) {
  let user = await User.findOne({ email: def.email });
  if (!user) {
    user = await User.create(def);
    console.log(`Created ${def.role} account: ${def.email}`);
  } else {
    // Re-syncing an already-existing seed account: keep protection flags in
    // step with the definition above even across repeated `seed:demo` runs
    // (e.g. this field didn't exist on an account created before it was added).
    if (def.isProtected !== undefined && user.isProtected !== def.isProtected) {
      user.isProtected = def.isProtected;
      await user.save();
    }
    console.log(`${def.role} account already exists: ${def.email}`);
  }
  return user;
}

async function upsertCatalog(supplier, catalog) {
  const created = [];
  for (const def of catalog) {
    const { name, ...rest } = def;
    // findOneAndUpdate bypasses the Product model's pre("save") hook, so when
    // a product defines sizes, derive stock/status from them here the same
    // way the hook would for anything created through the real API.
    if (rest.sizes?.length) {
      rest.stock = rest.sizes.reduce((sum, s) => sum + s.stock, 0);
    }
    const status = rest.stock > 0 ? "available" : "out-of-stock";
    const product = await Product.findOneAndUpdate(
      { supplierId: supplier._id, name },
      { ...rest, name, supplierId: supplier._id, status },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    created.push(product);
  }

  // Remove older demo products no longer part of the catalog, so re-running the
  // seed doesn't leave stale items behind.
  const currentNames = catalog.map((p) => p.name);
  const { deletedCount } = await Product.deleteMany({
    supplierId: supplier._id,
    name: { $nin: currentNames },
  });
  if (deletedCount) console.log(`Removed ${deletedCount} stale demo product(s) for ${supplier.email}`);

  return created;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function orderItem(product, quantity) {
  return {
    productId: product._id,
    supplierId: product.supplierId,
    name: product.name,
    image: product.images[0]?.url,
    price: product.price,
    quantity,
  };
}

async function seedOrders(buyer, productsA, productsB) {
  // Wipe previous demo orders/notifications so re-running the script doesn't
  // pile up duplicates — this is seed data, not user-generated history.
  await Order.deleteMany({ buyerId: buyer._id });
  await Notification.deleteMany({
    userId: { $in: [buyer._id, productsA[0].supplierId, productsB[0].supplierId] },
  });

  const [tshirt, hoodie, kurta, polo] = productsA;
  const denimJeans = productsA.find((p) => p.name.includes("Denim Jeans"));
  const wool = productsA.find((p) => p.name.includes("Merino"));
  const [bedsheet, towels, curtain, blanket] = productsB;
  const cushion = productsB.find((p) => p.name.includes("Cushion"));

  // { itemsSpec: [[product, qty], ...], status, daysAgo }
  const orderDefs = [
    { items: [[tshirt, 200]], status: "Completed", days: 54 },
    { items: [[bedsheet, 60]], status: "Completed", days: 47 },
    { items: [[hoodie, 100], [curtain, 60]], status: "Completed", days: 40 },
    { items: [[polo, 150]], status: "Completed", days: 33 },
    { items: [[towels, 120]], status: "Completed", days: 26 },
    { items: [[denimJeans, 100]], status: "Ready for Dispatch", days: 18 },
    { items: [[blanket, 80]], status: "Preparing", days: 12 },
    { items: [[kurta, 50], [cushion, 100]], status: "Accepted", days: 8 },
    { items: [[wool, 50]], status: "Accepted", days: 4 },
    { items: [[tshirt, 300]], status: "Pending", days: 1 },
    { items: [[bedsheet, 50]], status: "Pending", days: 0 },
  ];

  // Statuses reached only after a supplier has accepted the order — matches
  // orderController.updateOrderStatus, which charges the 10% platform fee
  // (from the supplier's side only) the moment status first becomes "Accepted".
  const CONFIRMED_STATUSES = ["Accepted", "Preparing", "Ready for Dispatch", "Completed"];

  const created = [];
  for (const def of orderDefs) {
    const items = def.items.filter(([p]) => p).map(([p, qty]) => orderItem(p, qty));
    if (!items.length) continue;
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const createdAt = daysAgo(def.days);

    if (CONFIRMED_STATUSES.includes(def.status)) {
      items.forEach((item) => {
        const grossAmount = item.price * item.quantity;
        item.platformFee = Math.round(grossAmount * 0.1 * 100) / 100;
        item.supplierNetAmount = Math.round((grossAmount - item.platformFee) * 100) / 100;
        item.supplierConfirmedAt = createdAt;
      });
    }
    const order = await Order.create({
      buyerId: buyer._id,
      items,
      shippingInfo: {
        fullName: buyer.name,
        phone: "+880-1911-555000",
        address: "House 12, Road 5, Banani",
        city: "Dhaka",
        postalCode: "1213",
      },
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: def.status,
      createdAt,
      updatedAt: createdAt,
    });
    created.push(order);

    const supplierIds = [...new Set(items.map((i) => String(i.supplierId)))];
    const notifs = supplierIds.map((supplierId) => ({
      userId: supplierId,
      type: "new_order",
      message: `New order #${String(order._id).slice(-6).toUpperCase()} received ($${order.totalAmount.toFixed(2)})`,
      link: "/dashboard/supplier/orders",
      read: def.status !== "Pending",
      createdAt,
      updatedAt: createdAt,
    }));
    if (def.status !== "Pending") {
      notifs.push({
        userId: buyer._id,
        type: "order_status",
        message: `Your order #${String(order._id).slice(-6).toUpperCase()} is now "${def.status}"`,
        link: "/dashboard/buyer",
        read: true,
        createdAt,
        updatedAt: createdAt,
      });
    }
    await Notification.insertMany(notifs);
  }

  console.log(`Seeded ${created.length} demo orders spanning the last ${orderDefs[0].days} days`);
  return created;
}

async function recomputeProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avgRating = stats[0]?.avg || 0;
  const numReviews = stats[0]?.count || 0;
  await Product.findByIdAndUpdate(productId, { avgRating: Math.round(avgRating * 10) / 10, numReviews });
}

async function seedReviews(reviewers, productsA, productsB) {
  await Review.deleteMany({ buyerId: { $in: reviewers.map((r) => r._id) } });

  const [tshirt, hoodie, kurta, polo, saree] = productsA;
  const denimJeans = productsA.find((p) => p.name.includes("Denim Jeans"));
  const wool = productsA.find((p) => p.name.includes("Merino"));
  const [bedsheet, towels] = productsB;

  const reviewDefs = [
    { product: tshirt, entries: [
      { reviewer: 0, rating: 5, comment: "Fabric quality held up perfectly across 3 wash cycles for our first bulk order." },
      { reviewer: 1, rating: 4, comment: "Good GSM and consistent sizing across the batch. Reorder-worthy." },
    ] },
    { product: hoodie, entries: [
      { reviewer: 1, rating: 5, comment: "Heavyweight fleece, exactly as described. Our streetwear line loved it." },
      { reviewer: 2, rating: 4, comment: "Slight color variance between lots but overall solid quality." },
    ] },
    { product: kurta, entries: [
      { reviewer: 0, rating: 5, comment: "Embroidery detail is excellent for the price point — great for festive season stock." },
    ] },
    { product: polo, entries: [
      { reviewer: 2, rating: 4, comment: "Reliable pique knit, good for our corporate uniform program." },
      { reviewer: 0, rating: 5, comment: "Fast turnaround and the colors matched our swatch approval." },
    ] },
    { product: saree, entries: [
      { reviewer: 1, rating: 5, comment: "Zari work is genuinely handloom-quality. Bridal collection customers were impressed." },
    ] },
    { product: denimJeans, entries: [
      { reviewer: 2, rating: 4, comment: "Solid 12oz denim, distressing was consistent across the whole order." },
      { reviewer: 1, rating: 3, comment: "Good fabric but a couple of units had loose stitching — worth a QC pass." },
    ] },
    { product: wool, entries: [
      { reviewer: 0, rating: 5, comment: "Soft hand-feel, great for our winter knitwear drop." },
    ] },
    { product: bedsheet, entries: [
      { reviewer: 1, rating: 5, comment: "Organic certification paperwork was ready on request — big plus for our hospitality clients." },
      { reviewer: 2, rating: 4, comment: "Sateen weave feels premium, packaging was retail-ready." },
    ] },
    { product: towels, entries: [
      { reviewer: 0, rating: 5, comment: "600 GSM is no exaggeration — genuinely plush. Reordering next quarter." },
    ] },
  ];

  let count = 0;
  for (const def of reviewDefs) {
    if (!def.product) continue;
    for (const entry of def.entries) {
      const buyer = reviewers[entry.reviewer];
      await Review.create({
        productId: def.product._id,
        buyerId: buyer._id,
        rating: entry.rating,
        comment: entry.comment,
      });
      count++;
    }
    await recomputeProductRating(def.product._id);
  }
  console.log(`Seeded ${count} demo reviews across ${reviewDefs.length} products`);
}

// Seeds a few RFQs across the quote lifecycle (Pending / Responded / Accepted)
// so the bulk-quote feature is visibly working the moment a judge logs in,
// without needing to manually request one first.
async function seedQuotes(buyer, productsA, productsB) {
  await Quote.deleteMany({ buyerId: buyer._id });

  const tshirt = productsA.find((p) => p.name.includes("Crew-Neck T-Shirt"));
  const denimJacket = productsA.find((p) => p.name.includes("Trucker Jacket"));
  const bedsheet = productsB.find((p) => p.name.includes("Bedsheet"));

  const quoteDefs = [
    tshirt && {
      product: tshirt,
      quantity: 2000,
      targetPrice: 3.7,
      message: "Recurring quarterly order for our retail chain — can you match this target price?",
      status: "Accepted",
      response: { price: 3.75, message: "We can do $3.75/unit for a recurring quarterly commitment.", daysAgo: 5 },
      daysAgo: 7,
    },
    denimJacket && {
      product: denimJacket,
      quantity: 300,
      targetPrice: 20,
      message: "First trial order before we commit to a full season program.",
      status: "Responded",
      response: { price: 21.5, message: "Best we can offer for a 300-unit trial order is $21.50/unit.", daysAgo: 1 },
      daysAgo: 2,
    },
    bedsheet && {
      product: bedsheet,
      quantity: 500,
      message: "Looking for hospitality-grade pricing for a 500-unit hotel supply order.",
      status: "Pending",
      daysAgo: 0,
    },
  ].filter(Boolean);

  const created = [];
  for (const def of quoteDefs) {
    const createdAt = daysAgo(def.daysAgo);
    const doc = {
      buyerId: buyer._id,
      supplierId: def.product.supplierId,
      productId: def.product._id,
      productName: def.product.name,
      productImage: def.product.images[0]?.url,
      quantity: def.quantity,
      targetPrice: def.targetPrice,
      message: def.message,
      status: def.status,
      createdAt,
      updatedAt: createdAt,
    };
    if (def.response) {
      doc.response = {
        price: def.response.price,
        message: def.response.message,
        respondedAt: daysAgo(def.response.daysAgo),
      };
      doc.updatedAt = daysAgo(def.response.daysAgo);
    }
    created.push(await Quote.create(doc));
  }
  console.log(`Seeded ${created.length} demo quote requests`);
  return created;
}

async function run() {
  await connectDB();

  const admin = await upsertUser(DEMO_ADMIN);
  const buyer = await upsertUser(DEMO_BUYER);
  const supplier = await upsertUser(DEMO_SUPPLIER);
  const supplier2 = await upsertUser(DEMO_SUPPLIER_2);
  const reviewers = [buyer];
  for (const def of EXTRA_REVIEWERS) {
    reviewers.push(await upsertUser(def));
  }

  const productsA = await upsertCatalog(supplier, DEMO_PRODUCTS);
  const productsB = await upsertCatalog(supplier2, DEMO_PRODUCTS_2);
  console.log(`Seeded ${productsA.length} products for ${supplier.email}`);
  console.log(`Seeded ${productsB.length} products for ${supplier2.email}`);

  await seedOrders(buyer, productsA, productsB);
  await seedReviews(reviewers, productsA, productsB);
  await seedQuotes(buyer, productsA, productsB);

  console.log("\nDemo login credentials:");
  console.log(`  Admin:    ${admin.email} / ${DEMO_ADMIN.password}`);
  console.log(`  Buyer:    ${DEMO_BUYER.email} / ${DEMO_BUYER.password}`);
  console.log(`  Supplier: ${DEMO_SUPPLIER.email} / ${DEMO_SUPPLIER.password}`);
  console.log(`  Supplier 2: ${DEMO_SUPPLIER_2.email} / ${DEMO_SUPPLIER_2.password}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
