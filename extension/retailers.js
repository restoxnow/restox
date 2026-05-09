// Retailer configuration — selectors for product data extraction
// Injected before content.js so RETAILERS is available as a global

var RETAILERS = {
  'amazon.com': {
    name: 'Amazon',
    selectors: {
      title: '#productTitle, #title',
      price: '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, .apexPriceToPay .a-offscreen',
      image: '#landingImage, #imgBlkFront, #main-image',
    },
  },
  'walmart.com': {
    name: 'Walmart',
    selectors: {
      title: 'h1[itemprop="name"], h1.prod-ProductTitle, h1[class*="prod-title"]',
      price: '.price-characteristic, [itemprop="price"], [class*="price-group"] [class*="price-main"]',
      image: '.prod-hero-image img, [class*="prod-main-image"] img',
    },
  },
  'target.com': {
    name: 'Target',
    selectors: {
      title: 'h1[data-test="product-title"], h1[class*="Heading"]',
      price: '[data-test="product-price"], [class*="CurrentPriceFontSize"]',
      image: 'picture img[data-test*="product-image"], [class*="slideItem"] img',
    },
  },
  'costco.com': {
    name: 'Costco',
    selectors: {
      title: '.product-title h1, h1[class*="product"]',
      price: '.your-price .value, .costco-price .value',
      image: '#initialProductImage, .product-image img',
    },
  },
  'chewy.com': {
    name: 'Chewy',
    selectors: {
      title: 'h1.product-title, h1[class*="pdp-header"]',
      price: '.product-price .ga-eec__price, [class*="price"] strong',
      image: '.product-image img, [class*="Gallery"] img',
    },
  },
  'homedepot.com': {
    name: 'Home Depot',
    selectors: {
      title: 'h1.product-details__title, h1[class*="product-title"]',
      price: '.price-format__main-price, [class*="sui-text-primary"]',
      image: '.mediagallery__mainimage img, [class*="mediagallery"] img',
    },
  },
  'lowes.com': {
    name: "Lowe's",
    selectors: {
      title: 'h1[class*="title"], h1[class*="product-title"]',
      price: '[class*="art-price"], [class*="art-price-lbl"]',
      image: 'img[class*="product"], [class*="main-image"] img',
    },
  },
  'sephora.com': {
    name: 'Sephora',
    selectors: {
      title: 'h1[data-comp="DisplayName "], h1[class*="ProductDisplayName"]',
      price: '[class*="css-68zi43"], [data-comp*="Price"] p',
      image: 'img[class*="css-"][src*="product"], [class*="img-fluid"]',
    },
  },
  'staples.com': {
    name: 'Staples',
    selectors: {
      title: 'h1.product-name, h1[class*="name"]',
      price: '.standard-price, [class*="regular-price"]',
      image: '.primary-image img, #product-image img',
    },
  },
  'kroger.com': {
    name: 'Kroger',
    selectors: {
      title: 'h1[class*="title"], h1[data-testid*="title"]',
      price: '[class*="kds-Price"], [class*="ProductPrice"]',
      image: 'img[class*="product"], [class*="ProductImage"] img',
    },
  },
};

// Match the current hostname to a retailer config
function getRetailerConfig() {
  var hostname = window.location.hostname.replace(/^www\./, '');
  for (var domain in RETAILERS) {
    if (hostname === domain || hostname.endsWith('.' + domain)) {
      return { domain: domain, config: RETAILERS[domain] };
    }
  }
  return null;
}
