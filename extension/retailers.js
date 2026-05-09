// Retailer configuration — selectors for product data extraction + URL patterns
// Injected before content.js so RETAILERS and helpers are available as globals

var RETAILERS = {

  // ── Existing retailers ──────────────────────────────────────────────────

  'amazon.com': {
    name: 'Amazon',
    urlPattern: /\/(dp|gp\/product)\//,
    selectors: {
      title: '#productTitle, #title',
      price: '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, .apexPriceToPay .a-offscreen',
      image: '#landingImage, #imgBlkFront, #main-image',
    },
  },

  'walmart.com': {
    name: 'Walmart',
    urlPattern: /\/ip\//,
    selectors: {
      title: 'h1[itemprop="name"], h1.prod-ProductTitle, h1[class*="prod-title"]',
      price: '.price-characteristic, [itemprop="price"], [class*="price-group"] [class*="price-main"]',
      image: '.prod-hero-image img, [class*="prod-main-image"] img',
    },
  },

  'target.com': {
    name: 'Target',
    urlPattern: /\/p\//,
    selectors: {
      title: 'h1[data-test="product-title"], h1[class*="Heading"]',
      price: '[data-test="product-price"], [class*="CurrentPriceFontSize"]',
      image: 'picture img[data-test*="product-image"], [class*="slideItem"] img',
    },
  },

  'costco.com': {
    name: 'Costco',
    urlPattern: /\/product\//,
    selectors: {
      title: '.product-title h1, h1[class*="product"]',
      price: '.your-price .value, .costco-price .value',
      image: '#initialProductImage, .product-image img',
    },
  },

  'chewy.com': {
    name: 'Chewy',
    urlPattern: /\/dp\//,
    selectors: {
      title: 'h1.product-title, h1[class*="pdp-header"]',
      price: '.product-price .ga-eec__price, [class*="price"] strong',
      image: '.product-image img, [class*="Gallery"] img',
    },
  },

  'homedepot.com': {
    name: 'Home Depot',
    urlPattern: /\/p\//,
    selectors: {
      title: 'h1.product-details__title, h1[class*="product-title"]',
      price: '.price-format__main-price, [class*="sui-text-primary"]',
      image: '.mediagallery__mainimage img, [class*="mediagallery"] img',
    },
  },

  'lowes.com': {
    name: "Lowe's",
    urlPattern: /\/pd\//,
    selectors: {
      title: 'h1[class*="title"], h1[class*="product-title"]',
      price: '[class*="art-price"], [class*="art-price-lbl"]',
      image: 'img[class*="product"], [class*="main-image"] img',
    },
  },

  'sephora.com': {
    name: 'Sephora',
    urlPattern: /\/product\//,
    selectors: {
      title: 'h1[data-comp="DisplayName "], h1[class*="ProductDisplayName"]',
      price: '[class*="css-68zi43"], [data-comp*="Price"] p',
      image: 'img[class*="css-"][src*="product"], [class*="img-fluid"]',
    },
  },

  'staples.com': {
    name: 'Staples',
    urlPattern: /\/product_/,
    selectors: {
      title: 'h1.product-name, h1[class*="name"]',
      price: '.standard-price, [class*="regular-price"]',
      image: '.primary-image img, #product-image img',
    },
  },

  'kroger.com': {
    name: 'Kroger',
    urlPattern: /\/p\//,
    selectors: {
      title: 'h1[class*="title"], h1[data-testid*="title"]',
      price: '[class*="kds-Price"], [class*="ProductPrice"]',
      image: 'img[class*="product"], [class*="ProductImage"] img',
    },
  },

  // ── Additional retailers ────────────────────────────────────────────────

  'instacart.com': {
    name: 'Instacart',
    urlPattern: /\/products\//,
    selectors: {
      title: 'h1[class*="item-card-name"], [data-testid="item-details-header"] h1, h1[class*="product-name"]',
      price: '[data-testid="item-details-price"], [class*="item-price"], [class*="product-price"]',
      image: 'img[class*="product-image"], img[data-testid="product-image"]',
    },
  },

  'albertsons.com': {
    name: 'Albertsons',
    urlPattern: /\/shop\/product-details/,
    selectors: {
      title: 'h1[class*="product-name"], h1[data-testid="product-name"], .product-details__name h1',
      price: '[class*="product-price"], [data-testid="product-price"], .price-value',
      image: 'img[class*="product-img"], [class*="product-image"] img',
    },
  },

  'stopandshop.com': {
    name: 'Stop & Shop',
    urlPattern: /\/sm\/planning\/rsid\//,
    selectors: {
      title: 'h1[class*="product-name"], h1[class*="ProductName"], .product-header h1',
      price: '[class*="product-price"], [class*="ProductPrice"], .product-price__amount',
      image: '[class*="product-image"] img, [class*="ProductImage"] img',
    },
  },

  'wegmans.com': {
    name: 'Wegmans',
    urlPattern: /\/shop\/products\//,
    selectors: {
      title: 'h1[class*="product-title"], h1[class*="ProductTitle"], [data-testid="product-name"]',
      price: '[class*="product-price"], [class*="price__amount"], [data-testid="product-price"]',
      image: '[class*="product-image"] img, [class*="ProductImage"] img',
    },
  },

  'samsclub.com': {
    name: "Sam's Club",
    urlPattern: /\/p\//,
    selectors: {
      title: 'h1[itemprop="name"], h1[class*="sc-product-title"], [data-testid="product-title"]',
      price: '[data-testid="item-price-final"], [class*="Price"], [class*="price__value"]',
      image: 'img[class*="product-hero"], [class*="product-hero"] img',
    },
  },

  'uline.com': {
    name: 'Uline',
    urlPattern: /\/bl\//,
    selectors: {
      title: 'h1.ProductNameFont, h1[class*="product-name"], #productName',
      price: '[class*="price"], .PriceAmt, #priceAmt',
      image: '#prodImageMain, img.product-image, #productImage',
    },
  },

  'grainger.com': {
    name: 'Grainger',
    urlPattern: /\/product\//,
    selectors: {
      title: 'h1[class*="product-title"], .pdp-title h1, [class*="ProductTitle"]',
      price: '[class*="price__value"], .price-label, [data-automation="product-price"]',
      image: '[class*="pdp-image"] img, img[class*="product"], .product-media img',
    },
  },

  'officedepot.com': {
    name: 'Office Depot/OfficeMax',
    urlPattern: /\/pd\//,
    selectors: {
      title: 'h1.product-title, h1[class*="title"], [itemprop="name"]',
      price: '[class*="price-block"] [class*="price"], .skuBestPrice, [class*="ItemPrice"]',
      image: 'img.mainImage, #product-image img, [class*="product-media"] img',
    },
  },

};

// ---------------------------------------------------------------------------
// Match the current hostname to a retailer config
// ---------------------------------------------------------------------------
function getRetailerConfig() {
  var hostname = window.location.hostname.replace(/^www\./, '');
  for (var domain in RETAILERS) {
    if (hostname === domain || hostname.endsWith('.' + domain)) {
      return { domain: domain, config: RETAILERS[domain] };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// DOM signal detection — returns true if the page looks like a product page.
// Checks for cart/action buttons, price elements, and known product title IDs.
// Call this after a short render delay (300–500 ms) so the DOM is settled.
// ---------------------------------------------------------------------------
var _CART_RE  = /add to cart|buy now|add to bag|subscribe/i;
var _PRICE_RE = /\$[\d,]+\.\d{2}/;

function hasDOMSignals() {
  // 1. Cart / Buy button text
  var actionEls = document.querySelectorAll('button, [role="button"], input[type="submit"], a[role="button"]');
  for (var i = 0; i < actionEls.length; i++) {
    var text = (actionEls[i].textContent || '') + (actionEls[i].value || '');
    if (_CART_RE.test(text)) return true;
  }

  // 2. Price element with a dollar amount
  var priceEls = document.querySelectorAll(
    '[class*="price"], [class*="Price"], [itemprop="price"], [data-test*="price"], [data-testid*="price"]'
  );
  for (var j = 0; j < priceEls.length; j++) {
    var content = priceEls[j].textContent || priceEls[j].getAttribute('content') || '';
    if (_PRICE_RE.test(content)) return true;
  }

  // 3. Amazon-specific product title element
  if (document.getElementById('productTitle')) return true;

  return false;
}
