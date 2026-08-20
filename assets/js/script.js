// ==========================================================================
// Mine Mart Storefront Persistence & Multi-Currency Engine (USD & IQD)
// ==========================================================================

const BACKEND_URL = (typeof window !== 'undefined' && (window.location.protocol === 'file:' || (window.location.port !== '5000' && !window.location.port)))
    ? 'http://localhost:5000'
    : '';
const API_BASE = `${BACKEND_URL}/api/v1`;
const EXCHANGE_RATE_USD_TO_IQD = 1320; // 1 USD = 1,320 IQD

// Cross-tab Real-Time Synchronization Channel
const minemartChannel = (typeof window !== 'undefined' && window.BroadcastChannel) ? new BroadcastChannel('minemart_store_channel') : null;

// ==========================================================================
// IndexedDB Dual-Layer Permanent Persistence Engine
// ==========================================================================
const IDB_NAME = 'MineMartPermanentDB';
const IDB_STORE = 'app_state';

function openIDB() {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !window.indexedDB) return resolve(null);
        try {
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        } catch(e) {
            resolve(null);
        }
    });
}

async function idbSet(key, val) {
    try {
        const db = await openIDB();
        if (!db) return;
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(val, key);
    } catch(e) {}
}

async function idbGet(key) {
    try {
        const db = await openIDB();
        if (!db) return null;
        return new Promise((resolve) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const req = tx.objectStore(IDB_STORE).get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch(e) {
        return null;
    }
}

// Seed Categories Default Data
const defaultCategories = [
    { id: 1, name: "المخلوقات 3D", slug: "creatures", count: 4, image: "assets/images/prod_fox.jpg", desc: "مجسمات وشخصيات مطبوعة بتقنية 3D دقيقة بأسلوب البكسل العالي الجودة، مثل الثعلب، التنين الأخضر، والمجسمات الآلية." },
    { id: 2, name: "ديكور ومصابيح", slug: "decor", count: 3, image: "assets/images/prod_sword.jpg", desc: "سيوف دايموند مضيئة ولوحات جدارية بكسلية تحوّل غرفتك إلى بيئة ماين كرافت خرافية." },
    { id: 3, name: "مستلزمات السيت اب", slug: "accessories", count: 3, image: "assets/images/prod_chest.jpg", desc: "صناديق تخزين خشبية، أزرار كيبورد ثلاثية الأبعاد، وماوس بادات بكسلية احترافية." },
    { id: 4, name: "المصابيح المضيئة", slug: "lamps", count: 1, image: "assets/images/prod_lamp.jpg", desc: "مصابيح ليليّة مضيئة بكسلية بألوان RGB دافئة تعكس سحر ماين كرافت." },
    { id: 5, name: "الألعاب والقطع", slug: "toys", count: 1, image: "assets/images/prod_magnetic_cubes.jpg", desc: "مكعبات وقلاع مغناطيسية تفاعلية للبناء الواقعي والترفيه." }
];

// Seed Products Default Data (Canonical Products from data/products.json)
const baseProductsData = [
    {
        id: 1787145865780,
        name: "مجسم بطة بثيمة ماين كرتافت",
        category: "creatures",
        price: 7.58,
        priceIQD: 10000,
        originalPrice: null,
        originalPriceIQD: null,
        discountPercent: 0,
        stock: 2,
        status: "published",
        isPopular: true,
        rating: 5,
        image: "assets/images/مجسم_بطة_بثيمة_ماين_كرتافت_1.jpg",
        images: [
            "assets/images/مجسم_بطة_بثيمة_ماين_كرتافت_1.jpg",
            "assets/images/مجسم_بطة_بثيمة_ماين_كرتافت_2.jpg"
        ],
        description: "",
        hasColors: true,
        colors: [],
        hasSizes: true,
        sizes: []
    },
    {
        id: 1787143700528,
        name: "كرة الصورة المضيئة",
        category: "decor",
        price: 11.36,
        priceIQD: 15000,
        originalPrice: null,
        originalPriceIQD: null,
        discountPercent: 0,
        stock: 2,
        status: "published",
        isPopular: true,
        rating: 5,
        image: "assets/images/كرة_الصورة_المضيئة_1.jpg",
        images: [
            "assets/images/كرة_الصورة_المضيئة_1.jpg",
            "assets/images/كرة_الصورة_المضيئة_2.jpg"
        ],
        description: "",
        hasColors: true,
        colors: [],
        hasSizes: true,
        sizes: []
    },
    {
        id: 1787134750367,
        name: "مجسم غاست (Ghast)",
        category: "creatures",
        price: 6.06,
        priceIQD: 8000,
        originalPrice: null,
        originalPriceIQD: null,
        discountPercent: 0,
        stock: 2,
        status: "published",
        isPopular: true,
        rating: 5,
        image: "assets/images/مجسم_غاست_(Ghast)_1.jpg",
        images: [
            "assets/images/مجسم_غاست_(Ghast)_1.jpg",
            "assets/images/مجسم_غاست_(Ghast)_2.jpg"
        ],
        description: "مجسم غاست (Ghast)\nالارتفاع 96 سم\nاللون ابيض \nتم طباعتهه باجود انواع مواد الطباعه ثلاثية الابعاد",
        hasColors: true,
        colors: [],
        hasSizes: true,
        sizes: []
    },
    {
        id: 1787126317135,
        name: "مداليا كريبر",
        category: "creatures",
        price: 1.89,
        priceIQD: 2500,
        originalPrice: null,
        originalPriceIQD: null,
        discountPercent: 0,
        stock: 5,
        status: "published",
        isPopular: true,
        rating: 5,
        image: "assets/images/مداليا_كريبر_1.jpg",
        images: [
            "assets/images/مداليا_كريبر_1.jpg",
            "assets/images/مداليا_كريبر_2.jpg"
        ],
        description: "مجسم كريبر بقياس 6 سم \nحلقة معدنية لتعليق المجسم في اي مكان \nالمجسم مطبوع باجود انواع مواد الطباعة",
        hasColors: true,
        colors: [],
        hasSizes: true,
        sizes: [
            { name: "صغير (10 سم)", priceIQD: 2500, priceUSD: 1.89 },
            { name: "متوسط (18 سم)", priceIQD: 4500, priceUSD: 3.41 },
            { name: "كبير (26 سم)", priceIQD: 7000, priceUSD: 5.3 }
        ]
    }
];

// Seed Hero Banners Default Data
const defaultBanners = [
    {
        id: 1,
        title: "PREMIUM MINECRAFT",
        highlightText: "GEAR",
        badgeText: "مستلزمات وسيت اب الجيمرز في العراق",
        badgeIcon: "fa-solid fa-desktop",
        badgeColor: "green",
        desc: "صمّم عالمك المكعبي - استكشف مجموعتنا الحصرية من مستلزمات السيت اب المضيئة والماوس بادات البكسلية الاحترافية.",
        btnText: "SHOP NOW",
        btnLink: "shop.html",
        btnIcon: "fa-solid fa-arrow-left",
        image: "assets/images/hero_bg.jpg",
        status: "active",
        duration: 8000
    },
    {
        id: 2,
        title: "SUMMER SALE -",
        highlightText: "20% OFF",
        badgeText: "عروض الصيف الحصرية 🔥",
        badgeIcon: "fa-solid fa-sun",
        badgeColor: "red",
        desc: "احصل على خصم 20% بمناسبة العطلة الصيفية على جميع طلبات المجسمات والطباعة ثلاثية الأبعاد 3D مع توصيل لكافة محافظات العراق!",
        btnText: "CLAIM 20% DISCOUNT",
        btnLink: "shop.html",
        btnIcon: "fa-solid fa-percent",
        image: "assets/images/hero_bg_3d.jpg",
        status: "active",
        duration: 8000
    },
    {
        id: 3,
        title: "MINECRAFT FANS",
        highlightText: "MEETUP 2026",
        badgeText: "التجمع السنوي لمكتشفي المكعبات",
        badgeIcon: "fa-solid fa-ticket",
        badgeColor: "blue",
        desc: "احجز تذكرتك لحضور أكبر تجمع لمحبي البناء والـ 3D، عروض مسرحية حية ومسابقات مجسمات خرافية!",
        btnText: "BOOK MEETUP TICKETS",
        btnLink: "categories.html",
        btnIcon: "fa-solid fa-ticket",
        image: "assets/images/hero_bg_meetup.jpg",
        status: "active",
        duration: 8000
    }
];

// Seed Discount Coupons Default Data
const defaultCoupons = [
    { id: 1, code: "SUMMER20", discount: 20, uses: 148, status: "active", desc: "خصم 20% فوري على كافة المقتنيات" },
    { id: 2, code: "MEETUP10", discount: 10, uses: 64, status: "active", desc: "خصم 10% على تذاكر التجمع والفعاليات" }
];

// ==========================================================================
// Currency Engine: IQD (الدينار العراقي) & USD ($)
// ==========================================================================

function getSelectedCurrency() {
    return localStorage.getItem('mine_mart_currency') || 'IQD'; // Default is Iraqi Dinar (IQD)
}

function setSelectedCurrency(currency) {
    const valid = (currency === 'USD') ? 'USD' : 'IQD';
    localStorage.setItem('mine_mart_currency', valid);
    
    const user = getCurrentUser();
    if (user) {
        user.currency = valid;
        setCurrentUser(user);
    }
    
    updateCurrencyUI();
    updateAllPricesOnPage();
}

function toggleCurrencyQuick() {
    const current = getSelectedCurrency();
    setSelectedCurrency(current === 'IQD' ? 'USD' : 'IQD');
}

function formatCurrency(amountUSD) {
    const currency = getSelectedCurrency();
    const val = Number(amountUSD) || 0;
    if (currency === 'USD') {
        return `$${Math.round(val)}`;
    } else {
        // Iraqi Dinar conversion with rounded thousand steps
        const iqdVal = Math.round((val * EXCHANGE_RATE_USD_TO_IQD) / 250) * 250;
        return `${iqdVal.toLocaleString('en-US')} د.ع`;
    }
}

function getConvertedAmount(amountUSD) {
    const currency = getSelectedCurrency();
    const val = Number(amountUSD) || 0;
    if (currency === 'USD') {
        return Math.round(val);
    } else {
        return Math.round((val * EXCHANGE_RATE_USD_TO_IQD) / 250) * 250;
    }
}

// SVG Vector Flags for Cross-Platform Crisp Display
const FLAG_IRAQ_SVG = `<span class="currency-flag-svg" title="العراق (IQD)"><svg viewBox="0 0 640 480"><path fill="#f00" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#000" d="M0 320h640v160H0z"/><text x="320" y="272" font-size="70" font-weight="900" fill="#007a3d" text-anchor="middle" font-family="sans-serif">الله أكبر</text></svg></span>`;
const FLAG_USA_SVG = `<span class="currency-flag-svg" title="USA (USD)"><svg viewBox="0 0 640 480"><path fill="#bd3d44" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="37" d="M0 55h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"/><path fill="#192f5d" d="M0 0h260v260H0z"/><g fill="#fff"><circle cx="40" cy="40" r="10"/><circle cx="100" cy="40" r="10"/><circle cx="160" cy="40" r="10"/><circle cx="220" cy="40" r="10"/><circle cx="70" cy="80" r="10"/><circle cx="130" cy="80" r="10"/><circle cx="190" cy="80" r="10"/><circle cx="40" cy="120" r="10"/><circle cx="100" cy="120" r="10"/><circle cx="160" cy="120" r="10"/><circle cx="220" cy="120" r="10"/><circle cx="70" cy="160" r="10"/><circle cx="130" cy="160" r="10"/><circle cx="190" cy="160" r="10"/><circle cx="40" cy="200" r="10"/><circle cx="100" cy="200" r="10"/><circle cx="160" cy="200" r="10"/><circle cx="220" cy="200" r="10"/></g></svg></span>`;

function updateCurrencyUI() {
    const curr = getSelectedCurrency();
    const flagEl = document.getElementById('currentCurrencyFlag');
    const labelEl = document.getElementById('currentCurrencyLabel');
    const dropdownSelect = document.getElementById('dropdownCurrencySelect');
    const loginSelect = document.getElementById('loginCurrencySelect');
    const regSelect = document.getElementById('regCurrencySelect');

    if (flagEl) {
        flagEl.innerHTML = (curr === 'USD') ? FLAG_USA_SVG : FLAG_IRAQ_SVG;
    }
    if (labelEl) {
        labelEl.innerHTML = (curr === 'USD') ? 
            `<span class="currency-label-text"><span class="curr-code">USD</span> <span class="curr-sym">($)</span></span>` : 
            `<span class="currency-label-text"><span class="curr-code">IQD</span> <span class="curr-sym">(د.ع)</span></span>`;
    }
    if (dropdownSelect) dropdownSelect.value = curr;
    if (loginSelect) loginSelect.value = curr;
    if (regSelect) regSelect.value = curr;
}

function updateAllPricesOnPage() {
    if (document.getElementById('popularProductsGrid')) {
        renderHomepageRows();
    }
    if (document.getElementById('productGrid')) {
        renderShopGrid();
    }
    if (document.getElementById('pdpPriceBox') && currentPdpProduct) {
        initProductDetailPage(currentPdpProduct.id);
    }
    updateCartUI();
    renderCheckoutSummary();
}

function getLiveProducts() {
    if (typeof window !== 'undefined' && window.MINE_MART_STORE_DATA && Array.isArray(window.MINE_MART_STORE_DATA.products) && window.MINE_MART_STORE_DATA.products.length > 0) {
        const sourceData = window.MINE_MART_STORE_DATA.products;
        try {
            localStorage.setItem('mine_mart_products', JSON.stringify(sourceData));
            idbSet('mine_mart_products', sourceData);
        } catch(e) {}
        return JSON.parse(JSON.stringify(sourceData));
    }

    const saved = localStorage.getItem('mine_mart_products');
    if (saved) {
        try {
            let parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            console.error('Error parsing stored products:', e);
        }
    }

    return JSON.parse(JSON.stringify(baseProductsData));
}

function getLiveCategories() {
    if (typeof window !== 'undefined' && window.MINE_MART_STORE_DATA && Array.isArray(window.MINE_MART_STORE_DATA.categories) && window.MINE_MART_STORE_DATA.categories.length > 0) {
        const sourceData = window.MINE_MART_STORE_DATA.categories;
        try {
            localStorage.setItem('mine_mart_categories', JSON.stringify(sourceData));
            idbSet('mine_mart_categories', sourceData);
        } catch(e) {}
        return JSON.parse(JSON.stringify(sourceData));
    }

    const saved = localStorage.getItem('mine_mart_categories');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            console.error('Error parsing stored categories:', e);
        }
    }
    
    return JSON.parse(JSON.stringify(defaultCategories));
}

function getLiveBanners() {
    if (typeof window !== 'undefined' && window.MINE_MART_STORE_DATA && Array.isArray(window.MINE_MART_STORE_DATA.banners) && window.MINE_MART_STORE_DATA.banners.length > 0) {
        const sourceData = window.MINE_MART_STORE_DATA.banners;
        try {
            localStorage.setItem('mine_mart_banners', JSON.stringify(sourceData));
            idbSet('mine_mart_banners', sourceData);
        } catch(e) {}
        return JSON.parse(JSON.stringify(sourceData));
    }

    const saved = localStorage.getItem('mine_mart_banners');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
    }

    return JSON.parse(JSON.stringify(defaultBanners));
}

function getLiveCoupons() {
    if (typeof window !== 'undefined' && window.MINE_MART_STORE_DATA && Array.isArray(window.MINE_MART_STORE_DATA.coupons) && window.MINE_MART_STORE_DATA.coupons.length > 0) {
        const sourceData = window.MINE_MART_STORE_DATA.coupons;
        try {
            localStorage.setItem('mine_mart_coupons', JSON.stringify(sourceData));
            idbSet('mine_mart_coupons', sourceData);
        } catch(e) {}
        return JSON.parse(JSON.stringify(sourceData));
    }

    const saved = localStorage.getItem('mine_mart_coupons');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
    }

    return JSON.parse(JSON.stringify(defaultCoupons));
}

// Global Products Data Reference
let productsData = getLiveProducts();

// Global State
let cart = JSON.parse(localStorage.getItem('minemart_cart')) || [];
let userHistory = JSON.parse(localStorage.getItem('minemart_user_history')) || { searches: [], categories: [], viewedIds: [] };
let activeCategory = 'all';
let currentSlide = 0;
let slideInterval = null;
let currentSort = 'default';
let modalSelectedQty = 1;
let pdpSelectedQty = 1;
let currentPdpProduct = null;

// Authentication & Checkout State
let pendingCheckoutAction = false;
let appliedCheckoutDiscountPercent = 0;

function renderShopCategoriesSidebar() {
    const listContainer = document.getElementById('shopCategoryList');
    if (!listContainer) return;

    const categories = getLiveCategories();
    const liveProds = getLiveProducts().filter(p => p.status !== 'draft');

    const totalCount = liveProds.length;
    const isAllActive = (activeCategory === 'all' || !activeCategory);

    let html = `
        <li>
            <button class="category-item-btn ${isAllActive ? 'active' : ''}" data-cat="all" onclick="selectShopCategoryFilter('all')">
                <span><i class="fa-solid fa-border-all" style="margin-left:0.5rem; color:var(--neon-green);"></i> كل المنتجات</span>
                <span class="cat-count-badge">${totalCount}</span>
            </button>
        </li>
    `;

    categories.forEach(cat => {
        const count = liveProds.filter(p => p.category === cat.slug).length;
        const isActive = (activeCategory === cat.slug);
        
        let icon = 'fa-solid fa-cube';
        if (cat.slug === 'decor') icon = 'fa-solid fa-lightbulb';
        else if (cat.slug === 'accessories') icon = 'fa-solid fa-gamepad';
        else if (cat.slug === 'lamps') icon = 'fa-solid fa-sun';
        else if (cat.slug === 'toys') icon = 'fa-solid fa-dice-d20';

        html += `
            <li>
                <button class="category-item-btn ${isActive ? 'active' : ''}" data-cat="${cat.slug}" onclick="selectShopCategoryFilter('${cat.slug}')">
                    <span><i class="${icon}" style="margin-left:0.5rem; color:var(--neon-green);"></i> ${cat.name}</span>
                    <span class="cat-count-badge">${count}</span>
                </button>
            </li>
        `;
    });

    listContainer.innerHTML = html;
}

function selectShopCategoryFilter(catSlug) {
    activeCategory = catSlug;
    recordUserInterestCategory(catSlug);

    // Update active state in sidebar
    document.querySelectorAll('#shopCategoryList .category-item-btn').forEach(btn => {
        if (btn.getAttribute('data-cat') === catSlug) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (document.getElementById('productGrid')) {
        renderShopGrid();
    } else if (document.getElementById('popularProductsGrid')) {
        renderHomepageRows();
    }
}

async function initAsyncStorefrontSync() {
    try {
        let syncedFromServer = false;
        try {
            const res = await fetch(`${API_BASE}/sync`);
            if (res.ok) {
                const json = await res.json();
                if (json.data && Array.isArray(json.data.products) && json.data.products.length > 0) {
                    productsData = json.data.products;
                    try { localStorage.setItem('mine_mart_products', JSON.stringify(productsData)); } catch(e) {}
                    if (Array.isArray(json.data.categories) && json.data.categories.length > 0) {
                        try { localStorage.setItem('mine_mart_categories', JSON.stringify(json.data.categories)); } catch(e) {}
                    }
                    if (Array.isArray(json.data.banners) && json.data.banners.length > 0) {
                        try { localStorage.setItem('mine_mart_banners', JSON.stringify(json.data.banners)); } catch(e) {}
                    }
                    if (Array.isArray(json.data.coupons) && json.data.coupons.length > 0) {
                        try { localStorage.setItem('mine_mart_coupons', JSON.stringify(json.data.coupons)); } catch(e) {}
                    }
                    syncedFromServer = true;
                }
            }
        } catch(e) {
            // Fallback to window.MINE_MART_STORE_DATA from data-store.js
            if (typeof window !== 'undefined' && window.MINE_MART_STORE_DATA) {
                if (Array.isArray(window.MINE_MART_STORE_DATA.products) && window.MINE_MART_STORE_DATA.products.length > 0) {
                    productsData = window.MINE_MART_STORE_DATA.products;
                    try { localStorage.setItem('mine_mart_products', JSON.stringify(productsData)); } catch(e) {}
                    syncedFromServer = true;
                }
                if (Array.isArray(window.MINE_MART_STORE_DATA.categories) && window.MINE_MART_STORE_DATA.categories.length > 0) {
                    try { localStorage.setItem('mine_mart_categories', JSON.stringify(window.MINE_MART_STORE_DATA.categories)); } catch(e) {}
                }
            }
        }

        if (syncedFromServer) {
            refreshStorefrontUI();
        } else {
            // Fallback to IndexedDB if offline and localStorage empty
            let needsRefresh = false;
            if (!localStorage.getItem('mine_mart_products')) {
                const idbProds = await idbGet('mine_mart_products');
                if (Array.isArray(idbProds) && idbProds.length > 0) {
                    productsData = idbProds;
                    try { localStorage.setItem('mine_mart_products', JSON.stringify(productsData)); } catch(e) {}
                    needsRefresh = true;
                }
            }
            if (!localStorage.getItem('mine_mart_categories')) {
                const idbCats = await idbGet('mine_mart_categories');
                if (Array.isArray(idbCats) && idbCats.length > 0) {
                    try { localStorage.setItem('mine_mart_categories', JSON.stringify(idbCats)); } catch(e) {}
                    needsRefresh = true;
                }
            }
            if (needsRefresh) {
                refreshStorefrontUI();
            }
        }
    } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
    productsData = getLiveProducts();

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    const idParam = urlParams.get('id');
    const searchParam = urlParams.get('search');

    if (catParam) {
        activeCategory = catParam;
        recordUserInterestCategory(catParam);
    }

    if (searchParam) {
        const searchInputEl = document.getElementById('searchInput');
        if (searchInputEl) searchInputEl.value = decodeURIComponent(searchParam);
        recordUserSearch(searchParam);
    }

    // Dynamic Shop Sidebar Categories
    if (document.getElementById('shopCategoryList')) {
        renderShopCategoriesSidebar();
    }

    // Dynamic Categories Page Grid
    if (document.getElementById('categoriesGridContainer')) {
        renderCategoriesPageGrid();
    }

    // Check if on PDP Page (product-detail.html)
    if (document.getElementById('pdpMainImg')) {
        const prodId = idParam ? idParam : (productsData[0] ? productsData[0].id : 1);
        initProductDetailPage(prodId);
    } else if (document.getElementById('popularProductsGrid')) {
        renderHomepageRows();
    } else if (document.getElementById('productGrid')) {
        renderShopGrid();
    }

    updateCartUI();
    initHeroSlider();
    updateUserHeaderUI();
    updateCurrencyUI();
    initLiveSearchSuggestions();
    initAsyncStorefrontSync();

    // Side Categories Click Listeners
    document.querySelectorAll('.category-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-item-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.getAttribute('data-cat');
            
            recordUserInterestCategory(activeCategory);

            if (document.getElementById('productGrid')) {
                renderShopGrid();
            } else if (document.getElementById('popularProductsGrid')) {
                renderHomepageRows();
            }
        });
    });

    // Sort Select listener (Shop Page)
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderShopGrid();
        });
    }

    // Live Search listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                recordUserSearch(query);
            }
            if (document.getElementById('productGrid')) {
                renderShopGrid();
            }
        });
    }

    // Mobile Side Nav Drawer Controls
    const mobileNavBtn = document.getElementById('mobileNavBtn');
    if (mobileNavBtn) mobileNavBtn.addEventListener('click', toggleMobileNavDrawer);
    const closeMobileNavBtn = document.getElementById('closeMobileNavBtn');
    if (closeMobileNavBtn) closeMobileNavBtn.addEventListener('click', toggleMobileNavDrawer);
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', toggleMobileNavDrawer);

    // Cart Drawer Controls
    const cartTrigger = document.getElementById('cartTrigger');
    if (cartTrigger) cartTrigger.addEventListener('click', toggleCartDrawer);
    const closeCartBtn = document.getElementById('closeCartBtn');
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCartDrawer);
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCartDrawer);

    // Support Drawer & AI Bot Controls
    document.querySelectorAll('.support-trigger').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSupportDrawer();
        });
    });

    const botTriggerBtn = document.getElementById('botTriggerBtn');
    if (botTriggerBtn) botTriggerBtn.addEventListener('click', toggleSupportDrawer);
    const closeSupportBtn = document.getElementById('closeSupportBtn');
    if (closeSupportBtn) closeSupportBtn.addEventListener('click', toggleSupportDrawer);
    const supportOverlay = document.getElementById('supportOverlay');
    if (supportOverlay) supportOverlay.addEventListener('click', toggleSupportDrawer);

    const supportBotSendBtn = document.getElementById('supportBotSendBtn');
    if (supportBotSendBtn) supportBotSendBtn.addEventListener('click', handleUserSupportBotMsg);
    const supportBotInput = document.getElementById('supportBotInput');
    if (supportBotInput) {
        supportBotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserSupportBotMsg();
        });
    }

    const botSendBtn = document.getElementById('botSendBtn');
    if (botSendBtn) botSendBtn.addEventListener('click', handleUserSupportBotMsg);
    const botInput = document.getElementById('botInput');
    if (botInput) {
        botInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserSupportBotMsg();
        });
    }

    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            sendSupportBotUserMsg(chip.getAttribute('data-msg'));
        });
    });

    // Close Dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const userMenu = document.querySelector('.user-menu-container');
        const dropdown = document.getElementById('userProfileDropdown');
        if (dropdown && userMenu && !userMenu.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});

// ==========================================================================
// Customer Authentication System (Login / Register / Profile Management)
// ==========================================================================

function getCurrentUser() {
    const saved = localStorage.getItem('mine_mart_current_user');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {}
    }
    return null;
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('mine_mart_current_user', JSON.stringify(user));
        if (user.currency) {
            localStorage.setItem('mine_mart_currency', user.currency);
        }
    } else {
        localStorage.removeItem('mine_mart_current_user');
    }
    updateUserHeaderUI();
    updateCurrencyUI();
}

function getRegisteredUsers() {
    const defaultList = [
        { name: "علي الكرخي", email: "user@minemart.shop", password: "password123", phone: "07701234567", currency: "IQD", role: "customer" },
        { name: "مدير النظام", email: "admin@minemart.shop", password: "admin123456password", phone: "07700000000", currency: "IQD", role: "admin" }
    ];
    const saved = localStorage.getItem('mine_mart_registered_users');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
    }
    localStorage.setItem('mine_mart_registered_users', JSON.stringify(defaultList));
    return defaultList;
}

function saveRegisteredUsers(users) {
    localStorage.setItem('mine_mart_registered_users', JSON.stringify(users));
}

function updateUserHeaderUI() {
    const user = getCurrentUser();
    const userTrigger = document.getElementById('userAuthTrigger');
    const dropdown = document.getElementById('userProfileDropdown');
    const dropdownName = document.getElementById('dropdownUserName');
    const dropdownEmail = document.getElementById('dropdownUserEmail');
    const dropdownAdminLink = document.getElementById('dropdownAdminLink');
    const dropdownCurrencySelect = document.getElementById('dropdownCurrencySelect');

    if (dropdownCurrencySelect) {
        dropdownCurrencySelect.value = getSelectedCurrency();
    }

    if (!userTrigger) return;

    if (user) {
        const displayName = user.name ? user.name.split(' ')[0] : 'حسابي';
        userTrigger.innerHTML = `<i class="fa-solid fa-circle-user" style="color:var(--neon-green);"></i> <span>${displayName}</span>`;
        userTrigger.classList.add('user-profile-btn-active');
        userTrigger.title = `مرحباً، ${user.name}`;

        if (dropdownName) dropdownName.innerText = user.name || 'عميل ماين مارت';
        if (dropdownEmail) dropdownEmail.innerText = user.email || '';
        if (dropdownAdminLink) {
            dropdownAdminLink.style.display = (user.role === 'admin' || user.email === 'admin@minemart.shop') ? 'flex' : 'none';
        }
    } else {
        userTrigger.innerHTML = `<i class="fa-regular fa-user"></i>`;
        userTrigger.classList.remove('user-profile-btn-active');
        userTrigger.title = 'تسجيل الدخول / إنشاء حساب';
        if (dropdown) dropdown.classList.remove('show');
    }
}

function handleUserHeaderClick() {
    const user = getCurrentUser();
    const dropdown = document.getElementById('userProfileDropdown');

    if (user) {
        if (dropdown) dropdown.classList.toggle('show');
    } else {
        openCustomerAuthModal();
    }
}

function openCustomerAuthModal(noticeText = '') {
    const modal = document.getElementById('customerAuthModal');
    const banner = document.getElementById('authNoticeBanner');
    
    if (banner) {
        if (noticeText) {
            banner.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${noticeText}`;
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
    }

    updateCurrencyUI();

    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeCustomerAuthModal() {
    const modal = document.getElementById('customerAuthModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function switchAuthTab(tab) {
    const tabLogin = document.getElementById('tabBtnLogin');
    const tabRegister = document.getElementById('tabBtnRegister');
    const panelLogin = document.getElementById('loginFormPanel');
    const panelRegister = document.getElementById('registerFormPanel');

    if (tab === 'login') {
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegister) tabRegister.classList.remove('active');
        if (panelLogin) panelLogin.classList.add('active');
        if (panelRegister) panelRegister.classList.remove('active');
    } else {
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegister) tabRegister.classList.add('active');
        if (panelLogin) panelLogin.classList.remove('active');
        if (panelRegister) panelRegister.classList.add('active');
    }
}

async function handleCustomerLoginSubmit(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('loginEmailInput').value.trim();
    const password = document.getElementById('loginPasswordInput').value.trim();
    const currencySelect = document.getElementById('loginCurrencySelect');
    const chosenCurrency = currencySelect ? currencySelect.value : getSelectedCurrency();

    let authenticatedUser = null;

    // 1. Try Backend Auth API
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            authenticatedUser = data.data.user;
        }
    } catch (e) {}

    // 2. Fallback Local Storage User Verification
    if (!authenticatedUser) {
        const users = getRegisteredUsers();
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (found) {
            authenticatedUser = { name: found.name, email: found.email, phone: found.phone || '', currency: chosenCurrency, role: found.role || 'customer' };
        } else if (password.length >= 6) {
            const guessedName = email.split('@')[0];
            authenticatedUser = { name: guessedName, email: email, currency: chosenCurrency, role: 'customer' };
        }
    }

    if (authenticatedUser) {
        authenticatedUser.currency = chosenCurrency;
        setSelectedCurrency(chosenCurrency);
        setCurrentUser(authenticatedUser);
        closeCustomerAuthModal();
        alert(`🎉 أهلاً وسهلاً بك مجدداً، ${authenticatedUser.name}! (العملة المحددة: ${chosenCurrency === 'USD' ? 'الدولار الأمريكي $' : 'الدينار العراقي د.ع'})`);

        // If user was prompted to login during checkout, proceed directly to checkout!
        if (pendingCheckoutAction) {
            pendingCheckoutAction = false;
            openCheckoutModal();
        }
    } else {
        alert("⚠️ يرجى التأكد من صحة البريد الإلكتروني وكلمة المرور.");
    }
}

async function handleCustomerRegisterSubmit(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('regNameInput').value.trim();
    const email = document.getElementById('regEmailInput').value.trim();
    const phone = document.getElementById('regPhoneInput') ? document.getElementById('regPhoneInput').value.trim() : '';
    const password = document.getElementById('regPasswordInput').value.trim();
    const currencySelect = document.getElementById('regCurrencySelect');
    const chosenCurrency = currencySelect ? currencySelect.value : getSelectedCurrency();

    if (password.length < 6) {
        alert("كلمة المرور يجب ألا تقل عن 6 أحرف.");
        return;
    }

    let newUser = { name, email, phone, currency: chosenCurrency, role: 'customer' };

    // 1. Try Backend Register API
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            newUser = { ...data.data.user, currency: chosenCurrency };
        }
    } catch (e) {}

    // 2. Save in Registered Users Local Storage
    const users = getRegisteredUsers();
    const existingIdx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingIdx !== -1) {
        users[existingIdx] = { ...users[existingIdx], name, phone, password, currency: chosenCurrency };
    } else {
        users.push({ name, email, phone, password, currency: chosenCurrency, role: 'customer' });
    }
    saveRegisteredUsers(users);

    setSelectedCurrency(chosenCurrency);
    setCurrentUser(newUser);
    closeCustomerAuthModal();
    alert(`🎉 تم إنشاء حسابك بنجاح! أهلاً بك في متجر ماين مارت، ${newUser.name}! (العملة المحددة: ${chosenCurrency === 'USD' ? 'الدولار الأمريكي $' : 'الدينار العراقي د.ع'})`);

    // If user clicked checkout and needed registration, proceed to checkout immediately
    if (pendingCheckoutAction) {
        pendingCheckoutAction = false;
        openCheckoutModal();
    }
}

function handleCustomerLogout() {
    if (confirm("هل ترغب في تسجيل الخروج من حسابك؟")) {
        setCurrentUser(null);
        try {
            fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (e) {}
        alert("تم تسجيل الخروج بنجاح.");
    }
}

// ==========================================================================
// Interactive Checkout Gateway (Iraqi Governorates & Payment Methods)
// ==========================================================================

function proceedToCheckout() {
    if (cart.length === 0) {
        alert("سلة التسوق فارغة! يرجى إضافة منتجات إلى سلتك أولاً.");
        return;
    }

    const user = getCurrentUser();

    // If customer is NOT logged in: Prompt them with Auth Modal before checking out
    if (!user) {
        pendingCheckoutAction = true;
        toggleCartDrawer(); // close cart drawer
        openCustomerAuthModal("يرجى تسجيل الدخول أو إنشاء حسابك لإتمام عملية الشراء وحفظ عنوان الشحن في العراق ومتابعة حالة طلبك!");
        return;
    }

    // Customer is logged in -> Open Checkout Modal directly!
    toggleCartDrawer();
    openCheckoutModal();
}

function openCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    const user = getCurrentUser() || {};
    
    // Prefill form
    const nameInput = document.getElementById('coName');
    const phoneInput = document.getElementById('coPhone');
    if (nameInput && user.name) nameInput.value = user.name;
    if (phoneInput && user.phone) phoneInput.value = user.phone;

    renderCheckoutSummary();

    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function renderCheckoutSummary() {
    const itemsContainer = document.getElementById('checkoutItemsList');
    const subtotalEl = document.getElementById('coSubtotal');
    const discountRow = document.getElementById('coDiscountRow');
    const discountValEl = document.getElementById('coDiscountVal');
    const grandTotalEl = document.getElementById('coGrandTotal');

    const subtotalUSD = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountUSD = appliedCheckoutDiscountPercent > 0 ? (subtotalUSD * (appliedCheckoutDiscountPercent / 100)) : 0;
    const grandTotalUSD = Math.max(0, subtotalUSD - discountUSD);

    if (itemsContainer) {
        itemsContainer.innerHTML = cart.map(item => `
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.85rem; padding:0.4rem 0; border-bottom:1px solid rgba(118,230,17,0.1);">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <img src="${item.image}" style="width:32px; height:32px; border-radius:4px; object-fit:cover;">
                    <span><strong>${item.name}</strong> × ${item.qty}</span>
                </div>
                <span style="color:var(--neon-green); font-weight:800;">${formatCurrency(item.price * item.qty)}</span>
            </div>
        `).join('');
    }

    if (subtotalEl) subtotalEl.innerText = formatCurrency(subtotalUSD);

    if (appliedCheckoutDiscountPercent > 0) {
        if (discountRow) discountRow.style.display = 'flex';
        if (discountValEl) discountValEl.innerText = `-${formatCurrency(discountUSD)} (${appliedCheckoutDiscountPercent}%)`;
    } else {
        if (discountRow) discountRow.style.display = 'none';
    }

    if (grandTotalEl) grandTotalEl.innerText = formatCurrency(grandTotalUSD);
}

function applyCheckoutCoupon() {
    const input = document.getElementById('checkoutCouponInput');
    const msg = document.getElementById('couponAppliedMsg');
    if (!input) return;
    const code = input.value.trim().toUpperCase();

    if (!code) {
        alert("يرجى كتابة رمز الكوبون أولاً.");
        return;
    }

    const coupons = getLiveCoupons();
    const found = coupons.find(c => c.code.toUpperCase() === code && c.status === 'active');

    if (found) {
        appliedCheckoutDiscountPercent = found.discount;
        if (msg) {
            msg.innerHTML = `<span style="color:var(--neon-green); font-weight:700;"><i class="fa-solid fa-circle-check"></i> تم تطبيق كوبون ${found.code} وخصم ${found.discount}%!</span>`;
            msg.style.display = 'block';
        }
        renderCheckoutSummary();
    } else {
        alert("⚠️ عذراً، هذا الكوبون غير صالح أو منتهي الصلاحية.");
    }
}

function selectPaymentMethod(type, cardEl) {
    document.querySelectorAll('.payment-option-card').forEach(c => c.classList.remove('selected'));
    if (cardEl) {
        cardEl.classList.add('selected');
        const radio = cardEl.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
    }
}

function handleFinalOrderSubmit(event) {
    if (event) event.preventDefault();
    if (cart.length === 0) {
        alert("السلة فارغة.");
        return;
    }

    const user = getCurrentUser() || {};
    const name = document.getElementById('coName').value.trim();
    const phone = document.getElementById('coPhone').value.trim();
    const city = document.getElementById('coCity').value;
    const address = document.getElementById('coAddress').value.trim();
    const fullAddress = `العراق - ${city} - ${address}`;

    const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentRadio ? paymentRadio.value : 'الدفع عند الاستلام';

    const subtotalUSD = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountUSD = appliedCheckoutDiscountPercent > 0 ? (subtotalUSD * (appliedCheckoutDiscountPercent / 100)) : 0;
    const grandTotalUSD = Math.max(0, subtotalUSD - discountUSD);
    const formattedGrandTotal = formatCurrency(grandTotalUSD);

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];

    const orderRecord = {
        id: orderId,
        date: today,
        name: name,
        email: user.email || 'customer@minemart.shop',
        phone: phone,
        country: "العراق",
        province: city,
        address: fullAddress,
        currency: getSelectedCurrency(),
        totalUSD: grandTotalUSD,
        total: formattedGrandTotal,
        items: [...cart],
        payment: paymentMethod,
        status: "pending"
    };

    // 1. Save to User Orders History
    let userOrders = JSON.parse(localStorage.getItem('minemart_user_orders')) || [];
    userOrders.unshift(orderRecord);
    localStorage.setItem('minemart_user_orders', JSON.stringify(userOrders));

    // 2. Sync with Admin Orders in localStorage & Server Disk File (data/orders.json)
    let adminOrders = JSON.parse(localStorage.getItem('mine_mart_orders')) || [];
    adminOrders.unshift(orderRecord);
    localStorage.setItem('mine_mart_orders', JSON.stringify(adminOrders));
    idbSet('mine_mart_orders', adminOrders);

    try {
        fetch('/api/v1/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderRecord)
        }).catch(() => {});
    } catch(e) {}

    if (minemartChannel) {
        try { minemartChannel.postMessage({ type: 'DATA_UPDATED' }); } catch(e) {}
    }

    // 3. Clear Cart & Reset
    cart = [];
    saveCart();
    updateCartUI();
    appliedCheckoutDiscountPercent = 0;
    closeCheckoutModal();

    // 4. Show Order Success Receipt Modal
    const orderNumEl = document.getElementById('successOrderNumber');
    if (orderNumEl) orderNumEl.innerText = `رقم الطلب: #${orderId}`;
    const nameEl = document.getElementById('receiptCustomerName');
    if (nameEl) nameEl.innerText = name;
    const addrEl = document.getElementById('receiptAddress');
    if (addrEl) addrEl.innerText = fullAddress;
    const payEl = document.getElementById('receiptPayment');
    if (payEl) payEl.innerText = paymentMethod;
    const totalEl = document.getElementById('receiptTotal');
    if (totalEl) totalEl.innerText = formattedGrandTotal;

    const successModal = document.getElementById('orderSuccessModal');
    if (successModal) {
        successModal.classList.add('active');
        successModal.style.display = 'flex';
    }
}

function closeSuccessModal() {
    const successModal = document.getElementById('orderSuccessModal');
    if (successModal) {
        successModal.classList.remove('active');
        successModal.style.display = 'none';
    }
}

function openMyOrdersModal() {
    const modal = document.getElementById('myOrdersModal');
    const container = document.getElementById('myOrdersListContainer');
    const userOrders = JSON.parse(localStorage.getItem('minemart_user_orders')) || [];

    if (container) {
        if (userOrders.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:2.5rem 1rem; color:var(--text-muted);">
                    <i class="fa-solid fa-box-open" style="font-size:2.5rem; color:var(--neon-green); margin-bottom:0.75rem; opacity:0.6;"></i>
                    <p>لا توجد طلبات سابقة مسجلة حتى الآن.</p>
                </div>
            `;
        } else {
            container.innerHTML = userOrders.map(o => `
                <div style="background:#090e0b; border:1px solid var(--border-green); border-radius:8px; padding:1rem; margin-bottom:0.85rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; border-bottom:1px solid rgba(118,230,17,0.15); padding-bottom:0.4rem;">
                        <strong>#${o.id}</strong>
                        <span style="font-size:0.8rem; color:var(--neon-green); font-weight:700;">قيد التجهيز والتوصيل 🚚</span>
                    </div>
                    <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.6;">
                        <div><i class="fa-regular fa-calendar"></i> التاريخ: ${o.date}</div>
                        <div><i class="fa-solid fa-location-dot"></i> العنوان: ${o.address}</div>
                        <div><i class="fa-solid fa-credit-card"></i> طريقة الدفع: ${o.payment}</div>
                        <div style="color:var(--neon-green); font-weight:800; margin-top:0.25rem;">الإجمالي: ${o.total}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    const dropdown = document.getElementById('userProfileDropdown');
    if (dropdown) dropdown.classList.remove('show');

    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeMyOrdersModal() {
    const modal = document.getElementById('myOrdersModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

// Shop Categories Sidebar Dynamic Renderer
function renderShopCategoriesSidebar() {
    const listEl = document.getElementById('shopCategoryList');
    if (!listEl) return;
    const cats = getLiveCategories();
    const prods = getLiveProducts();
    const totalPublished = prods.filter(p => p.status !== 'draft').length;

    let html = `<li><button class="category-item-btn ${activeCategory === 'all' ? 'active' : ''}" data-cat="all"><span>جميع المنتجات (${totalPublished})</span> <i class="fa-solid fa-chevron-left"></i></button></li>`;

    cats.forEach(cat => {
        const isActive = activeCategory === cat.slug ? 'active' : '';
        html += `<li><button class="category-item-btn ${isActive}" data-cat="${cat.slug}"><span>${cat.name} (${cat.count || 0})</span> <i class="fa-solid fa-chevron-left"></i></button></li>`;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.category-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            listEl.querySelectorAll('.category-item-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.getAttribute('data-cat');
            recordUserInterestCategory(activeCategory);
            renderShopGrid();
        });
    });
}

// Categories Page Cards Dynamic Grid Renderer
function renderCategoriesPageGrid() {
    const container = document.getElementById('categoriesGridContainer');
    if (!container) return;

    const cats = getLiveCategories();
    const prods = getLiveProducts().filter(p => p.status !== 'draft');

    container.innerHTML = cats.map(cat => {
        const count = prods.filter(p => p.category === cat.slug).length;
        return `
            <div class="category-card-v1" onclick="window.location.href='shop.html?cat=${encodeURIComponent(cat.slug)}'" style="cursor:pointer;">
                <div class="category-card-img-frame">
                    <img src="${cat.image || 'assets/images/prod_fox.jpg'}" alt="${cat.name}" onerror="this.onerror=null; this.src='assets/images/prod_fox.jpg';">
                </div>
                <div class="category-card-body">
                    <h3 class="category-card-title">${cat.name}</h3>
                    <p class="category-card-desc">${cat.desc || ''}</p>
                    <div class="category-card-footer">
                        <span class="category-card-count"><i class="fa-solid fa-cube"></i> ${count} منتج متوفر</span>
                        <span class="category-card-link">استكشف القسم <i class="fa-solid fa-arrow-left"></i></span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function refreshStorefrontUI() {
    productsData = getLiveProducts();
    if (document.getElementById('productGrid')) {
        renderShopGrid();
    }
    if (document.getElementById('popularProductsGrid')) {
        renderHomepageRows();
    }
    if (document.getElementById('shopCategoryList')) {
        renderShopCategoriesSidebar();
    }
    if (document.getElementById('categoriesGridContainer')) {
        renderCategoriesPageGrid();
    }
    if (document.getElementById('heroSliderWrapper')) {
        initHeroSlider();
    }
    if (document.getElementById('pdpMainImg')) {
        const urlParams = new URLSearchParams(window.location.search);
        const idParam = urlParams.get('id');
        const prodId = idParam ? idParam : (productsData[0] ? productsData[0].id : 1);
        initProductDetailPage(prodId);
    }
    updateCartUI();
}

// Real-time synchronization across tabs (Admin Dashboard <-> Storefront)
window.addEventListener('storage', (e) => {
    if (e.key === 'mine_mart_products' || e.key === 'mine_mart_categories' || e.key === 'mine_mart_banners' || e.key === 'mine_mart_coupons') {
        refreshStorefrontUI();
    }
});

// BroadcastChannel for instant inter-tab and inter-window event dispatch
if (minemartChannel) {
    minemartChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'DATA_UPDATED') {
            refreshStorefrontUI();
        }
    };
}

if (typeof window !== 'undefined') {
    window.addEventListener('minemart:data_updated', () => {
        refreshStorefrontUI();
    });
}

// Navigation Helpers
function goToPage(url) {
    window.location.href = url;
}

// Support Curtain Drawer Toggle & Email Copy Logic
function toggleSupportDrawer() {
    const drawer = document.getElementById('supportDrawer') || document.getElementById('botDrawer');
    const overlay = document.getElementById('supportOverlay') || document.getElementById('botOverlay');
    if (drawer) drawer.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function copyStoreEmail() {
    const email = "support@minemart.shop";
    if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => {
            alert("📋 تم نسخ البريد الإلكتروني الرسمي للمتجر:\nsupport@minemart.shop");
        }).catch(() => {
            alert("البريد الإلكتروني الرسمي للمتجر: support@minemart.shop");
        });
    } else {
        alert("البريد الإلكتروني الرسمي للمتجر: support@minemart.shop");
    }
}

function handleUserSupportBotMsg() {
    const input = document.getElementById('supportBotInput') || document.getElementById('botInput');
    if (!input) return;
    const text = input.value.trim();
    if (text !== '') {
        sendSupportBotUserMsg(text);
        input.value = '';
    }
}

function sendSupportBotUserMsg(text) {
    const chatBody = document.getElementById('supportChatBody') || document.getElementById('botChatBody');
    if (!chatBody) return;
    
    const userDiv = document.createElement('div');
    userDiv.style.cssText = "background:var(--neon-green-dark); color:#fff; padding:0.75rem 1rem; border-radius:10px; max-width:85%; align-self:flex-end; font-size:0.88rem;";
    userDiv.innerText = text;
    chatBody.appendChild(userDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
        const botDiv = document.createElement('div');
        botDiv.style.cssText = "background:#141b17; border:1px solid var(--border-green); color:#fff; padding:0.75rem 1rem; border-radius:10px; max-width:85%; align-self:flex-start; font-size:0.88rem; line-height:1.6;";
        botDiv.innerText = getBotResponse(text);
        chatBody.appendChild(botDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 550);
}

function getBotResponse(input) {
    const msg = input.toLowerCase();
    if (msg.includes('خصم') || msg.includes('20') || msg.includes('صيف') || msg.includes('خصم الصيف 20%')) {
        return "🌞 بمناسبة العطلة الصيفية، احصل على كود الخصم الفوري (SUMMER20) لتخفيض 20% على جميع طلبات الطباعة ثلاثية الأبعاد 3D المخصصة والمجسمات في العراق!";
    } else if (msg.includes('تكت') || msg.includes('تذكرة') || msg.includes('تجمع') || msg.includes('تذاكر التجمع')) {
        return "🎟️ تجمع محبي ماينكرافت Meetup 2026 سيقام قريباً في بغداد! التذاكر المتاحة تشمل (التذكرة العادية: 35,000 د.ع / $25، والتذكرة الذهبية VIP مع مجسم هدايا 3D: 85,000 د.ع / $65).";
    } else if (msg.includes('توصيل') || msg.includes('شحن') || msg.includes('مدة') || msg.includes('محافظات')) {
        return "🚚 نوفر خدمة التوصيل السريع لجميع محافظات ومناطق العراق (بغداد، البصرة، أربيل، النجف، كربلاء، الموصل، السليمانية، كركوك، وكافة المحافظات) خلال 2 إلى 4 أيام عمل.";
    } else if (msg.includes('إيميل') || msg.includes('ايميل') || msg.includes('بريد') || msg.includes('تواصل')) {
        return "✉️ البريد الإلكتروني الرسمي لخدمة العملاء هو: support@minemart.shop - يمكنك أيضاً النقر على زر 'نسخ' أو 'مراسلة' بأعلى الستارة لفتح تذكرة مباشرة!";
    } else if (msg.includes('3d') || msg.includes('مجسم') || msg.includes('سيف') || msg.includes('ثعلب')) {
        return "🖨️ جميع مجسمات السيف والثعلب والتنين مطبوعة 3D بجودة عالية وخامات PLA المستدامة القوية.";
    } else if (msg.includes('دفع') || msg.includes('طرق الدفع') || msg.includes('زين كاش') || msg.includes('كي كارد')) {
        return "💳 ندعم الدفع بالدينار العراقي (د.ع) والدولار ($) عبر زين كاش (ZainCash)، كي كارد، ماستركارد، فيزا، والدفع نقدًا عند الاستلام لكافة المحافظات.";
    } else {
        return "أهلاً بك في متجر ماين مارت في العراق 🟩! يمكنك التبديل بين الدينار العراقي (د.ع) والدولار ($) من أعلى الصفحة أو عند تسجيل الدخول، ومراسلتنا عبر support@minemart.shop لأي مساعدة.";
    }
}

// Product Detail Page (PDP) Implementation Logic
function initProductDetailPage(productId) {
    productsData = getLiveProducts();
    const p = productsData.find(prod => String(prod.id) === String(productId)) || productsData[0];
    if (!p) return;
    currentPdpProduct = p;
    recordProductView(p.id);

    // Breadcrumb updates
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    if (breadcrumbCategory) breadcrumbCategory.innerText = (p.category || '').toUpperCase();
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    if (breadcrumbTitle) breadcrumbTitle.innerText = p.name || '';

    // Main Image & Thumbnails
    const pdpMainImg = document.getElementById('pdpMainImg');
    if (pdpMainImg) pdpMainImg.src = p.image || 'assets/images/prod_fox.jpg';

    const pdpThumbsStrip = document.getElementById('pdpThumbsStrip');
    if (pdpThumbsStrip) {
        const imageList = p.images && p.images.length > 0 ? p.images : [p.image || 'assets/images/prod_fox.jpg'];
        pdpThumbsStrip.innerHTML = imageList.map((imgSrc, idx) => `
            <div class="pdp-thumb-item ${idx === 0 ? 'active' : ''}" onclick="switchPdpMainImage('${imgSrc}', this)">
                <img src="${imgSrc}" alt="${p.name} thumb ${idx + 1}">
            </div>
        `).join('');
    }

    // Info details
    const pdpCatBadge = document.getElementById('pdpCatBadge');
    if (pdpCatBadge) pdpCatBadge.innerText = (p.category || '').toUpperCase();
    const pdpTitle = document.getElementById('pdpTitle');
    if (pdpTitle) pdpTitle.innerText = p.name || '';
    
    const pdpPriceBox = document.getElementById('pdpPriceBox');
    if (pdpPriceBox) {
        pdpPriceBox.innerHTML = p.discountPercent > 0 ? `
            <span class="current-price">${formatCurrency(p.price)}</span>
            <span class="old-price">${formatCurrency(p.originalPrice)}</span>
            <span class="save-badge">وفر ${p.discountPercent}%</span>
        ` : `<span class="current-price">${formatCurrency(p.price)}</span>`;
    }

    const pdpBenefitsDesc = document.getElementById('pdpBenefitsDesc');
    if (pdpBenefitsDesc) pdpBenefitsDesc.innerText = p.description || p.desc || '';

    // Sticky Mobile Bar info
    const stickyTitle = document.getElementById('stickyTitle');
    if (stickyTitle) stickyTitle.innerText = p.name || '';
    const stickyPrice = document.getElementById('stickyPrice');
    if (stickyPrice) stickyPrice.innerText = formatCurrency(p.price);

    // PDP Quantity Controls
    pdpSelectedQty = 1;
    const pdpQtyValue = document.getElementById('pdpQtyValue');
    if (pdpQtyValue) pdpQtyValue.innerText = pdpSelectedQty;

    const pdpQtyMinus = document.getElementById('pdpQtyMinus');
    if (pdpQtyMinus) {
        pdpQtyMinus.onclick = () => {
            if (pdpSelectedQty > 1) {
                pdpSelectedQty--;
                if (pdpQtyValue) pdpQtyValue.innerText = pdpSelectedQty;
            }
        };
    }

    const pdpQtyPlus = document.getElementById('pdpQtyPlus');
    if (pdpQtyPlus) {
        pdpQtyPlus.onclick = () => {
            pdpSelectedQty++;
            if (pdpQtyValue) pdpQtyValue.innerText = pdpSelectedQty;
        };
    }

    // Add to Cart Buttons
    const pdpAddToCartBtn = document.getElementById('pdpAddToCartBtn');
    if (pdpAddToCartBtn) {
        pdpAddToCartBtn.onclick = () => addToCartWithQty(p.id, pdpSelectedQty);
    }
    const stickyAddBtn = document.getElementById('stickyAddBtn');
    if (stickyAddBtn) {
        stickyAddBtn.onclick = () => addToCartWithQty(p.id, pdpSelectedQty);
    }

    // Variants Color Selector Chips (Dynamic Render & Control)
    const colorGroup = document.querySelector('.color-options-list') ? document.querySelector('.color-options-list').closest('.variant-group') : null;
    const colorListEl = document.querySelector('.color-options-list');
    const selectedColorName = document.getElementById('selectedColorName');

    const showColors = (p.hasColors !== false) && (p.colors && p.colors.length > 0);
    if (colorGroup) colorGroup.style.display = showColors ? 'block' : 'none';

    if (showColors && colorListEl && p.colors) {
        colorListEl.innerHTML = p.colors.map((col, idx) => {
            const cName = typeof col === 'string' ? col : col.name;
            const cHex = typeof col === 'string' ? '#76e611' : (col.hex || '#76e611');
            return `
                <button class="color-chip ${idx === 0 ? 'active' : ''}" data-color="${cName}" style="background:${cHex};" title="${cName}"></button>
            `;
        }).join('');

        if (selectedColorName && p.colors.length > 0) {
            const firstColor = p.colors[0];
            selectedColorName.innerText = typeof firstColor === 'string' ? firstColor : firstColor.name;
        }

        document.querySelectorAll('.color-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const colorName = chip.getAttribute('data-color');
                if (selectedColorName) selectedColorName.innerText = colorName;
            });
        });
    }

    // Variants Size Selector Chips (Dynamic Render & Control with Size Specific Prices)
    const sizeGroup = document.querySelector('.size-options-list') ? document.querySelector('.size-options-list').closest('.variant-group') : null;
    const sizeListEl = document.querySelector('.size-options-list');

    const showSizes = (p.hasSizes !== false) && (p.sizes && p.sizes.length > 0);
    if (sizeGroup) sizeGroup.style.display = showSizes ? 'block' : 'none';

    if (showSizes && sizeListEl && p.sizes) {
        sizeListEl.innerHTML = p.sizes.map((sz, idx) => {
            const sName = typeof sz === 'string' ? sz : sz.name;
            const sPriceIQD = (typeof sz === 'object' && sz.priceIQD) ? sz.priceIQD : null;
            const sPriceUSD = (typeof sz === 'object' && sz.priceUSD) ? sz.priceUSD : (sPriceIQD ? Math.round((sPriceIQD / EXCHANGE_RATE_USD_TO_IQD) * 100) / 100 : null);
            const priceBadge = sPriceUSD ? ` <span style="font-size:0.78rem; opacity:0.85; margin-right:2px;">(${formatCurrency(sPriceUSD)})</span>` : '';
            
            return `
                <button class="size-chip ${idx === 0 ? 'active' : ''}" data-size="${sName}" data-price-iqd="${sPriceIQD || ''}" data-price-usd="${sPriceUSD || ''}">
                    ${sName}${priceBadge}
                </button>
            `;
        }).join('');

        // Function to update PDP price dynamically based on active size chip
        const updatePdpPriceForActiveSize = (chip) => {
            const sizePriceIQD = chip.getAttribute('data-price-iqd');
            const sizePriceUSD = chip.getAttribute('data-price-usd');

            const pdpPriceBox = document.getElementById('pdpPriceBox');
            const stickyPrice = document.getElementById('stickyPrice');

            if (sizePriceUSD && parseFloat(sizePriceUSD) > 0) {
                const numUSD = parseFloat(sizePriceUSD);
                if (pdpPriceBox) pdpPriceBox.innerHTML = `<span class="current-price">${formatCurrency(numUSD)}</span>`;
                if (stickyPrice) stickyPrice.innerText = formatCurrency(numUSD);
            } else if (pdpPriceBox) {
                pdpPriceBox.innerHTML = p.discountPercent > 0 ? `
                    <span class="current-price">${formatCurrency(p.price)}</span>
                    <span class="old-price">${formatCurrency(p.originalPrice)}</span>
                    <span class="save-badge">وفر ${p.discountPercent}%</span>
                ` : `<span class="current-price">${formatCurrency(p.price)}</span>`;
                if (stickyPrice) stickyPrice.innerText = formatCurrency(p.price);
            }
        };

        const firstActiveChip = document.querySelector('.size-chip.active');
        if (firstActiveChip) updatePdpPriceForActiveSize(firstActiveChip);

        document.querySelectorAll('.size-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.size-chip').forEach(s => s.classList.remove('active'));
                chip.classList.add('active');
                updatePdpPriceForActiveSize(chip);
            });
        });
    }

    // Modals (Size Chart & Video Demo)
    const openSizeChartBtn = document.getElementById('openSizeChartBtn');
    const sizeChartModal = document.getElementById('sizeChartModal');
    const closeSizeChartBtn = document.getElementById('closeSizeChartBtn');
    if (openSizeChartBtn && sizeChartModal) {
        openSizeChartBtn.onclick = () => sizeChartModal.classList.add('active');
        if (closeSizeChartBtn) closeSizeChartBtn.onclick = () => sizeChartModal.classList.remove('active');
    }

    const pdpVideoDemoBox = document.getElementById('pdpVideoDemoBox');
    const videoModal = document.getElementById('videoModal');
    const closeVideoModalBtn = document.getElementById('closeVideoModalBtn');
    if (pdpVideoDemoBox && videoModal) {
        pdpVideoDemoBox.onclick = () => videoModal.classList.add('active');
        if (closeVideoModalBtn) closeVideoModalBtn.onclick = () => videoModal.classList.remove('active');
    }

    // Render Related Products ("قد يعجبك أيضاً")
    const relatedGrid = document.getElementById('pdpRelatedProductsGrid');
    if (relatedGrid) {
        const related = productsData.filter(item => String(item.id) !== String(p.id) && item.category === p.category && item.status !== 'draft').concat(productsData.filter(item => String(item.id) !== String(p.id) && item.status !== 'draft')).slice(0, 4);
        relatedGrid.innerHTML = related.map(item => createProductCardHTML(item)).join('');
    }

    // Dynamic Cross-Selling Bundle Offer Render
    renderProductBundleOffer(p, productsData);
}

let currentBundleProducts = [];

function renderProductBundleOffer(currentProduct, allProducts) {
    const bundleCard = document.getElementById('pdpBundleCard') || document.querySelector('.bundle-upsell-card');
    if (!bundleCard) return;

    // Find other published products in the store
    const otherProducts = (allProducts || []).filter(item => String(item.id) !== String(currentProduct.id) && item.status !== 'draft');

    if (otherProducts.length === 0) {
        // Hide bundle if there is no other product in the store
        bundleCard.style.display = 'none';
        currentBundleProducts = [];
        return;
    }

    // Prefer product in same category, otherwise pick first available product
    let secondProduct = otherProducts.find(item => item.category === currentProduct.category) || otherProducts[0];

    currentBundleProducts = [currentProduct, secondProduct];

    // Calculate sum of IQD prices
    const item1IQD = currentProduct.priceIQD || (currentProduct.price ? Math.round(currentProduct.price * EXCHANGE_RATE_USD_TO_IQD) : 0);
    const item2IQD = secondProduct.priceIQD || (secondProduct.price ? Math.round(secondProduct.price * EXCHANGE_RATE_USD_TO_IQD) : 0);
    const originalTotalIQD = item1IQD + item2IQD;
    
    // Apply 15% discount for bundle
    const discountedTotalIQD = Math.round((originalTotalIQD * 0.85) / 250) * 250;

    const priceUSD = Math.round((discountedTotalIQD / EXCHANGE_RATE_USD_TO_IQD) * 100) / 100;
    const oldPriceUSD = Math.round((originalTotalIQD / EXCHANGE_RATE_USD_TO_IQD) * 100) / 100;

    bundleCard.style.display = 'block';
    bundleCard.innerHTML = `
        <div class="bundle-header">
            <h3><i class="fa-solid fa-boxes-packing" style="color:var(--neon-green);"></i> اشترِهما معاً ووفر 15% إضافية (Cross-Selling Bundle)</h3>
            <span class="bundle-save-tag">خصم حزمة المقتنيات 🔥</span>
        </div>
        <div class="bundle-items-row">
            <div class="bundle-prod-thumb" style="cursor:pointer;" onclick="location.href='product-detail.html?id=${currentProduct.id}'">
                <img src="${currentProduct.image || 'assets/images/prod_fox.jpg'}" alt="${currentProduct.name}">
                <span>${currentProduct.name}</span>
            </div>
            <span class="plus-icon">+</span>
            <div class="bundle-prod-thumb" style="cursor:pointer;" onclick="location.href='product-detail.html?id=${secondProduct.id}'">
                <img src="${secondProduct.image || 'assets/images/prod_fox.jpg'}" alt="${secondProduct.name}">
                <span>${secondProduct.name}</span>
            </div>
            <span class="plus-icon">=</span>
            <div class="bundle-price-info">
                <div class="bundle-total-price" id="bundlePriceText">
                    ${formatCurrency(priceUSD)} 
                    <span class="bundle-old" id="bundleOldPriceText">${formatCurrency(oldPriceUSD)}</span>
                </div>
                <button class="btn-hero-cta" onclick="addBundleToCart()" style="padding:0.6rem 1.2rem; font-size:0.88rem;">
                    إضافة الحزمة للسلة <i class="fa-solid fa-cart-plus"></i>
                </button>
            </div>
        </div>
    `;
}

function switchPdpMainImage(imgSrc, thumbEl) {
    const mainImg = document.getElementById('pdpMainImg');
    if (!mainImg) return;
    mainImg.style.opacity = '0.3';
    setTimeout(() => {
        mainImg.src = imgSrc;
        mainImg.style.opacity = '1';
    }, 150);

    document.querySelectorAll('.pdp-thumb-item').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
}

function addBundleToCart() {
    if (!currentBundleProducts || currentBundleProducts.length < 2) {
        alert("عذراً، حزمة المقتنيات غير متاحة حالياً.");
        return;
    }
    const [p1, p2] = currentBundleProducts;
    addToCartWithQty(p1.id, 1);
    addToCartWithQty(p2.id, 1);
    const cartModal = document.getElementById('cartModal');
    if (cartModal) cartModal.classList.add('active');
    alert(`🎉 تم إضافة حزمة المقتنيات:\n• ${p1.name}\n• ${p2.name}\nإلى السلة بنجاح مع خصم 15%!`);
}

// User Interaction Tracking
function recordUserSearch(query) {
    if (!userHistory.searches.includes(query.toLowerCase())) {
        userHistory.searches.push(query.toLowerCase());
        saveUserHistory();
    }
}

function recordUserInterestCategory(cat) {
    if (cat !== 'all' && !userHistory.categories.includes(cat)) {
        userHistory.categories.push(cat);
        saveUserHistory();
    }
}

function recordProductView(prodId) {
    productsData = getLiveProducts();
    const p = productsData.find(item => String(item.id) === String(prodId));
    if (p) {
        if (!userHistory.viewedIds.includes(String(prodId))) {
            userHistory.viewedIds.push(String(prodId));
        }
        if (!userHistory.categories.includes(p.category)) {
            userHistory.categories.push(p.category);
        }
        saveUserHistory();
    }
}

function saveUserHistory() {
    localStorage.setItem('minemart_user_history', JSON.stringify(userHistory));
}

// ==========================================================================
// Live Search & Intelligent Keyword Suggestions Engine
// ==========================================================================

const POPULAR_KEYWORDS_INDEX = [
    { text: "مجسم الثعلب 3D (Voxel Fox)", type: "keyword", icon: "fa-solid fa-cube", query: "ثعلب" },
    { text: "مجسم السيف المضيء (Voxel Sword)", type: "keyword", icon: "fa-solid fa-wand-magic-sparkles", query: "سيف" },
    { text: "مجسم التنين الأخضر 3D (Dragon)", type: "keyword", icon: "fa-solid fa-dragon", query: "تنين" },
    { text: "صندوق التخزين الخشبي (Chest)", type: "keyword", icon: "fa-solid fa-box", query: "صندوق" },
    { text: "مصباح السحابة الليلي (Cloud Lamp)", type: "keyword", icon: "fa-regular fa-lightbulb", query: "مصباح" },
    { text: "حديقة الميكرو المصغرة (Garden)", type: "keyword", icon: "fa-solid fa-tree", query: "حديقة" },
    { text: "مجسم الروبوت القتالي (Mech Robot)", type: "keyword", icon: "fa-solid fa-robot", query: "روبوت" },
    { text: "قلعة مكعبات مغناطيسية (Castle)", type: "keyword", icon: "fa-solid fa-chess-rook", query: "قلعة" },
    { text: "أزرار كيبورد خضراء (Keycaps)", type: "keyword", icon: "fa-regular fa-keyboard", query: "أزرار" },
    { text: "ماوس باد السيت اب الكبير (Desk Mat)", type: "keyword", icon: "fa-solid fa-desktop", query: "ماوس باد" },
    { text: "مجسم الفارس البكسلي (Knight)", type: "keyword", icon: "fa-solid fa-shield-halved", query: "فارس" },
    { text: "لوحة جبال الفوكسل الجدارية (Canvas)", type: "keyword", icon: "fa-regular fa-image", query: "لوحة" },
    { text: "المخلوقات ثلاثية الأبعاد (Creatures 3D)", type: "category", icon: "fa-solid fa-cubes", cat: "creatures" },
    { text: "ديكور ومصابيح السيت اب (Decor)", type: "category", icon: "fa-solid fa-lightbulb", cat: "decor" },
    { text: "مستلزمات وتجهيزات الجيمينج (Accessories)", type: "category", icon: "fa-solid fa-gamepad", cat: "accessories" },
    { text: "المصابيح المضيئة (Lamps)", type: "category", icon: "fa-solid fa-sun", cat: "lamps" },
    { text: "الألعاب والقطع التفاعلية (Toys)", type: "category", icon: "fa-solid fa-dice-d20", cat: "toys" }
];

function highlightMatchText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function initLiveSearchSuggestions() {
    const searchBox = document.querySelector('.search-box');
    const searchInput = document.getElementById('searchInput');
    if (!searchBox || !searchInput) return;

    // Ensure dropdown element exists
    let dropdown = document.getElementById('searchSuggestionsDropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'searchSuggestionsDropdown';
        dropdown.className = 'search-suggestions-dropdown';
        searchBox.appendChild(dropdown);
    }

    // Function to render suggestions
    function renderSuggestions(query) {
        query = (query || '').trim().toLowerCase();
        if (!query) {
            dropdown.classList.remove('show');
            dropdown.innerHTML = '';
            return;
        }

        const liveProds = getLiveProducts().filter(p => p.status !== 'draft');
        
        // 1. Matching Products
        const matchingProducts = liveProds.filter(p => {
            const nameMatch = p.name.toLowerCase().includes(query);
            const descMatch = (p.description || p.desc || '').toLowerCase().includes(query);
            const catMatch = (p.category || '').toLowerCase().includes(query);
            return nameMatch || descMatch || catMatch;
        }).slice(0, 5);

        // 2. Matching Keywords & Categories
        const matchingKeywords = POPULAR_KEYWORDS_INDEX.filter(k => {
            return k.text.toLowerCase().includes(query) || (k.query && k.query.toLowerCase().includes(query)) || (k.cat && k.cat.toLowerCase().includes(query));
        }).slice(0, 4);

        if (matchingProducts.length === 0 && matchingKeywords.length === 0) {
            dropdown.innerHTML = `
                <div class="suggestion-empty-box">
                    <i class="fa-solid fa-magnifying-glass" style="font-size:1.4rem; color:var(--text-muted); margin-bottom:0.4rem; display:block;"></i>
                    <span>لا توجد نتائج مطابقة لـ "<strong>${query}</strong>"</span>
                    <div style="font-size:0.75rem; margin-top:0.5rem; color:var(--neon-green); cursor:pointer;" onclick="selectSearchKeyword('مجسم')">جرّب البحث عن: مجسم، سيف، تنين، مصباح...</div>
                </div>
            `;
            dropdown.classList.add('show');
            return;
        }

        let html = '';

        // Render Matching Keywords / Categories
        if (matchingKeywords.length > 0) {
            html += `<div class="suggestion-group-title"><i class="fa-solid fa-lightbulb"></i> مقترحات الكلمات والأقسام</div>`;
            matchingKeywords.forEach(k => {
                if (k.type === 'category') {
                    html += `
                        <div class="suggestion-keyword-item" onclick="selectSearchCategory('${k.cat}')">
                            <i class="${k.icon}"></i>
                            <span>${highlightMatchText(k.text, query)}</span>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="suggestion-keyword-item" onclick="selectSearchKeyword('${k.query || k.text}')">
                            <i class="${k.icon}"></i>
                            <span>${highlightMatchText(k.text, query)}</span>
                        </div>
                    `;
                }
            });
        }

        // Render Matching Products
        if (matchingProducts.length > 0) {
            html += `<div class="suggestion-group-title" style="margin-top:0.4rem;"><i class="fa-solid fa-box-open"></i> منتجات مطابقة (${matchingProducts.length})</div>`;
            matchingProducts.forEach(p => {
                html += `
                    <div class="suggestion-product-item" onclick="navigateToPDP(${p.id})">
                        <img src="${p.image}" alt="${p.name}" class="suggestion-product-thumb">
                        <div class="suggestion-product-info">
                            <div class="suggestion-product-name" title="${p.name}">${highlightMatchText(p.name, query)}</div>
                            <div class="suggestion-product-meta">
                                <span class="suggestion-product-cat">${p.category}</span>
                                <span class="suggestion-product-price">${formatCurrency(p.price)}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // Footer "View All in Shop"
        html += `
            <div class="suggestion-view-all-btn" onclick="executeFullSearch('${query.replace(/'/g, "\\'")}')">
                <span>عرض كافة النتائج في المتجر</span>
                <i class="fa-solid fa-arrow-left"></i>
            </div>
        `;

        dropdown.innerHTML = html;
        dropdown.classList.add('show');
    }

    // Input event
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        renderSuggestions(query);
    });

    // Focus event
    searchInput.addEventListener('focus', (e) => {
        if (e.target.value.trim().length > 0) {
            renderSuggestions(e.target.value);
        }
    });

    // Keydown (Enter to submit, Escape to close)
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInput.value.trim();
            executeFullSearch(query);
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('show');
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

function selectSearchKeyword(keyword) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = keyword;
    executeFullSearch(keyword);
}

function selectSearchCategory(catSlug) {
    window.location.href = `shop.html?cat=${encodeURIComponent(catSlug)}`;
}

function executeFullSearch(query) {
    const dropdown = document.getElementById('searchSuggestionsDropdown');
    if (dropdown) dropdown.classList.remove('show');

    if (!query) return;
    recordUserSearch(query);

    if (document.getElementById('productGrid')) {
        // Already on shop.html -> filter grid directly!
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = query;
        renderShopGrid();
        const grid = document.getElementById('productGrid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // Navigate to shop.html with search query
        window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
    }
}

// Homepage Rows Render Logic
function renderHomepageRows() {
    productsData = getLiveProducts();

    const popularGrid = document.getElementById('popularProductsGrid');
    if (popularGrid) {
        const popularProds = productsData.filter(p => p.isPopular && p.status !== 'draft');
        popularGrid.innerHTML = popularProds.map(p => createProductCardHTML(p)).join('');
    }

    const discountGrid = document.getElementById('discountProductsGrid');
    if (discountGrid) {
        const discountProds = productsData.filter(p => p.discountPercent > 0 && p.status !== 'draft');
        discountGrid.innerHTML = discountProds.map(p => createProductCardHTML(p, true)).join('');
    }

    const recommendedGrid = document.getElementById('recommendedProductsGrid');
    if (recommendedGrid) {
        let recommendedProds = [];
        const cartCategories = cart.map(item => item.category);
        const preferredCategories = [...new Set([...userHistory.categories, ...cartCategories])];

        if (preferredCategories.length > 0) {
            recommendedProds = productsData.filter(p => preferredCategories.includes(p.category) && p.status !== 'draft');
        }

        if (recommendedProds.length < 4) {
            recommendedProds = productsData.filter(p => !p.isPopular && p.discountPercent === 0 && p.status !== 'draft').concat(productsData.filter(p => p.status !== 'draft')).slice(0, 4);
        }

        recommendedProds = [...new Set(recommendedProds)].slice(0, 4);
        recommendedGrid.innerHTML = recommendedProds.map(p => createProductCardHTML(p)).join('');
    }
}

// Single Shop Page Full Grid Render
function renderShopGrid() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const searchVal = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';

    const liveProds = getLiveProducts();
    const activeProds = liveProds.filter(p => p.status !== 'draft');
    
    let filtered = activeProds.filter(p => {
        const matchesCategory = (activeCategory === 'all' || !activeCategory || p.category === activeCategory);
        const matchesSearch = p.name.toLowerCase().includes(searchVal) || (p.description || '').toLowerCase().includes(searchVal);
        return matchesCategory && matchesSearch;
    });

    if (currentSort === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    }

    const displayedCount = document.getElementById('displayedCount');
    if (displayedCount) displayedCount.innerText = filtered.length;

    const resultsCountBox = document.querySelector('.shop-results-count');
    if (resultsCountBox) {
        resultsCountBox.innerHTML = `عرض <span id="displayedCount" style="color:var(--neon-green); font-weight:800;">${filtered.length}</span> من أصل ${activeProds.length} منتج متوفر ${searchVal ? `(مطابق للبحث: "<strong>${searchVal}</strong>")` : ''}`;
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; color: var(--text-muted); background: #141b17; border: 1.5px dashed var(--border-green); border-radius: var(--radius-md);">
                <i class="fa-solid fa-box-open" style="font-size: 3.2rem; color: var(--neon-green); margin-bottom: 1rem; display:block; opacity:0.8;"></i>
                <h3 style="color:#fff; font-size:1.2rem; margin-bottom:0.5rem;">لم يتم العثور على منتجات مطابقة في هذا التصنيف أو البحث</h3>
                <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.5rem;">جرّب اختيار قسم آخر من القائمة أو مسح نص البحث الحالي.</p>
                <button class="btn-primary-neon" onclick="selectShopCategoryFilter('all'); if(document.getElementById('searchInput')) document.getElementById('searchInput').value=''; renderShopGrid();" style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.65rem 1.4rem; font-size:0.88rem; cursor:pointer; margin:0 auto;">
                    <i class="fa-solid fa-rotate-left"></i> عرض كافة منتجات المتجر
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(p => createProductCardHTML(p, p.discountPercent > 0)).join('');
}

// Helper: Product Card HTML Template
function createProductCardHTML(p, showDiscountBadge = false) {
    const hasDiscount = p.discountPercent > 0 && p.originalPrice;
    const priceDisplay = hasDiscount ? `
        <span style="color:var(--neon-green); font-weight:900;">${formatCurrency(p.price)}</span>
        <span style="font-size:0.8rem; color:var(--text-dim); text-decoration:line-through; margin-right:0.4rem;">${formatCurrency(p.originalPrice)}</span>
    ` : `
        <span>${formatCurrency(p.price)}</span>
    `;

    const discountBadgeHTML = (showDiscountBadge || p.discountPercent > 0) ? `
        <span class="product-discount-badge">
            خصم ${p.discountPercent}%
        </span>
    ` : '';

    return `
        <div class="product-card-v1">
            ${discountBadgeHTML}
            <div class="product-img-frame" onclick="navigateToPDP('${p.id}')">
                <img src="${p.image}" alt="${p.name}">
            </div>
            <h3 class="product-card-title" onclick="navigateToPDP('${p.id}')">${p.name}</h3>
            <div class="product-rating">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
            </div>
            <div class="product-price-row">${priceDisplay}</div>
            <button class="btn-add-to-cart" onclick="addToCart('${p.id}')">
                إضافة للسلة <i class="fa-solid fa-cart-plus"></i>
            </button>
        </div>
    `;
}

function navigateToPDP(productId) {
    window.location.href = `product-detail.html?id=${encodeURIComponent(productId)}`;
}

// Hero Slider Dynamic Rendering & Interactive Carousel Logic
function initHeroSlider() {
    const wrapper = document.getElementById('heroSliderWrapper');
    if (!wrapper) return;

    const banners = getLiveBanners().filter(b => b.status === 'active');
    if (banners.length === 0) return;

    // Render Dynamic Slides
    const slidesHTML = banners.map((b, idx) => {
        let badgeStyle = '';
        let btnStyle = '';
        if (b.badgeColor === 'red') {
            badgeStyle = 'border-color: #ff0055; color: #ff6699; background: rgba(255, 0, 85, 0.15);';
            btnStyle = 'background: rgba(255,0,85,0.2); border-color: #ff0055; color: #fff;';
        } else if (b.badgeColor === 'blue') {
            badgeStyle = 'border-color: #00d2ff; color: #80e5ff; background: rgba(0, 210, 255, 0.15);';
            btnStyle = 'background: rgba(0,210,255,0.2); border-color: #00d2ff; color: #fff;';
        } else if (b.badgeColor === 'purple') {
            badgeStyle = 'border-color: #a855f7; color: #c084fc; background: rgba(168, 85, 247, 0.15);';
            btnStyle = 'background: rgba(168,85,247,0.2); border-color: #a855f7; color: #fff;';
        } else if (b.badgeColor === 'gold') {
            badgeStyle = 'border-color: #ffaa00; color: #ffd180; background: rgba(255, 170, 0, 0.15);';
            btnStyle = 'background: rgba(255,170,0,0.2); border-color: #ffaa00; color: #fff;';
        }

        const highlightSpan = b.highlightText ? `<span>${b.highlightText}</span>` : '';
        const titleFull = `${b.title} ${highlightSpan}`;

        return `
            <div class="hero-slide ${idx === 0 ? 'active' : ''}" style="background-image: linear-gradient(270deg, rgba(8, 12, 9, 0.95) 0%, rgba(8, 12, 9, 0.85) 45%, rgba(8, 12, 9, 0.35) 80%, transparent 100%), url('${b.image}'); background-size: cover; background-position: center center; background-repeat: no-repeat;">
                <div class="hero-badge-tag" style="${badgeStyle}">
                    <i class="${b.badgeIcon || 'fa-solid fa-tag'}"></i> ${b.badgeText}
                </div>
                <div class="hero-text-box">
                    <h1>${titleFull}</h1>
                    <p>${b.desc}</p>
                    <a href="${b.btnLink || 'shop.html'}" class="btn-hero-cta" style="${btnStyle}">
                        ${b.btnText || 'SHOP NOW'} <i class="${b.btnIcon || 'fa-solid fa-arrow-left'}"></i>
                    </a>
                </div>
            </div>
        `;
    }).join('');

    // Remove existing slides inside wrapper
    const existingSlides = wrapper.querySelectorAll('.hero-slide');
    existingSlides.forEach(s => s.remove());

    // Insert new slides at start of wrapper
    wrapper.insertAdjacentHTML('afterbegin', slidesHTML);

    // Update dots
    const dotsContainer = document.getElementById('sliderDotsContainer');
    if (dotsContainer) {
        dotsContainer.innerHTML = banners.map((_, idx) => `
            <div class="slider-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></div>
        `).join('');
    }

    // Attach slider controls
    const slides = wrapper.querySelectorAll('.hero-slide');
    const dots = wrapper.querySelectorAll('.slider-dot');
    const prevBtn = document.getElementById('prevSlideBtn');
    const nextBtn = document.getElementById('nextSlideBtn');

    if (slides.length === 0) return;
    currentSlide = 0;

    function goToSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }

    if (prevBtn) {
        prevBtn.onclick = () => {
            goToSlide(currentSlide - 1);
            resetAutoPlay();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            goToSlide(currentSlide + 1);
            resetAutoPlay();
        };
    }

    dots.forEach((dot, idx) => {
        dot.onclick = () => {
            goToSlide(idx);
            resetAutoPlay();
        };
    });

    function startAutoPlay() {
        if (slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 8000);
    }

    function resetAutoPlay() {
        clearInterval(slideInterval);
        startAutoPlay();
    }

    wrapper.onmouseenter = () => clearInterval(slideInterval);
    wrapper.onmouseleave = startAutoPlay;

    startAutoPlay();
}

// Multi-Image Product Gallery Modal Logic
function openProductModal(productId) {
    productsData = getLiveProducts();
    const p = productsData.find(prod => String(prod.id) === String(productId));
    if (!p) return;

    recordProductView(productId);
    modalSelectedQty = 1;
    const valEl = document.getElementById('modalQtyValue');
    if (valEl) valEl.innerText = modalSelectedQty;

    const modalImg = document.getElementById('modalImg');
    if (modalImg) modalImg.src = p.image || 'assets/images/prod_fox.jpg';
    const catBadge = document.getElementById('modalCategoryBadge');
    if (catBadge) catBadge.innerText = (p.category || '').toUpperCase();
    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.innerText = p.name || '';
    const priceEl = document.getElementById('modalPrice');
    if (priceEl) {
        priceEl.innerHTML = p.discountPercent > 0 ? `${formatCurrency(p.price)} <span style="font-size:0.9rem; text-decoration:line-through; color:var(--text-dim); margin-right:0.5rem;">${formatCurrency(p.originalPrice)}</span>` : `${formatCurrency(p.price)}`;
    }
    const descEl = document.getElementById('modalDesc');
    if (descEl) descEl.innerText = p.description || p.desc || '';

    const thumbsStrip = document.getElementById('modalThumbnailsStrip');
    if (thumbsStrip) {
        const imageList = p.images && p.images.length > 0 ? p.images : [p.image || 'assets/images/prod_fox.jpg'];
        thumbsStrip.innerHTML = imageList.map((imgSrc, idx) => `
            <div class="modal-thumb-item ${idx === 0 ? 'active' : ''}" onclick="switchModalMainImage('${imgSrc}', this)">
                <img src="${imgSrc}" alt="${p.name} angle ${idx + 1}">
            </div>
        `).join('');
    }

    const addBtn = document.getElementById('modalAddBtn');
    if (addBtn) {
        addBtn.onclick = () => {
            addToCartWithQty(p.id, modalSelectedQty);
            closeModal();
        };
    }

    const modalOverlay = document.getElementById('productModalOverlay');
    if (modalOverlay) modalOverlay.classList.add('active');
}

function switchModalMainImage(imgSrc, thumbEl) {
    const modalImg = document.getElementById('modalImg');
    if (!modalImg) return;
    modalImg.style.opacity = '0.3';
    setTimeout(() => {
        modalImg.src = imgSrc;
        modalImg.style.opacity = '1';
    }, 150);

    document.querySelectorAll('.modal-thumb-item').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
}

function closeModal() {
    const modalOverlay = document.getElementById('productModalOverlay');
    if (modalOverlay) modalOverlay.classList.remove('active');
}

// Mobile Navigation Drawer Toggle
function toggleMobileNavDrawer() {
    const drawer = document.getElementById('mobileNavDrawer');
    const overlay = document.getElementById('mobileNavOverlay');
    if (drawer && overlay) {
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

// Cart Logic
function toggleCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function addToCart(productId) {
    addToCartWithQty(productId, 1);
}

function addToCartWithQty(productId, qty, selectedColor = null, selectedSize = null, customPriceUSD = null) {
    productsData = getLiveProducts();
    const prod = productsData.find(p => String(p.id) === String(productId));
    if (!prod) return;

    recordProductView(productId);

    // Active color and size selection from PDP if not explicitly passed
    if (!selectedColor) {
        const activeColorBtn = document.querySelector('.color-chip.active');
        if (activeColorBtn) selectedColor = activeColorBtn.getAttribute('data-color');
    }
    if (!selectedSize) {
        const activeSizeBtn = document.querySelector('.size-chip.active');
        if (activeSizeBtn) {
            selectedSize = activeSizeBtn.getAttribute('data-size');
            const sizePriceUSD = activeSizeBtn.getAttribute('data-price-usd');
            if (sizePriceUSD && !customPriceUSD && parseFloat(sizePriceUSD) > 0) {
                customPriceUSD = parseFloat(sizePriceUSD);
            }
        }
    }

    const priceToUse = (customPriceUSD && customPriceUSD > 0) ? customPriceUSD : prod.price;
    const itemCartKey = `${productId}_${selectedSize || 'default'}_${selectedColor || 'default'}`;

    const existing = cart.find(item => item.itemCartKey === itemCartKey || (String(item.id) === String(productId) && item.selectedSize === selectedSize && item.selectedColor === selectedColor));
    
    if (existing) {
        existing.qty += qty;
        existing.price = priceToUse;
    } else {
        const displayName = selectedSize ? `${prod.name} (${selectedSize})` : prod.name;
        cart.push({ 
            ...prod, 
            itemCartKey: itemCartKey,
            name: displayName,
            price: priceToUse,
            selectedColor: selectedColor,
            selectedSize: selectedSize,
            qty: qty 
        });
    }
    saveCart();
    updateCartUI();
    
    if (document.getElementById('popularProductsGrid')) {
        renderHomepageRows();
    }

    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
        drawer.classList.add('active');
        overlay.classList.add('active');
    }
}

function changeQty(productId, delta) {
    const item = cart.find(i => String(i.id) === String(productId));
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => String(i.id) !== String(productId));
    }
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('minemart_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartBadge = document.getElementById('cartBadge');
    const cartSubtotal = document.getElementById('cartSubtotal');

    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalPriceUSD = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    if (cartBadge) cartBadge.innerText = totalCount;
    if (cartSubtotal) cartSubtotal.innerText = formatCurrency(totalPriceUSD);

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                <i class="fa-solid fa-basket-shopping" style="font-size: 2.5rem; color: var(--neon-green); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>سلة التسوق فارغة حالياً</p>
            </div>
        `;
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div style="display:flex; align-items:center; gap:0.75rem; background:#111713; padding:0.75rem; border-radius:8px; border:1px solid var(--border-green);">
            <img src="${item.image || 'assets/images/prod_fox.jpg'}" style="width:55px; height:55px; border-radius:6px; object-fit:cover;">
            <div style="flex:1;">
                <div style="font-weight:700; font-size:0.85rem; margin-bottom:0.2rem;">${item.name}</div>
                <div style="color:var(--neon-green); font-weight:800; font-size:0.88rem;">${formatCurrency(item.price * item.qty)}</div>
                <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.3rem;">
                    <button onclick="changeQty('${item.id}', -1)" style="width:22px; height:22px; background:#1c261e; border:1px solid var(--border-green); color:#fff; cursor:pointer;">-</button>
                    <span style="font-size:0.85rem; font-weight:700;">${item.qty}</span>
                    <button onclick="changeQty('${item.id}', 1)" style="width:22px; height:22px; background:#1c261e; border:1px solid var(--border-green); color:#fff; cursor:pointer;">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Global Window Bindings for Storefront
window.getSelectedCurrency = getSelectedCurrency;
window.setSelectedCurrency = setSelectedCurrency;
window.toggleCurrencyQuick = toggleCurrencyQuick;
window.formatCurrency = formatCurrency;
window.getConvertedAmount = getConvertedAmount;
window.updateCurrencyUI = updateCurrencyUI;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.handleUserHeaderClick = handleUserHeaderClick;
window.openCustomerAuthModal = openCustomerAuthModal;
window.closeCustomerAuthModal = closeCustomerAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleCustomerLoginSubmit = handleCustomerLoginSubmit;
window.handleCustomerRegisterSubmit = handleCustomerRegisterSubmit;
window.handleCustomerLogout = handleCustomerLogout;
window.proceedToCheckout = proceedToCheckout;
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.applyCheckoutCoupon = applyCheckoutCoupon;
window.selectPaymentMethod = selectPaymentMethod;
window.handleFinalOrderSubmit = handleFinalOrderSubmit;
window.closeSuccessModal = closeSuccessModal;
window.openMyOrdersModal = openMyOrdersModal;
window.closeMyOrdersModal = closeMyOrdersModal;
window.copyStoreEmail = copyStoreEmail;
window.toggleSupportDrawer = toggleSupportDrawer;
window.toggleCartDrawer = toggleCartDrawer;
window.addToCart = addToCart;
window.addToCartWithQty = addToCartWithQty;
window.changeQty = changeQty;
window.openProductModal = openProductModal;
window.closeModal = closeModal;
window.navigateToPDP = navigateToPDP;
window.switchPdpMainImage = switchPdpMainImage;
window.addBundleToCart = addBundleToCart;
window.selectPaymentMethod = selectPaymentMethod;
window.initLiveSearchSuggestions = initLiveSearchSuggestions;
window.selectSearchKeyword = selectSearchKeyword;
window.selectSearchCategory = selectSearchCategory;
window.executeFullSearch = executeFullSearch;
window.renderShopCategoriesSidebar = renderShopCategoriesSidebar;
window.selectShopCategoryFilter = selectShopCategoryFilter;
window.renderShopGrid = renderShopGrid;
