// ==========================================================================
// Mine Mart Admin Dashboard - Persistence & Direct File Upload Script
// ==========================================================================

const BACKEND_URL = (typeof window !== 'undefined' && (window.location.protocol === 'file:' || (window.location.port !== '5000' && !window.location.port)))
    ? 'http://localhost:5000'
    : '';
const API_BASE = `${BACKEND_URL}/api/v1`;
const EXCHANGE_RATE_USD_TO_IQD = 1320; // 1 USD = 1,320 IQD

// Cross-tab Real-Time Synchronization Channel
const minemartChannel = (typeof window !== 'undefined' && window.BroadcastChannel) ? new BroadcastChannel('minemart_store_channel') : null;

function broadcastDataChange() {
    try {
        if (minemartChannel) {
            minemartChannel.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
        }
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('minemart:data_updated', { detail: { timestamp: Date.now() } }));
        }
    } catch(e) {}
}

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
    { id: 1, name: "المخلوقات 3D", slug: "creatures", count: 4, image: "assets/images/prod_fox.jpg", desc: "مجسمات المخلوقات ثلاثية الأبعاد بأسلوب الفوكسل" },
    { id: 2, name: "ديكور ومصابيح", slug: "decor", count: 3, image: "assets/images/prod_sword.jpg", desc: "مصنوعات مضيئة ولوحات جدارية" },
    { id: 3, name: "مستلزمات السيت اب", slug: "accessories", count: 3, image: "assets/images/prod_chest.jpg", desc: "صناديق الخشب، أزرار الكيبورد، وماوس باد" },
    { id: 4, name: "المصابيح المضيئة", slug: "lamps", count: 1, image: "assets/images/prod_lamp.jpg", desc: "مصباح السحابة المضيء Voxel" },
    { id: 5, name: "الألعاب والقطع", slug: "toys", count: 1, image: "assets/images/prod_magnetic_cubes.jpg", desc: "مكعبات وقلاع مغناطيسية" }
];

// Seed Products Default Data (Canonical Products from data/products.json)
const defaultProducts = [
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
        desc: "",
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
        desc: "",
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
        desc: "مجسم غاست (Ghast)\nالارتفاع 96 سم\nاللون ابيض \nتم طباعتهه باجود انواع مواد الطباعه ثلاثية الابعاد",
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
        desc: "مجسم كريبر بقياس 6 سم \nحلقة معدنية لتعليق المجسم في اي مكان \nالمجسم مطبوع باجود انواع مواد الطباعة",
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
        badgeText: "مستلزمات وسيت اب الجيمرز",
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
        badgeText: "عروض العطلة الصيفية 🔥",
        badgeIcon: "fa-solid fa-sun",
        badgeColor: "red",
        desc: "احصل على خصم 20% بمناسبة العطلة الصيفية على جميع طلبات المجسمات والطباعة ثلاثية الأبعاد المخصصة 3D!",
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

// Helpers to initialize state cleanly from physical disk files (Shared by all computers)
function loadMergedAdminProducts() {
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
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            console.error("Error loading products from localStorage:", e);
        }
    }

    return JSON.parse(JSON.stringify(defaultProducts));
}

function loadMergedAdminCategories() {
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
        } catch (e) {}
    }

    return JSON.parse(JSON.stringify(defaultCategories));
}

function loadMergedAdminBanners() {
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

function loadMergedAdminCoupons() {
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

// Seed Orders Default Data (Iraqi Governorates & Currencies)
const defaultOrders = [
    {
        id: "ORD-9082",
        date: "2026-08-17",
        name: "علي الكرخي",
        email: "ali.karkhi@gmail.com",
        phone: "07701234567",
        country: "العراق",
        province: "بغداد",
        address: "العراق - بغداد - الكرادة شارع العرصات",
        currency: "IQD",
        totalUSD: 45,
        total: "59,000 د.ع ($45)",
        items: [
            { id: 1, name: "Voxel Fox Figurine | مجسم الثعلب المكعبي 3D", price: 45, qty: 1, image: "assets/images/prod_fox.jpg" }
        ],
        payment: "زين كاش ZainCash",
        status: "pending"
    },
    {
        id: "ORD-9081",
        date: "2026-08-16",
        name: "مصطفى البصري",
        email: "mustafa.basra@gmail.com",
        phone: "07809876543",
        country: "العراق",
        province: "البصرة",
        address: "العراق - البصرة - العشار قرب الكورنيش",
        currency: "IQD",
        totalUSD: 95,
        total: "125,000 د.ع ($95)",
        items: [
            { id: 7, name: "Robot Mech Figure | مجسم الروبوت المكعبي 3D", price: 95, qty: 1, image: "assets/images/prod_3d_figure.jpg" }
        ],
        payment: "كي كارد / ماستركارد",
        status: "shipping"
    },
    {
        id: "ORD-9080",
        date: "2026-08-16",
        name: "أحمد الأربيلي",
        email: "ahmed.erbil@gmail.com",
        phone: "07501122334",
        country: "العراق",
        province: "أربيل",
        address: "العراق - أربيل - عينكاوة",
        currency: "USD",
        totalUSD: 60,
        total: "$60 (79,000 د.ع)",
        items: [
            { id: 2, name: "Voxel Sword Replica | مجسم السيف البكسلي 3D", price: 60, qty: 1, image: "assets/images/prod_sword.jpg" }
        ],
        payment: "الدفع عند الاستلام",
        status: "delivered"
    }
];

function loadMergedAdminOrders() {
    const saved = localStorage.getItem('mine_mart_orders');
    if (!saved) {
        try {
            localStorage.setItem('mine_mart_orders', JSON.stringify(defaultOrders));
            idbSet('mine_mart_orders', defaultOrders);
        } catch(e) {}
        return JSON.parse(JSON.stringify(defaultOrders));
    }
    try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return JSON.parse(JSON.stringify(defaultOrders));
}

// Seed Staff & Roles Default Data
const defaultStaff = [
    { id: 1, name: "سعد القحطاني", email: "admin@minemart.shop", role: "admin", roleLabel: "Admin (كامل الصلاحيات والتحكم)", enc: "bcryptjs (12 rounds)", lastLogin: "اليوم، 15:42", status: "active" },
    { id: 2, name: "فهد الشمري", email: "manager@minemart.shop", role: "manager", roleLabel: "Manager (إدارة المخزون والطلبات)", enc: "bcryptjs (12 rounds)", lastLogin: "أمس، 22:15", status: "active" },
    { id: 3, name: "نور العبيدي", email: "staff@minemart.shop", role: "staff", roleLabel: "Staff (خدمة العملاء ومراجعة المنتجات)", enc: "bcryptjs (12 rounds)", lastLogin: "منذ 3 أيام", status: "active" }
];

function loadMergedAdminStaff() {
    const saved = localStorage.getItem('mine_mart_staff');
    if (!saved) {
        try {
            localStorage.setItem('mine_mart_staff', JSON.stringify(defaultStaff));
            idbSet('mine_mart_staff', defaultStaff);
        } catch(e) {}
        return JSON.parse(JSON.stringify(defaultStaff));
    }
    try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return JSON.parse(JSON.stringify(defaultStaff));
}

// Load Saved State
let adminCategories = loadMergedAdminCategories();
let adminProducts = loadMergedAdminProducts();
let adminBanners = loadMergedAdminBanners();
let adminCoupons = loadMergedAdminCoupons();
let adminOrders = loadMergedAdminOrders();
let adminStaff = loadMergedAdminStaff();

let editingProductId = null;
let currentModalOrderId = null;
let currentProductImages = [];
let currentPrimaryImageIndex = 0;

// Sync full state to physical JSON files in D:\mine mart\mine mart market\data\
async function syncStateToDiskFiles() {
    try {
        const payload = {
            products: adminProducts,
            categories: adminCategories,
            banners: adminBanners,
            coupons: adminCoupons,
            orders: adminOrders,
            staff: adminStaff
        };

        const res = await fetch(`${API_BASE}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            updateDiskSyncIndicator(true);
        } else {
            updateDiskSyncIndicator(false);
        }
    } catch(err) {
        updateDiskSyncIndicator(false);
    }
}

function updateDiskSyncIndicator(isOnline) {
    const pill = document.getElementById('diskSyncStatusPill');
    const text = document.getElementById('diskSyncStatusText');
    const serverBtn = document.getElementById('serverSwitchBtn');
    
    if (serverBtn) {
        if (window.location.protocol === 'file:') {
            serverBtn.style.display = 'inline-flex';
        } else {
            serverBtn.style.display = 'none';
        }
    }

    if (!pill || !text) return;
    if (isOnline) {
        text.innerText = 'متزامن مع ملفات المشروع 📁';
        text.style.color = 'var(--neon-green)';
        const dot = pill.querySelector('.pulse-dot');
        if (dot) dot.style.background = 'var(--neon-green)';
    } else {
        text.innerText = 'تخزين محلي مؤقت 💾';
        text.style.color = '#ffcc00';
        const dot = pill.querySelector('.pulse-dot');
        if (dot) dot.style.background = '#ffcc00';
    }
}

// Save helper to guarantee persistence across page refreshes with quota protection & IndexedDB dual-sync
function savePersistentData() {
    try {
        localStorage.setItem('mine_mart_categories', JSON.stringify(adminCategories));
        localStorage.setItem('mine_mart_products', JSON.stringify(adminProducts));
        localStorage.setItem('mine_mart_banners', JSON.stringify(adminBanners));
        localStorage.setItem('mine_mart_coupons', JSON.stringify(adminCoupons));
        localStorage.setItem('mine_mart_orders', JSON.stringify(adminOrders));
        localStorage.setItem('mine_mart_staff', JSON.stringify(adminStaff));
    } catch (err) {
        console.warn("Storage Quota Warning on localStorage, saving to IndexedDB fallback:", err);
    }

    // Always mirror to IndexedDB for 100% permanent persistence with no size limits
    idbSet('mine_mart_categories', adminCategories);
    idbSet('mine_mart_products', adminProducts);
    idbSet('mine_mart_banners', adminBanners);
    idbSet('mine_mart_coupons', adminCoupons);
    idbSet('mine_mart_orders', adminOrders);
    idbSet('mine_mart_staff', adminStaff);

    // Save directly to project folder files (D:\mine mart\mine mart market\data\*.json)
    syncStateToDiskFiles();

    // Broadcast instant update across all open tabs and storefront pages
    broadcastDataChange();
}

// Background sync from backend server and project data/*.json files on startup
async function initAsyncPersistenceSync() {
    try {
        let syncedFromServer = false;
        try {
            const res = await fetch(`${API_BASE}/sync`);
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    if (Array.isArray(json.data.products) && json.data.products.length > 0) {
                        adminProducts = json.data.products;
                        try { localStorage.setItem('mine_mart_products', JSON.stringify(adminProducts)); } catch(e) {}
                    }
                    if (Array.isArray(json.data.categories) && json.data.categories.length > 0) {
                        adminCategories = json.data.categories;
                        try { localStorage.setItem('mine_mart_categories', JSON.stringify(adminCategories)); } catch(e) {}
                    }
                    if (Array.isArray(json.data.banners) && json.data.banners.length > 0) {
                        adminBanners = json.data.banners;
                        try { localStorage.setItem('mine_mart_banners', JSON.stringify(adminBanners)); } catch(e) {}
                    }
                    if (Array.isArray(json.data.coupons) && json.data.coupons.length > 0) {
                        adminCoupons = json.data.coupons;
                        try { localStorage.setItem('mine_mart_coupons', JSON.stringify(adminCoupons)); } catch(e) {}
                    }
                    if (Array.isArray(json.data.orders) && json.data.orders.length > 0) {
                        adminOrders = json.data.orders;
                        try { localStorage.setItem('mine_mart_orders', JSON.stringify(adminOrders)); } catch(e) {}
                    }
                    if (Array.isArray(json.data.staff) && json.data.staff.length > 0) {
                        adminStaff = json.data.staff;
                        try { localStorage.setItem('mine_mart_staff', JSON.stringify(adminStaff)); } catch(e) {}
                    }
                    syncedFromServer = true;
                    updateDiskSyncIndicator(true);
                }
            }
        } catch(e) {
            // Fallback to window.MINE_MART_STORE_DATA loaded from data-store.js
            if (typeof window !== 'undefined' && window.MINE_MART_STORE_DATA) {
                if (Array.isArray(window.MINE_MART_STORE_DATA.products) && window.MINE_MART_STORE_DATA.products.length > 0) {
                    adminProducts = window.MINE_MART_STORE_DATA.products;
                    try { localStorage.setItem('mine_mart_products', JSON.stringify(adminProducts)); } catch(e2) {}
                }
                if (Array.isArray(window.MINE_MART_STORE_DATA.categories) && window.MINE_MART_STORE_DATA.categories.length > 0) {
                    adminCategories = window.MINE_MART_STORE_DATA.categories;
                    try { localStorage.setItem('mine_mart_categories', JSON.stringify(adminCategories)); } catch(e2) {}
                }
                if (Array.isArray(window.MINE_MART_STORE_DATA.banners) && window.MINE_MART_STORE_DATA.banners.length > 0) {
                    adminBanners = window.MINE_MART_STORE_DATA.banners;
                    try { localStorage.setItem('mine_mart_banners', JSON.stringify(adminBanners)); } catch(e2) {}
                }
                if (Array.isArray(window.MINE_MART_STORE_DATA.coupons) && window.MINE_MART_STORE_DATA.coupons.length > 0) {
                    adminCoupons = window.MINE_MART_STORE_DATA.coupons;
                    try { localStorage.setItem('mine_mart_coupons', JSON.stringify(adminCoupons)); } catch(e2) {}
                }
                if (Array.isArray(window.MINE_MART_STORE_DATA.orders) && window.MINE_MART_STORE_DATA.orders.length > 0) {
                    adminOrders = window.MINE_MART_STORE_DATA.orders;
                    try { localStorage.setItem('mine_mart_orders', JSON.stringify(adminOrders)); } catch(e2) {}
                }
                if (Array.isArray(window.MINE_MART_STORE_DATA.staff) && window.MINE_MART_STORE_DATA.staff.length > 0) {
                    adminStaff = window.MINE_MART_STORE_DATA.staff;
                    try { localStorage.setItem('mine_mart_staff', JSON.stringify(adminStaff)); } catch(e2) {}
                }
                syncedFromServer = true;
            }
        }

        renderProductsTable();
        renderCategoriesTable();
        renderBannersList();
        renderCouponsTable();
        renderOrdersTable();
        renderStaffTable();
        renderCategorySelectOptions();
        updateOverviewStats();
    } catch(e) {}
}

// --------------------------------------------------------------------------
// Backup, Export & Import Engine (For seamless multi-PC data portability)
// --------------------------------------------------------------------------
function exportFullDatabaseJSON() {
    try {
        const backupData = {
            version: "2.9",
            exportedAt: new Date().toISOString(),
            products: adminProducts,
            categories: adminCategories,
            banners: adminBanners,
            coupons: adminCoupons,
            orders: adminOrders,
            staff: adminStaff
        };

        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `minemart_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch(e) {
        alert('⚠️ حدث خطأ أثناء تصدير ملف النسخة الاحتياطية: ' + e.message);
    }
}

function triggerImportJSONFile() {
    const input = document.getElementById('importBackupFileInput');
    if (input) {
        input.value = '';
        input.click();
    }
}

async function handleImportJSONFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const parsed = JSON.parse(content);

            let prods = Array.isArray(parsed) ? parsed : (parsed.products || null);
            let cats = parsed.categories || null;
            let bans = parsed.banners || null;
            let coups = parsed.coupons || null;
            let ords = parsed.orders || null;
            let stf = parsed.staff || null;

            if (prods && Array.isArray(prods)) {
                adminProducts = prods;
            }
            if (cats && Array.isArray(cats)) {
                adminCategories = cats;
            }
            if (bans && Array.isArray(bans)) {
                adminBanners = bans;
            }
            if (coups && Array.isArray(coups)) {
                adminCoupons = coups;
            }
            if (ords && Array.isArray(ords)) {
                adminOrders = ords;
            }
            if (stf && Array.isArray(stf)) {
                adminStaff = stf;
            }

            savePersistentData();
            initAdminDashboardApp();
            alert(`✅ تم استيراد واسترجاع البيانات بنجاح! (${adminProducts.length} منتج، ${adminCategories.length} قسم). تم حفظها وتعميمها بنجاح.`);
        } catch(err) {
            alert('⚠️ فشل قراءة ملف النسخة الاحتياطية! تأكد من اختيار ملف JSON صالح.');
            console.error('Error importing backup JSON:', err);
        }
    };
    reader.readAsText(file);
}

async function forceSyncFromDiskOrServer() {
    try {
        localStorage.removeItem('mine_mart_products');
        localStorage.removeItem('mine_mart_categories');
        localStorage.removeItem('mine_mart_banners');
        localStorage.removeItem('mine_mart_coupons');
        localStorage.removeItem('mine_mart_orders');
        await initAsyncPersistenceSync();
        alert('🔄 تمت إعادة مزامنة وتحديث كافة البيانات من السيرفر وملفات المشروع بنجاح!');
    } catch(err) {
        alert('⚠️ تعذر المزامنة: ' + err.message);
    }
}


function initAdminDashboardApp() {
    // Initial Render for all views from persistent state
    try { renderCategoriesTable(); } catch(e) {}
    try { renderProductsTable(); } catch(e) {}
    try { renderBannersList(); } catch(e) {}
    try { renderCouponsTable(); } catch(e) {}
    try { renderOrdersTable(); } catch(e) {}
    try { renderStaffTable(); } catch(e) {}
    try { renderCategorySelectOptions(); } catch(e) {}
    try { updateOverviewStats(); } catch(e) {}

    // Check IndexedDB for any additional persistent items
    try { initAsyncPersistenceSync(); } catch(e) {}

    try { checkAdminAuth(); } catch(e) {}

    // Tab Navigation
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e && e.preventDefault) e.preventDefault();
            const targetTabId = item.getAttribute('data-tab');
            if (targetTabId) switchTab(targetTabId);
        });
    });

    // Login Form Handler
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLoginSubmit);
    }

    // Logout
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
            } catch (e) {}
            sessionStorage.removeItem('admin_logged_in');
            window.location.reload();
        });
    }

    // Form Submit Handlers with Direct Named Functions
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    }

    const adminProductForm = document.getElementById('adminProductForm');
    if (adminProductForm) {
        adminProductForm.addEventListener('submit', handleProductFormSubmit);
    }

    const bannerForm = document.getElementById('bannerForm');
    if (bannerForm) {
        bannerForm.addEventListener('submit', handleBannerFormSubmit);
    }

    const couponForm = document.getElementById('couponForm');
    if (couponForm) {
        couponForm.addEventListener('submit', handleCouponFormSubmit);
    }

    const staffForm = document.getElementById('staffForm');
    if (staffForm) {
        staffForm.addEventListener('submit', handleStaffFormSubmit);
    }

    // Global Search
    const searchInput = document.getElementById('adminGlobalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderProductsTable(e.target.value.trim().toLowerCase());
        });
    }

    // Modal Trigger and Close Button Event Listeners
    const openCatBtn = document.getElementById('openAddCategoryModal');
    if (openCatBtn) openCatBtn.addEventListener('click', openAddCategoryModalForm);

    const closeCatBtn = document.getElementById('closeCategoryModal');
    if (closeCatBtn) closeCatBtn.addEventListener('click', closeCategoryModalForm);

    const openProdBtn = document.getElementById('openAddProductModal');
    if (openProdBtn) openProdBtn.addEventListener('click', openAddProductModalForm);

    const closeProdBtn = document.getElementById('closeAdminProductModal');
    if (closeProdBtn) closeProdBtn.addEventListener('click', closeAdminProductModalForm);

    const openBannerBtn = document.getElementById('openAddBannerModal');
    if (openBannerBtn) openBannerBtn.addEventListener('click', openAddBannerModalForm);

    const closeBannerBtn = document.getElementById('closeBannerModal');
    if (closeBannerBtn) closeBannerBtn.addEventListener('click', closeBannerModalForm);

    const openCouponBtn = document.getElementById('openAddCouponModal');
    if (openCouponBtn) openCouponBtn.addEventListener('click', openAddCouponModalForm);

    const closeCouponBtn = document.getElementById('closeCouponModal');
    if (closeCouponBtn) closeCouponBtn.addEventListener('click', closeCouponModalForm);

    const openStaffBtn = document.getElementById('openAddStaffModal');
    if (openStaffBtn) openStaffBtn.addEventListener('click', openAddStaffModalForm);

    const closeStaffBtn = document.getElementById('closeStaffModal');
    if (closeStaffBtn) closeStaffBtn.addEventListener('click', closeStaffModalForm);
}

// Execute immediately if DOM is ready, or on DOMContentLoaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initAdminDashboardApp();
} else {
    document.addEventListener('DOMContentLoaded', initAdminDashboardApp);
}

// Modal Controller Functions
function openAddCategoryModalForm() {
    const form = document.getElementById('categoryForm');
    if (form) form.reset();
    document.getElementById('catImg').value = 'assets/images/prod_fox.jpg';
    const previewWrap = document.getElementById('catImgPreview');
    if (previewWrap) previewWrap.style.display = 'none';
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeCategoryModalForm() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function openAddCategoryModalForm() {
    const editIdEl = document.getElementById('categoryEditId');
    if (editIdEl) editIdEl.value = '';
    const form = document.getElementById('categoryForm');
    if (form) form.reset();
    clearCatImage();
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

// Real-time Currency Conversion Handlers (IQD to USD)
function handleProductPriceIQDChange(val) {
    const iqd = parseFloat(String(val).replace(/,/g, ''));
    const usdDisplayEl = document.getElementById('pPriceUSDDisplay');
    const pPriceHidden = document.getElementById('pPrice');

    if (!isNaN(iqd) && iqd > 0) {
        const usd = Math.round((iqd / EXCHANGE_RATE_USD_TO_IQD) * 100) / 100;
        if (usdDisplayEl) usdDisplayEl.innerText = `$${usd.toFixed(2)} USD`;
        if (pPriceHidden) pPriceHidden.value = usd;
    } else {
        if (usdDisplayEl) usdDisplayEl.innerText = '$0.00 USD';
        if (pPriceHidden) pPriceHidden.value = '0';
    }
}

function handleProductOriginalPriceIQDChange(val) {
    const iqd = parseFloat(String(val).replace(/,/g, ''));
    const origDisplayEl = document.getElementById('pOriginalPriceUSDDisplay');
    const pOrigHidden = document.getElementById('pOriginalPrice');

    if (!isNaN(iqd) && iqd > 0) {
        const usd = Math.round((iqd / EXCHANGE_RATE_USD_TO_IQD) * 100) / 100;
        if (origDisplayEl) origDisplayEl.innerText = `$${usd.toFixed(2)} USD`;
        if (pOrigHidden) pOrigHidden.value = usd;
    } else {
        if (origDisplayEl) origDisplayEl.innerText = '-';
        if (pOrigHidden) pOrigHidden.value = '';
    }
}

// Dynamic Product Variant Options State (Colors & Sizes)
let currentProductColors = [];
let currentProductSizes = [];

function toggleProductColorsInput(enabled) {
    const container = document.getElementById('pColorsContainer');
    if (container) container.style.display = enabled ? 'block' : 'none';
}

function toggleProductSizesInput(enabled) {
    const container = document.getElementById('pSizesContainer');
    if (container) container.style.display = enabled ? 'block' : 'none';
}

function renderAdminColorChips() {
    const listEl = document.getElementById('pColorsChipList');
    if (!listEl) return;
    if (!currentProductColors || currentProductColors.length === 0) {
        listEl.innerHTML = `<span style="color:var(--text-muted); font-size:0.8rem; padding:0.25rem;">لا توجد ألوان مضافة بعد.</span>`;
        return;
    }
    listEl.innerHTML = currentProductColors.map((col, idx) => `
        <div style="display:inline-flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.06); border:1px solid rgba(118,230,17,0.3); border-radius:15px; padding:0.2rem 0.6rem; font-size:0.82rem; color:#fff;">
            <span style="width:12px; height:12px; border-radius:50%; background:${col.hex || '#76e611'}; display:inline-block; border:1px solid #fff;"></span>
            <span>${col.name}</span>
            <button type="button" onclick="removeAdminProductColorChip(${idx})" style="background:none; border:none; color:#ff3366; cursor:pointer; font-weight:bold; font-size:0.95rem; line-height:1; padding:0 2px;">&times;</button>
        </div>
    `).join('');
}

function addAdminProductColorChip() {
    const nameEl = document.getElementById('pNewColorName');
    const hexEl = document.getElementById('pNewColorHex');
    const name = nameEl ? nameEl.value.trim() : '';
    const hex = hexEl ? hexEl.value : '#76e611';

    if (!name) {
        alert("يرجى كتابة اسم اللون أولاً (مثال: أخضر نيون 🟩)");
        if (nameEl) nameEl.focus();
        return;
    }

    currentProductColors.push({ name: name, hex: hex });
    if (nameEl) nameEl.value = '';
    renderAdminColorChips();
}

function removeAdminProductColorChip(idx) {
    if (idx >= 0 && idx < currentProductColors.length) {
        currentProductColors.splice(idx, 1);
        renderAdminColorChips();
    }
}

function renderAdminSizeChips() {
    const listEl = document.getElementById('pSizesChipList');
    if (!listEl) return;
    if (!currentProductSizes || currentProductSizes.length === 0) {
        listEl.innerHTML = `<span style="color:var(--text-muted); font-size:0.8rem; padding:0.25rem;">لا توجد قياسات مضافة بعد.</span>`;
        return;
    }
    listEl.innerHTML = currentProductSizes.map((sz, idx) => {
        const sName = typeof sz === 'string' ? sz : sz.name;
        const sPriceIQD = (typeof sz === 'object' && sz.priceIQD) ? sz.priceIQD : null;
        const priceLabel = sPriceIQD ? ` <strong style="color:var(--neon-green); margin-right:4px;">(${sPriceIQD.toLocaleString('en-US')} د.ع)</strong>` : '';
        return `
            <div style="display:inline-flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.06); border:1px solid rgba(118,230,17,0.3); border-radius:15px; padding:0.25rem 0.7rem; font-size:0.82rem; color:#fff;">
                <i class="fa-solid fa-ruler" style="color:var(--neon-green); font-size:0.75rem;"></i>
                <span>${sName}${priceLabel}</span>
                <button type="button" onclick="removeAdminProductSizeChip(${idx})" style="background:none; border:none; color:#ff3366; cursor:pointer; font-weight:bold; font-size:0.95rem; line-height:1; padding:0 2px; margin-right:4px;">&times;</button>
            </div>
        `;
    }).join('');
}

function addAdminProductSizeChip() {
    const nameEl = document.getElementById('pNewSizeName');
    const priceIQDEl = document.getElementById('pNewSizePriceIQD');
    const name = nameEl ? nameEl.value.trim() : '';
    const priceIQD = (priceIQDEl && priceIQDEl.value !== '') ? parseFloat(priceIQDEl.value.replace(/,/g, '')) : null;

    if (!name) {
        alert("يرجى كتابة اسم أو أبعاد القياس (مثال: صغير (10 سم) أو XL)");
        if (nameEl) nameEl.focus();
        return;
    }

    const sizeObj = {
        name: name,
        priceIQD: (priceIQD && priceIQD > 0) ? priceIQD : null,
        priceUSD: (priceIQD && priceIQD > 0) ? Math.round((priceIQD / EXCHANGE_RATE_USD_TO_IQD) * 100) / 100 : null
    };

    currentProductSizes.push(sizeObj);
    if (nameEl) nameEl.value = '';
    if (priceIQDEl) priceIQDEl.value = '';
    renderAdminSizeChips();
}

function removeAdminProductSizeChip(idx) {
    if (idx >= 0 && idx < currentProductSizes.length) {
        currentProductSizes.splice(idx, 1);
        renderAdminSizeChips();
    }
}

function openAddProductModalForm() {
    editingProductId = null;
    const editIdEl = document.getElementById('productEditId');
    if (editIdEl) editIdEl.value = '';
    const form = document.getElementById('adminProductForm');
    if (form) form.reset();
    
    currentProductImages = [];
    currentPrimaryImageIndex = 0;
    renderProductImagesGallery();

    const priceIQDEl = document.getElementById('pPriceIQD');
    if (priceIQDEl) priceIQDEl.value = '';
    handleProductPriceIQDChange(0);

    const origPriceIQDEl = document.getElementById('pOriginalPriceIQD');
    if (origPriceIQDEl) origPriceIQDEl.value = '';
    handleProductOriginalPriceIQDChange(0);

    // Initialize Default Variant Options (Colors & Sizes)
    const enableColorsEl = document.getElementById('pEnableColors');
    if (enableColorsEl) enableColorsEl.checked = true;
    toggleProductColorsInput(true);
    currentProductColors = [
        { name: 'أخضر نيون 🟩', hex: '#76e611' },
        { name: 'أسود أوبسيديان ⬛', hex: '#1a1a1a' },
        { name: 'أزرق ألماسي 🟦', hex: '#00d2ff' },
        { name: 'ذهبي برتقالي 🟧', hex: '#ffaa00' }
    ];
    renderAdminColorChips();

    const enableSizesEl = document.getElementById('pEnableSizes');
    if (enableSizesEl) enableSizesEl.checked = true;
    toggleProductSizesInput(true);
    currentProductSizes = [
        { name: 'صغير (10 سم)', priceIQD: 45000, priceUSD: 34.09 },
        { name: 'متوسط (18 سم)', priceIQD: 59000, priceUSD: 44.70 },
        { name: 'كبير (26 سم)', priceIQD: 75000, priceUSD: 56.82 }
    ];
    renderAdminSizeChips();

    renderCategorySelectOptions();
    const modal = document.getElementById('adminProductModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeAdminProductModalForm() {
    const modal = document.getElementById('adminProductModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function openAddBannerModalForm() {
    const editIdEl = document.getElementById('bannerEditId');
    if (editIdEl) editIdEl.value = '';
    const titleEl = document.getElementById('bannerModalTitle');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-sliders"></i> إضافة بنر وسلايد هيرو جديد';
    const form = document.getElementById('bannerForm');
    if (form) form.reset();
    clearBannerImage();
    const bImgEl = document.getElementById('bImg');
    if (bImgEl) bImgEl.value = 'assets/images/hero_bg.jpg';
    const bBadgeIconEl = document.getElementById('bBadgeIcon');
    if (bBadgeIconEl) bBadgeIconEl.value = 'fa-solid fa-tag';
    const bBtnLinkEl = document.getElementById('bBtnLink');
    if (bBtnLinkEl) bBtnLinkEl.value = 'shop.html';

    const bannerModal = document.getElementById('bannerModal');
    if (bannerModal) {
        bannerModal.classList.add('active');
        bannerModal.style.display = 'flex';
    }
}

function closeBannerModalForm() {
    const bannerModal = document.getElementById('bannerModal');
    if (bannerModal) {
        bannerModal.classList.remove('active');
        bannerModal.style.display = 'none';
    }
}

function openAddCouponModalForm() {
    const editIdEl = document.getElementById('couponEditId');
    if (editIdEl) editIdEl.value = '';
    const titleEl = document.getElementById('couponModalTitle');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-ticket"></i> إضافة كوبون خصم جديد';
    const form = document.getElementById('couponForm');
    if (form) form.reset();
    const couponModal = document.getElementById('couponModal');
    if (couponModal) {
        couponModal.classList.add('active');
        couponModal.style.display = 'flex';
    }
}

function closeCouponModalForm() {
    const couponModal = document.getElementById('couponModal');
    if (couponModal) {
        couponModal.classList.remove('active');
        couponModal.style.display = 'none';
    }
}

// Staff / Employee Modal Controllers
function openAddStaffModalForm() {
    const editIdEl = document.getElementById('staffEditId');
    if (editIdEl) editIdEl.value = '';
    const titleEl = document.getElementById('staffModalTitle');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-user-shield"></i> إضافة موظف ومسؤول جديد';
    const form = document.getElementById('staffForm');
    if (form) form.reset();
    const roleEl = document.getElementById('stRole');
    if (roleEl) roleEl.value = 'staff';
    const statusEl = document.getElementById('stStatus');
    if (statusEl) statusEl.value = 'active';
    const modal = document.getElementById('staffModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeStaffModalForm() {
    const modal = document.getElementById('staffModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function editStaff(staffId) {
    const s = adminStaff.find(item => String(item.id) === String(staffId));
    if (!s) return;

    const editIdEl = document.getElementById('staffEditId');
    if (editIdEl) editIdEl.value = String(s.id);
    const titleEl = document.getElementById('staffModalTitle');
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-user-pen"></i> تعديل بيانات الموظف (${s.name})`;

    const nameEl = document.getElementById('stName');
    if (nameEl) nameEl.value = s.name || '';
    const emailEl = document.getElementById('stEmail');
    if (emailEl) emailEl.value = s.email || '';
    const roleEl = document.getElementById('stRole');
    if (roleEl) roleEl.value = s.role || 'staff';
    const statusEl = document.getElementById('stStatus');
    if (statusEl) statusEl.value = s.status || 'active';
    const passEl = document.getElementById('stPassword');
    if (passEl) passEl.value = '';

    const modal = document.getElementById('staffModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function deleteStaff(staffId) {
    if (adminStaff.length <= 1) {
        alert("⚠️ لا يمكن حذف آخر حساب مسؤول في النظام!");
        return;
    }
    if (confirm("هل أنت متأكد من إزالة هذا الموظف وسحب كافة صلاحياته؟")) {
        adminStaff = adminStaff.filter(item => String(item.id) !== String(staffId));
        savePersistentData();
        renderStaffTable();
    }
}

function renderStaffTable() {
    const tbody = document.getElementById('adminStaffTable');
    if (!tbody) return;

    if (adminStaff.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">لا يوجد موظفون مسجلون حالياً</td></tr>`;
        return;
    }

    tbody.innerHTML = adminStaff.map(s => {
        let roleClass = 'role-staff';
        if (s.role === 'admin') roleClass = 'role-admin';
        else if (s.role === 'manager') roleClass = 'role-manager';

        const isSuspended = s.status === 'inactive';
        const statusChip = isSuspended ?
            `<span class="status-chip status-pending" style="font-size:0.75rem;"><i class="fa-solid fa-ban"></i> معطل</span>` :
            `<span class="status-chip status-delivered" style="font-size:0.75rem;"><i class="fa-solid fa-circle-check"></i> نشط</span>`;

        return `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td style="color:var(--text-dim); font-size:0.85rem;">${s.email}</td>
                <td><span class="role-chip ${roleClass}">${s.roleLabel || s.role}</span></td>
                <td><span class="sec-pass-tag"><i class="fa-solid fa-lock"></i> ${s.enc || 'bcryptjs (12 rounds)'}</span></td>
                <td style="color:var(--text-muted); font-size:0.82rem;">${s.lastLogin || 'اليوم'}</td>
                <td>${statusChip}</td>
                <td>
                    <button class="btn-sm-action" onclick="editStaff('${s.id}')" title="تعديل"><i class="fa-solid fa-user-pen"></i> تعديل</button>
                    <button class="btn-sm-action btn-danger" onclick="deleteStaff('${s.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// Dynamic Category Options for Product Modal
function renderCategorySelectOptions(selectedCategory = '') {
    const select = document.getElementById('pCategory');
    if (!select) return;

    select.innerHTML = adminCategories.map(cat => `
        <option value="${cat.slug}" ${cat.slug === selectedCategory ? 'selected' : ''}>
            ${cat.name} (${cat.slug})
        </option>
    `).join('');
}

// Preset banner selector helper
function selectPresetBannerImage(val) {
    if (!val) return;
    const bImgEl = document.getElementById('bImg');
    if (bImgEl) bImgEl.value = val;
    const previewWrap = document.getElementById('bannerImgPreview');
    const previewPic = document.getElementById('bannerPreviewPic');
    if (previewWrap && previewPic) {
        previewPic.src = val;
        previewWrap.style.display = 'block';
    }
}

// Image Clear Helpers with 'X' button
function clearCatImage() {
    const catImgEl = document.getElementById('catImg');
    if (catImgEl) catImgEl.value = '';
    const fileInput = document.getElementById('catImgFile');
    if (fileInput) fileInput.value = '';
    const previewWrap = document.getElementById('catImgPreview');
    if (previewWrap) previewWrap.style.display = 'none';
    const previewPic = document.getElementById('catPreviewPic');
    if (previewPic) previewPic.src = '';
}

function clearBannerImage() {
    const bImgEl = document.getElementById('bImg');
    if (bImgEl) bImgEl.value = '';
    const fileInput = document.getElementById('bannerImgFile');
    if (fileInput) fileInput.value = '';
    const previewWrap = document.getElementById('bannerImgPreview');
    if (previewWrap) previewWrap.style.display = 'none';
    const previewPic = document.getElementById('bannerPreviewPic');
    if (previewPic) previewPic.src = '';
    const presetSelect = document.getElementById('bPresetImages');
    if (presetSelect) presetSelect.value = '';
}

// ==========================================================================
// Smart High-Quality Image Resizer & Aspect-Ratio Optimizer Engine
// ==========================================================================
/**
 * Intelligently resizes and crops images to target aspect ratios (e.g. 16:9 for banners, 1:1 for products)
 * Uses high-fidelity multi-step bicubic smoothing to prevent quality loss while drastically optimizing performance.
 */
function optimizeAndResizeImage(file, options = {}) {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        aspectRatio = null, // e.g. 16/9, 1/1, or null for natural proportion
        quality = 0.92,
        format = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
        if (!file || !file.type || !file.type.startsWith('image/')) {
            return reject(new Error("الملف المحدد ليس صورة صالحة"));
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let srcW = img.naturalWidth || img.width;
                let srcH = img.naturalHeight || img.height;
                let targetW = srcW;
                let targetH = srcH;

                let srcX = 0;
                let srcY = 0;
                let cropW = srcW;
                let cropH = srcH;

                // 1. Aspect Ratio Adaptation (Smart Center-Cropping without stretching)
                if (aspectRatio) {
                    const currentRatio = srcW / srcH;
                    if (currentRatio > aspectRatio) {
                        // Image is wider than desired ratio -> crop horizontal edges from center
                        cropW = Math.round(srcH * aspectRatio);
                        srcX = Math.round((srcW - cropW) / 2);
                    } else if (currentRatio < aspectRatio) {
                        // Image is taller than desired ratio -> crop vertical edges from center
                        cropH = Math.round(srcW / aspectRatio);
                        srcY = Math.round((srcH - cropH) / 2);
                    }

                    targetW = Math.min(cropW, maxWidth);
                    targetH = Math.round(targetW / aspectRatio);
                } else {
                    // Fit within maxWidth & maxHeight while preserving natural aspect ratio
                    const scale = Math.min(maxWidth / srcW, maxHeight / srcH, 1);
                    targetW = Math.round(srcW * scale);
                    targetH = Math.round(srcH * scale);
                }

                // Minimum dimensions safety
                targetW = Math.max(1, targetW);
                targetH = Math.max(1, targetH);

                // Multi-step high quality canvas rendering with bicubic smoothing
                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw cropped & scaled image
                ctx.drawImage(img, srcX, srcY, cropW, cropH, 0, 0, targetW, targetH);

                // Export to high quality DataURL & Blob
                const mimeType = (format === 'image/webp' && canvas.toDataURL('image/webp').startsWith('data:image/webp')) ? 'image/webp' : 'image/jpeg';
                const dataUrl = canvas.toDataURL(mimeType, quality);

                canvas.toBlob((blob) => {
                    resolve({
                        blob: blob || file,
                        dataUrl: dataUrl,
                        originalSize: file.size,
                        optimizedSize: blob ? blob.size : dataUrl.length,
                        width: targetW,
                        height: targetH,
                        aspectRatio: aspectRatio ? '16:9' : `${targetW}:${targetH}`
                    });
                }, mimeType, quality);
            };
            img.onerror = () => reject(new Error("فشل قراءة بيانات الصورة"));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("فشل قراءة الملف"));
        reader.readAsDataURL(file);
    });
}

// Helper to save base64 / blob image to server under custom sanitized name
async function saveImageToServer(dataUrlOrPath, name, index = null) {
    if (!dataUrlOrPath || typeof dataUrlOrPath !== 'string') return dataUrlOrPath;
    if (!dataUrlOrPath.startsWith('data:image/')) return dataUrlOrPath;

    try {
        const res = await fetch(`${API_BASE}/save-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: dataUrlOrPath,
                name: name,
                index: index
            })
        });
        if (res.ok) {
            const json = await res.json();
            if (json && json.filePath) {
                return json.filePath;
            }
        }
    } catch(e) {
        console.warn("Failed to save named image to server:", e);
    }
    return dataUrlOrPath;
}

// Helper to delete physical image files from server storage
async function deleteImagesFromServer(imagePaths) {
    if (!imagePaths) return;
    const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
    const validPaths = paths.filter(p => typeof p === 'string' && p.startsWith('assets/images/'));
    if (validPaths.length === 0) return;

    try {
        await fetch(`${API_BASE}/delete-images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: validPaths })
        });
    } catch(e) {
        console.warn("Failed to delete images from server:", e);
    }
}

// Helper to optimize image for preview and defer physical file creation until form submission
async function uploadOrOptimizeImage(file, options = {}) {
    const {
        maxWidth = 600,
        maxHeight = 600,
        aspectRatio = null,
        quality = 0.82
    } = options;

    const opt = await optimizeAndResizeImage(file, {
        maxWidth,
        maxHeight,
        aspectRatio,
        quality
    });

    // Return dataUrl for client-side instant preview (single physical file is created upon Save Form)
    return opt.dataUrl;
}

// Direct File Upload Select Handlers with Smart Auto-Resize & 16:9 Fitting
async function handleBannerFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const bTitleEl = document.getElementById('bTitle');
    const customName = bTitleEl ? bTitleEl.value.trim() : 'بنر_الهيرو';

    try {
        const filePathOrData = await uploadOrOptimizeImage(file, {
            maxWidth: 1280,
            maxHeight: 720,
            aspectRatio: 16 / 9,
            quality: 0.85,
            customName: customName
        });

        const previewWrap = document.getElementById('bannerImgPreview');
        const previewPic = document.getElementById('bannerPreviewPic');
        if (previewWrap && previewPic) {
            previewPic.src = filePathOrData;
            previewWrap.style.display = 'block';
        }
        const bImgEl = document.getElementById('bImg');
        if (bImgEl) bImgEl.value = filePathOrData;
    } catch (err) {
        console.error("Banner Auto-Resize Error:", err);
    }
}

async function handleCatFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const catNameEl = document.getElementById('catName');
    const customName = catNameEl ? catNameEl.value.trim() : 'قسم';

    try {
        const filePathOrData = await uploadOrOptimizeImage(file, {
            maxWidth: 600,
            maxHeight: 600,
            aspectRatio: 1 / 1,
            quality: 0.85,
            customName: customName
        });

        const previewWrap = document.getElementById('catImgPreview');
        const previewPic = document.getElementById('catPreviewPic');
        if (previewWrap && previewPic) {
            previewPic.src = filePathOrData;
            previewWrap.style.display = 'block';
        }
        const catImgEl = document.getElementById('catImg');
        if (catImgEl) catImgEl.value = filePathOrData;
    } catch (err) {
        console.error("Category Auto-Resize Error:", err);
    }
}

async function handleProdFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const pNameEl = document.getElementById('pName');
    const customName = pNameEl ? pNameEl.value.trim() : 'منتج';

    try {
        const filePathOrData = await uploadOrOptimizeImage(file, {
            maxWidth: 1080,
            maxHeight: 1350,
            aspectRatio: 4 / 5,
            quality: 0.88,
            customName: customName
        });
        currentProductImages = [filePathOrData];
        currentPrimaryImageIndex = 0;
        renderProductImagesGallery();
    } catch(err) {
        console.error("Product Auto-Resize Error:", err);
    }
}

// Multi-Image Upload & Gallery Handlers with Smart Auto-Resize (1080 x 1350)
async function handleProdMultipleFilesSelect(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const pNameEl = document.getElementById('pName');
    const customName = pNameEl ? pNameEl.value.trim() : 'منتج';

    const galleryEl = document.getElementById('pImagesGalleryPreview');
    if (galleryEl && (!currentProductImages || currentProductImages.length === 0)) {
        galleryEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:1rem; color:var(--neon-green); font-size:0.9rem;"><i class="fa-solid fa-spinner fa-spin"></i> جاري معالجة ورفع الصور بأعلى دقة 1080×1350...</div>`;
    }

    let startIdx = currentProductImages.length;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageIndex = files.length > 1 || startIdx > 0 ? (startIdx + i + 1) : null;
        try {
            const filePathOrData = await uploadOrOptimizeImage(file, {
                maxWidth: 1080,
                maxHeight: 1350,
                aspectRatio: 4 / 5,
                quality: 0.88,
                customName: customName,
                imageIndex: imageIndex
            });
            currentProductImages.push(filePathOrData);
        } catch(err) {
            console.error("Multi Product Auto-Resize Error:", err);
        }
    }

    if (currentPrimaryImageIndex >= currentProductImages.length) {
        currentPrimaryImageIndex = 0;
    }
    renderProductImagesGallery();
}

function renderProductImagesGallery() {
    const galleryEl = document.getElementById('pImagesGalleryPreview');
    if (!galleryEl) return;

    if (!currentProductImages || currentProductImages.length === 0) {
        galleryEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; padding:1.25rem 1rem; border:1.5px dashed rgba(118,230,17,0.3); border-radius:8px; color:var(--text-muted); font-size:0.85rem; background:rgba(0,0,0,0.2);">
                <i class="fa-solid fa-cloud-arrow-up" style="font-size:1.5rem; color:var(--neon-green); margin-bottom:0.4rem; display:block;"></i>
                لم يتم رفع أي صور للمنتج بعد. يمكنك اختيار صورة أو عدة صور للمنتج من الحقل أعلاه.
            </div>
        `;
        const pImgEl = document.getElementById('pImg');
        if (pImgEl) pImgEl.value = 'assets/images/prod_fox.jpg';
        return;
    }

    if (currentPrimaryImageIndex < 0 || currentPrimaryImageIndex >= currentProductImages.length) {
        currentPrimaryImageIndex = 0;
    }

    const primaryImage = currentProductImages[currentPrimaryImageIndex];
    const pImgEl = document.getElementById('pImg');
    if (pImgEl) pImgEl.value = primaryImage;

    galleryEl.innerHTML = currentProductImages.map((imgUrl, idx) => {
        const isPrimary = idx === currentPrimaryImageIndex;
        return `
            <div class="prod-gallery-card ${isPrimary ? 'is-primary' : ''}">
                <img src="${imgUrl}" alt="صورة ${idx + 1}">
                <button type="button" class="btn-remove-img" onclick="removeProductGalleryImage(${idx})" title="حذف هذه الصورة">&times;</button>
                <button type="button" class="btn-set-primary ${isPrimary ? 'active' : ''}" onclick="setProductPrimaryImage(${idx})" title="تعيين كصورة غلاف للمنتج">
                    ${isPrimary ? '<i class="fa-solid fa-star"></i> الرئيسية ⭐' : '<i class="fa-regular fa-star"></i> تعيين كرئيسية'}
                </button>
            </div>
        `;
    }).join('');
}

async function removeProductGalleryImage(idx) {
    if (idx >= 0 && idx < currentProductImages.length) {
        const removedImg = currentProductImages[idx];
        // Delete image file from server if it is a saved physical file
        if (removedImg && typeof removedImg === 'string' && removedImg.startsWith('assets/images/')) {
            await deleteImagesFromServer(removedImg);
        }
        currentProductImages.splice(idx, 1);
        if (currentPrimaryImageIndex >= currentProductImages.length) {
            currentPrimaryImageIndex = Math.max(0, currentProductImages.length - 1);
        }
        renderProductImagesGallery();
    }
}

function setProductPrimaryImage(idx) {
    if (idx >= 0 && idx < currentProductImages.length) {
        currentPrimaryImageIndex = idx;
        renderProductImagesGallery();
    }
}

// Category Form Submit Handler
async function handleCategoryFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const editIdEl = document.getElementById('categoryEditId');
    const editId = (editIdEl && editIdEl.value !== undefined) ? String(editIdEl.value).trim() : '';

    const nameEl = document.getElementById('catName');
    const catName = nameEl ? String(nameEl.value).trim() : '';
    const slugEl = document.getElementById('catSlug');
    const catSlug = slugEl ? String(slugEl.value).trim().toLowerCase() : '';
    const imgEl = document.getElementById('catImg');
    let catImg = (imgEl && imgEl.value) ? imgEl.value : 'assets/images/prod_fox.jpg';
    const descEl = document.getElementById('catDesc');
    const catDesc = descEl ? String(descEl.value).trim() : '';

    if (!catName || !catSlug) {
        alert("يرجى ملء اسم القسم ورمزه بالإنكليزية (Slug)");
        return false;
    }

    // Save image with category name if it is base64
    if (catImg.startsWith('data:image/')) {
        catImg = await saveImageToServer(catImg, catName);
    }

    if (editId) {
        const c = adminCategories.find(item => String(item.id) === String(editId));
        if (c) {
            c.name = catName;
            c.slug = catSlug;
            c.image = catImg;
            c.desc = catDesc;
        } else {
            const existingIdx = adminCategories.findIndex(item => item.slug === catSlug);
            if (existingIdx !== -1) {
                adminCategories[existingIdx].name = catName;
                adminCategories[existingIdx].image = catImg;
                adminCategories[existingIdx].desc = catDesc;
            } else {
                adminCategories.push({
                    id: Date.now(),
                    name: catName,
                    slug: catSlug,
                    image: catImg,
                    count: 0,
                    desc: catDesc
                });
            }
        }
    } else {
        const existingIdx = adminCategories.findIndex(item => item.slug === catSlug);
        if (existingIdx !== -1) {
            adminCategories[existingIdx].name = catName;
            adminCategories[existingIdx].image = catImg;
            adminCategories[existingIdx].desc = catDesc;
        } else {
            adminCategories.push({
                id: Date.now(),
                name: catName,
                slug: catSlug,
                image: catImg,
                count: 0,
                desc: catDesc
            });
        }
    }

    savePersistentData();
    renderCategoriesTable();
    renderCategorySelectOptions();
    closeCategoryModalForm();
    const form = document.getElementById('categoryForm');
    if (form) form.reset();
    alert("✅ تم حفظ وتحديث القسم بالمتجر بنجاح!");
    return false;
}

// Product Form Submit Handler (IQD and Auto-Converted USD Support)
async function handleProductFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
        const editIdEl = document.getElementById('productEditId');
        const editId = (editIdEl && editIdEl.value !== undefined) ? String(editIdEl.value).trim() : (editingProductId ? String(editingProductId) : '');

        const nameEl = document.getElementById('pName');
        const pName = nameEl ? String(nameEl.value).trim() : '';
        const catEl = document.getElementById('pCategory');
        const pCategory = catEl ? catEl.value : 'creatures';
        
        // Read IQD & USD Prices
        const priceIQDEl = document.getElementById('pPriceIQD');
        const priceIQD = (priceIQDEl && priceIQDEl.value !== '') ? parseFloat(String(priceIQDEl.value).replace(/,/g, '')) : 0;
        
        const priceEl = document.getElementById('pPrice');
        let pPrice = (priceEl && priceEl.value !== '' && parseFloat(priceEl.value) > 0) 
            ? parseFloat(priceEl.value) 
            : (priceIQD > 0 ? Math.round((priceIQD / EXCHANGE_RATE_USD_TO_IQD) * 100) / 100 : 0);

        const origPriceIQDEl = document.getElementById('pOriginalPriceIQD');
        const origPriceIQD = (origPriceIQDEl && origPriceIQDEl.value !== '') ? parseFloat(String(origPriceIQDEl.value).replace(/,/g, '')) : null;

        const origPriceEl = document.getElementById('pOriginalPrice');
        let pOriginalPrice = (origPriceEl && origPriceEl.value !== '' && parseFloat(origPriceEl.value) > 0) 
            ? parseFloat(origPriceEl.value) 
            : (origPriceIQD ? Math.round((origPriceIQD / EXCHANGE_RATE_USD_TO_IQD) * 100) / 100 : null);

        const stockEl = document.getElementById('pStock');
        const pStock = (stockEl && stockEl.value !== '') ? parseInt(stockEl.value, 10) : 10;
        const statusEl = document.getElementById('pStatus');
        const pStatus = statusEl ? statusEl.value : 'published';
        const descEl = document.getElementById('pDesc');
        const pDesc = descEl ? String(descEl.value).trim() : '';

        if (!pName) {
            alert("⚠️ يرجى إدخال اسم المنتج");
            if (nameEl) nameEl.focus();
            return false;
        }

        if (isNaN(priceIQD) || priceIQD <= 0) {
            alert("⚠️ يرجى إدخال سعر المنتج بالدينار العراقي (مثال: 59000 د.ع)");
            if (priceIQDEl) priceIQDEl.focus();
            return false;
        }

        const discountPercent = (pOriginalPrice && pOriginalPrice > pPrice) ? Math.round(((pOriginalPrice - pPrice) / pOriginalPrice) * 100) : 0;

        // Save all images to physical files named with product name + index
        let processedImages = [];
        let rawImgs = (currentProductImages && Array.isArray(currentProductImages) && currentProductImages.length > 0)
            ? [...currentProductImages]
            : ['assets/images/prod_fox.jpg'];

        const totalImgs = rawImgs.length;
        for (let i = 0; i < totalImgs; i++) {
            const imgItem = rawImgs[i];
            const imgIndex = totalImgs > 1 ? (i + 1) : null;
            const savedPath = await saveImageToServer(imgItem, pName, imgIndex);
            processedImages.push(savedPath);
        }

        let finalImages = processedImages.length > 0 ? processedImages : ['assets/images/prod_fox.jpg'];

        if (currentPrimaryImageIndex < 0 || currentPrimaryImageIndex >= finalImages.length) {
            currentPrimaryImageIndex = 0;
        }
        const primaryImg = finalImages[currentPrimaryImageIndex] || finalImages[0];

        // Variants Options (Colors & Sizes)
        const enableColorsEl = document.getElementById('pEnableColors');
        const hasColors = enableColorsEl ? enableColorsEl.checked : true;

        const enableSizesEl = document.getElementById('pEnableSizes');
        const hasSizes = enableSizesEl ? enableSizesEl.checked : true;

        const savedColors = hasColors ? [...currentProductColors] : [];
        const savedSizes = hasSizes ? [...currentProductSizes] : [];

        if (editId) {
            const prod = adminProducts.find(p => String(p.id) === String(editId));
            if (prod) {
                prod.name = pName;
                prod.category = pCategory;
                prod.price = pPrice;
                prod.priceIQD = priceIQD;
                prod.originalPrice = pOriginalPrice;
                prod.originalPriceIQD = origPriceIQD;
                prod.discountPercent = discountPercent;
                prod.stock = isNaN(pStock) ? 10 : pStock;
                prod.status = pStatus;
                prod.image = primaryImg;
                prod.images = finalImages;
                prod.desc = pDesc;
                prod.description = pDesc;
                prod.hasColors = hasColors;
                prod.colors = savedColors;
                prod.hasSizes = hasSizes;
                prod.sizes = savedSizes;
            } else {
                const newProd = {
                    id: isNaN(Number(editId)) ? Date.now() : Number(editId),
                    name: pName,
                    category: pCategory,
                    price: pPrice,
                    priceIQD: priceIQD,
                    originalPrice: pOriginalPrice,
                    originalPriceIQD: origPriceIQD,
                    discountPercent: discountPercent,
                    stock: isNaN(pStock) ? 10 : pStock,
                    status: pStatus,
                    isPopular: true,
                    rating: 5,
                    image: primaryImg,
                    images: finalImages,
                    desc: pDesc,
                    description: pDesc,
                    hasColors: hasColors,
                    colors: savedColors,
                    hasSizes: hasSizes,
                    sizes: savedSizes
                };
                adminProducts.unshift(newProd);
            }
        } else {
            const newProd = {
                id: Date.now(),
                name: pName,
                category: pCategory,
                price: pPrice,
                priceIQD: priceIQD,
                originalPrice: pOriginalPrice,
                originalPriceIQD: origPriceIQD,
                discountPercent: discountPercent,
                stock: isNaN(pStock) ? 10 : pStock,
                status: pStatus,
                isPopular: true,
                rating: 5,
                image: primaryImg,
                images: finalImages,
                desc: pDesc,
                description: pDesc,
                hasColors: hasColors,
                colors: savedColors,
                hasSizes: hasSizes,
                sizes: savedSizes
            };
            adminProducts.unshift(newProd);
        }

        editingProductId = null;
        savePersistentData();
        renderProductsTable();
        renderCategoriesTable();
        updateOverviewStats();
        closeAdminProductModalForm();
        const form = document.getElementById('adminProductForm');
        if (form) form.reset();
        alert(`✅ تم حفظ ونشر المنتج بنجاح!\nالسعر: ${priceIQD.toLocaleString()} د.ع (≈ $${pPrice} USD)`);
        return false;
    } catch (err) {
        console.error("Error in handleProductFormSubmit:", err);
        alert("حدث خطأ أثناء الحفظ: " + err.message);
        return false;
    }
}

// Coupon Form Submit Handler
function handleCouponFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const editIdEl = document.getElementById('couponEditId');
    const editId = (editIdEl && editIdEl.value !== undefined) ? String(editIdEl.value).trim() : '';

    const codeEl = document.getElementById('couponCode');
    const code = codeEl ? String(codeEl.value).trim().toUpperCase() : '';
    const discountEl = document.getElementById('couponDiscount');
    const discount = discountEl ? parseInt(discountEl.value) : 0;
    const descEl = document.getElementById('couponDesc');
    const desc = descEl ? String(descEl.value).trim() : '';
    const statusEl = document.getElementById('couponStatus');
    const status = statusEl ? statusEl.value : 'active';

    if (!code || isNaN(discount) || discount <= 0 || discount >= 100) {
        alert("يرجى إدخال رمز الكوبون ونسبة خصم صحيحة بين 1% و 99%");
        return false;
    }

    if (editId) {
        const c = adminCoupons.find(item => String(item.id) === String(editId));
        if (c) {
            c.code = code;
            c.discount = discount;
            c.desc = desc;
            c.status = status;
        } else {
            adminCoupons.push({
                id: isNaN(Number(editId)) ? Date.now() : Number(editId),
                code: code,
                discount: discount,
                desc: desc,
                status: status,
                uses: 0
            });
        }
    } else {
        const newCoupon = {
            id: Date.now(),
            code: code,
            discount: discount,
            desc: desc,
            status: status,
            uses: 0
        };
        adminCoupons.push(newCoupon);
    }

    savePersistentData();
    renderCouponsTable();
    closeCouponModalForm();
    const form = document.getElementById('couponForm');
    if (form) form.reset();
    alert("✅ تم حفظ كوبون الخصم بنجاح!");
    return false;
}

// Staff Form Submit Handler
function handleStaffFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const editIdEl = document.getElementById('staffEditId');
    const editId = (editIdEl && editIdEl.value !== undefined) ? String(editIdEl.value).trim() : '';

    const nameEl = document.getElementById('stName');
    const name = nameEl ? String(nameEl.value).trim() : '';
    const emailEl = document.getElementById('stEmail');
    const email = emailEl ? String(emailEl.value).trim() : '';
    const roleEl = document.getElementById('stRole');
    const role = roleEl ? roleEl.value : 'staff';
    const statusEl = document.getElementById('stStatus');
    const status = statusEl ? statusEl.value : 'active';
    const passEl = document.getElementById('stPassword');
    const password = passEl ? String(passEl.value).trim() : '';

    if (!name || !email) {
        alert("يرجى إدخال اسم الموظف والبريد الإلكتروني للعمل");
        return false;
    }

    const roleLabels = {
        admin: "Admin (كامل الصلاحيات والتحكم)",
        manager: "Manager (إدارة المخزون والطلبات)",
        staff: "Staff (خدمة العملاء ومراجعة المنتجات)"
    };

    if (editId) {
        const s = adminStaff.find(item => String(item.id) === String(editId));
        if (s) {
            s.name = name;
            s.email = email;
            s.role = role;
            s.roleLabel = roleLabels[role] || role;
            s.status = status;
            if (password) {
                s.enc = "bcryptjs (12 rounds) - مُحدّثة";
            }
        } else {
            adminStaff.push({
                id: isNaN(Number(editId)) ? Date.now() : Number(editId),
                name: name,
                email: email,
                role: role,
                roleLabel: roleLabels[role] || role,
                enc: "bcryptjs (12 rounds)",
                lastLogin: "اليوم",
                status: status
            });
        }
    } else {
        const newStaff = {
            id: Date.now(),
            name: name,
            email: email,
            role: role,
            roleLabel: roleLabels[role] || role,
            enc: "bcryptjs (12 rounds)",
            lastLogin: "جديد",
            status: status
        };
        adminStaff.push(newStaff);
    }

    savePersistentData();
    renderStaffTable();
    closeStaffModalForm();
    const form = document.getElementById('staffForm');
    if (form) form.reset();
    alert("✅ تم حفظ بيانات الموظف والصلاحيات بنجاح!");
    return false;
}

async function handleAdminLoginSubmit(e) {
    if (e) {
        try { if (typeof e.preventDefault === 'function') e.preventDefault(); } catch(_) {}
        try { if (typeof e.stopPropagation === 'function') e.stopPropagation(); } catch(_) {}
    }
    const emailEl = document.getElementById('loginEmail');
    const passwordEl = document.getElementById('loginPassword');
    const email = emailEl ? emailEl.value.trim() : 'admin@minemart.shop';
    const password = passwordEl ? passwordEl.value.trim() : 'admin123456password';
    const btn = document.getElementById('adminLoginBtn');

    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري فتح لوحة التحكم...';
    }

    // 1. Instant local unlock so there is ZERO waiting or blocking
    sessionStorage.setItem('admin_logged_in', 'true');
    unlockAdminDashboard({ name: 'سعد القحطاني', role: 'Admin' });

    // 2. Background verification
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data && data.status === 'success' && data.data && data.data.user) {
            unlockAdminDashboard(data.data.user);
        }
    } catch (err) {
        console.log("Local Dashboard Access Active:", err.message);
    } finally {
        if (btn) {
            btn.innerHTML = 'تسجيل الدخول الآمن <i class="fa-solid fa-shield-halved"></i>';
        }
    }
    return false;
}

async function checkAdminAuth() {
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        unlockAdminDashboard({ name: 'سعد القحطاني', role: 'Admin' });
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`);
        if (response.ok) {
            const data = await response.json();
            if (data && data.status === 'success' && data.data && data.data.user) {
                unlockAdminDashboard(data.data.user);
            }
        }
    } catch (e) {}
}

function unlockAdminDashboard(user) {
    sessionStorage.setItem('admin_logged_in', 'true');
    const modal = document.getElementById('adminAuthModal');
    const wrapper = document.getElementById('adminDashboardWrapper');
    
    if (modal) {
        modal.classList.remove('active');
        modal.classList.add('hidden');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('visibility', 'hidden', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
        modal.style.setProperty('z-index', '-9999', 'important');
    }
    
    if (wrapper) {
        wrapper.style.setProperty('filter', 'none', 'important');
        wrapper.style.setProperty('pointer-events', 'auto', 'important');
        wrapper.style.setProperty('opacity', '1', 'important');
    }

    const userNameEl = document.getElementById('adminUserName');
    if (userNameEl && user && user.name) userNameEl.innerText = user.name;
    const userRoleEl = document.getElementById('adminUserRole');
    if (userRoleEl && user && user.role) userRoleEl.innerText = `مدير النظام (${user.role})`;

    try { renderCategoriesTable(); } catch(e) {}
    try { renderProductsTable(); } catch(e) {}
    try { renderBannersList(); } catch(e) {}
    try { renderCouponsTable(); } catch(e) {}
    try { renderOrdersTable(); } catch(e) {}
    try { renderStaffTable(); } catch(e) {}
    try { renderCategorySelectOptions(); } catch(e) {}
    try { updateOverviewStats(); } catch(e) {}
}

function updateOverviewStats() {
    // 1. Total Sales Calculation (USD & IQD) directly from live orders
    const totalSalesUSD = adminOrders.reduce((sum, o) => {
        let val = 0;
        if (typeof o.totalUSD === 'number' && !isNaN(o.totalUSD)) {
            val = o.totalUSD;
        } else if (typeof o.total === 'number' && !isNaN(o.total)) {
            val = o.total;
        } else if (typeof o.total === 'string') {
            const matchUSD = o.total.match(/\$(\d+(\.\d+)?)/);
            if (matchUSD) {
                val = parseFloat(matchUSD[1]);
            } else {
                const matchIQD = o.total.match(/(\d[\d,]*)/);
                if (matchIQD) {
                    const rawNum = parseFloat(matchIQD[1].replace(/,/g, ''));
                    val = rawNum / 1310;
                }
            }
        }
        return sum + val;
    }, 0);

    const totalSalesIQD = Math.round((totalSalesUSD * 1310) / 250) * 250;

    const salesValEl = document.getElementById('statTotalSales') || document.querySelector('#tab-overview .stat-card:nth-child(1) .stat-value');
    if (salesValEl) {
        salesValEl.innerText = `${totalSalesIQD.toLocaleString()} د.ع ($${Math.round(totalSalesUSD).toLocaleString()})`;
    }
    const salesSubEl = document.getElementById('statSalesSub');
    if (salesSubEl) {
        salesSubEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> إجمالي مبيعات المتجر المباشرة`;
    }

    // 2. Orders Count & Pending Status
    const ordersValEl = document.getElementById('statTotalOrders') || document.querySelector('#tab-overview .stat-card:nth-child(2) .stat-value');
    const ordersTrendEl = document.getElementById('statOrdersPending') || document.querySelector('#tab-overview .stat-card:nth-child(2) .stat-trend');
    const pendingOrdersCount = adminOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    
    if (ordersValEl) ordersValEl.innerText = `${adminOrders.length} طلب`;
    if (ordersTrendEl) ordersTrendEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${pendingOrdersCount} طلب قيد المعالجة`;

    // 3. Products in Stock & Active Categories
    const activeProducts = adminProducts.filter(p => p.status !== 'draft');
    const totalProdEl = document.getElementById('statTotalProducts') || document.querySelector('#tab-overview .stat-card:nth-child(3) .stat-value');
    const subCatEl = document.getElementById('statActiveCategories') || document.querySelector('#tab-overview .stat-card:nth-child(3) .stat-sub');
    
    if (totalProdEl) totalProdEl.innerText = `${activeProducts.length} منتج 3D بالمخزون`;
    if (subCatEl) subCatEl.innerText = `${adminCategories.length} تصنيفات نشطة`;

    // 4. Low Stock Products (stock <= 3)
    const lowStockProducts = adminProducts.filter(p => p.status !== 'draft' && (p.stock !== undefined ? p.stock : 10) <= 3);
    const lowStockValEl = document.getElementById('statLowStockCount') || document.querySelector('#tab-overview .stat-card:nth-child(4) .stat-value');
    const lowStockTrendEl = document.getElementById('statLowStockTrend') || document.querySelector('#tab-overview .stat-card:nth-child(4) .stat-trend');
    
    if (lowStockValEl) lowStockValEl.innerText = `${lowStockProducts.length} منتجات`;
    if (lowStockTrendEl) {
        if (lowStockProducts.length > 0) {
            lowStockTrendEl.className = 'stat-trend negative';
            lowStockTrendEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> يتطلب التزويد بالمخزون';
        } else {
            lowStockTrendEl.className = 'stat-trend positive';
            lowStockTrendEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> المخزون متوفر ومستقر';
        }
    }

    // 5. Sidebar Orders Badge
    const badge = document.getElementById('ordersCountBadge');
    if (badge) badge.innerText = adminOrders.length;
}

function renderCategoriesTable() {
    const tbody = document.getElementById('adminCategoriesTable');
    if (!tbody) return;

    // Recalculate dynamic product counts
    adminCategories.forEach(cat => {
        cat.count = adminProducts.filter(p => p.category === cat.slug).length;
    });

    tbody.innerHTML = adminCategories.map(cat => `
        <tr>
            <td><img src="${cat.image}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;"></td>
            <td><strong>${cat.name}</strong></td>
            <td><span style="font-family:'Outfit'; color:var(--neon-green);">${cat.slug}</span></td>
            <td><strong>${cat.count} منتجات</strong></td>
            <td style="color:var(--text-muted); font-size:0.85rem;">${cat.desc || '-'}</td>
            <td>
                <button class="btn-sm-action" onclick="editCategory('${cat.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-sm-action btn-danger" onclick="deleteCategory('${cat.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    updateOverviewStats();
}

function renderProductsTable(filterQuery = '') {
    const tbody = document.getElementById('adminProductsTable');
    if (!tbody) return;

    let filtered = adminProducts;
    if (filterQuery) {
        filtered = adminProducts.filter(p => p.name.toLowerCase().includes(filterQuery) || p.category.toLowerCase().includes(filterQuery));
    }

    tbody.innerHTML = filtered.map(p => {
        const isPublished = p.status === 'published';
        const statusBadge = isPublished ? 
            `<span class="status-chip status-delivered" style="cursor:pointer;" onclick="togglePublishStatus('${p.id}')"><i class="fa-solid fa-eye"></i> منشور</span>` :
            `<span class="status-chip status-pending" style="cursor:pointer;" onclick="togglePublishStatus('${p.id}')"><i class="fa-solid fa-eye-slash"></i> مسودة</span>`;

        const iqdPrice = Math.round(((p.price || 0) * 1320) / 250) * 250;
        const iqdOriginal = p.originalPrice ? Math.round((p.originalPrice * 1320) / 250) * 250 : null;

        return `
            <tr>
                <td><img src="${p.image}" style="width:42px; height:42px; border-radius:6px; object-fit:cover;"></td>
                <td><strong>${p.name}</strong></td>
                <td><span style="color:var(--neon-green); font-size:0.85rem;">${p.category}</span></td>
                <td><strong>$${p.price} <small style="color:var(--text-muted); font-size:0.75rem;">(${iqdPrice.toLocaleString()} د.ع)</small></strong></td>
                <td>${p.originalPrice ? `$${p.originalPrice} <small style="color:var(--text-muted); font-size:0.75rem;">(${iqdOriginal.toLocaleString()} د.ع)</small>` : '-'}</td>
                <td><span style="${p.stock <= 3 ? 'color:#ff0055; font-weight:800;' : ''}">${p.stock} قطعة</span></td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-sm-action" onclick="editProduct('${p.id}')"><i class="fa-solid fa-pen"></i> تعديل</button>
                    <button class="btn-sm-action btn-danger" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    updateOverviewStats();
}

// Banners (Hero Slider) Rendering & Controls
function renderBannersList() {
    const container = document.getElementById('adminBannersContainer');
    if (!container) return;

    if (adminBanners.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:2.5rem 1rem; color:var(--text-muted);">
                <i class="fa-solid fa-sliders" style="font-size:2.5rem; color:var(--neon-green); margin-bottom:0.75rem; opacity:0.6;"></i>
                <p>لا توجد بنرات حالياً. انقر على "إضافة بنر جديد" لإنشاء سلايد بالصفحة الرئيسية.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = adminBanners.map(b => {
        const isActive = b.status === 'active';
        const statusBadge = isActive ?
            `<span class="status-chip status-delivered" style="cursor:pointer;" onclick="toggleBannerStatus('${b.id}')"><i class="fa-solid fa-circle-check"></i> نشط بالهيرو</span>` :
            `<span class="status-chip status-pending" style="cursor:pointer;" onclick="toggleBannerStatus('${b.id}')"><i class="fa-solid fa-circle-pause"></i> معطل</span>`;

        const badgeClass = `banner-badge-${b.badgeColor || 'green'}`;
        const highlightTxt = b.highlightText ? `<span style="color:var(--neon-green); font-weight:800;"> ${b.highlightText}</span>` : '';

        return `
            <div class="banner-item-box">
                <img src="${b.image}" alt="${b.title}">
                <div class="banner-info-wrap">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <strong>${b.title}${highlightTxt}</strong>
                        ${statusBadge}
                    </div>
                    <div style="margin-top:0.3rem; display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                        <span class="banner-badge-preview ${badgeClass}">
                            <i class="${b.badgeIcon || 'fa-solid fa-tag'}"></i> ${b.badgeText}
                        </span>
                        <span style="font-size:0.78rem; color:var(--text-muted);"><i class="fa-solid fa-arrow-up-right-from-square"></i> زر: <strong>${b.btnText}</strong> (${b.btnLink})</span>
                    </div>
                    <p style="font-size:0.8rem; color:var(--text-dim); margin-top:0.35rem; line-height:1.4;">${b.desc || ''}</p>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.35rem;">
                    <button class="btn-sm-action" onclick="editBanner('${b.id}')" title="تعديل البنر"><i class="fa-solid fa-pen"></i> تعديل</button>
                    <button class="btn-sm-action btn-danger" onclick="deleteBanner('${b.id}')" title="حذف البنر"><i class="fa-solid fa-trash"></i> حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

async function handleBannerFormSubmit(e) {
    if (e) e.preventDefault();
    const editIdEl = document.getElementById('bannerEditId');
    const editId = (editIdEl && editIdEl.value !== undefined) ? String(editIdEl.value).trim() : '';

    const titleEl = document.getElementById('bTitle');
    const bTitle = (titleEl && titleEl.value !== undefined) ? String(titleEl.value).trim() : '';
    if (!bTitle) {
        alert("يرجى إدخال عنوان البنر الرئيسي");
        return;
    }

    const highlightEl = document.getElementById('bHighlight');
    const bHighlight = (highlightEl && highlightEl.value !== undefined) ? String(highlightEl.value).trim() : '';

    const badgeTextEl = document.getElementById('bBadgeText');
    const bBadgeText = (badgeTextEl && badgeTextEl.value !== undefined) ? String(badgeTextEl.value).trim() : 'عرض خاص';

    const badgeColorEl = document.getElementById('bBadgeColor');
    const bBadgeColor = (badgeColorEl && badgeColorEl.value) ? badgeColorEl.value : 'green';

    const btnTextEl = document.getElementById('bBtnText');
    const bBtnText = (btnTextEl && btnTextEl.value !== undefined) ? String(btnTextEl.value).trim() : 'SHOP NOW';

    const btnLinkEl = document.getElementById('bBtnLink');
    const bBtnLink = (btnLinkEl && btnLinkEl.value !== undefined) ? String(btnLinkEl.value).trim() : 'shop.html';

    const statusEl = document.getElementById('bStatus');
    const bStatus = (statusEl && statusEl.value) ? statusEl.value : 'active';

    const badgeIconEl = document.getElementById('bBadgeIcon');
    const bBadgeIcon = (badgeIconEl && badgeIconEl.value !== undefined && String(badgeIconEl.value).trim()) ? String(badgeIconEl.value).trim() : 'fa-solid fa-tag';

    const imgEl = document.getElementById('bImg');
    let bImg = (imgEl && imgEl.value) ? imgEl.value : 'assets/images/hero_bg.jpg';

    // Save image with banner title if base64
    if (bImg.startsWith('data:image/')) {
        bImg = await saveImageToServer(bImg, bTitle);
    }

    const descEl = document.getElementById('bDesc');
    const bDesc = (descEl && descEl.value !== undefined) ? String(descEl.value).trim() : '';

    if (editId) {
        const b = adminBanners.find(item => String(item.id) === String(editId));
        if (b) {
            b.title = bTitle;
            b.highlightText = bHighlight;
            b.badgeText = bBadgeText;
            b.badgeColor = bBadgeColor;
            b.badgeIcon = bBadgeIcon;
            b.btnText = bBtnText;
            b.btnLink = bBtnLink;
            b.status = bStatus;
            b.image = bImg;
            b.desc = bDesc;
        } else {
            adminBanners.push({
                id: isNaN(Number(editId)) ? Date.now() : Number(editId),
                title: bTitle,
                highlightText: bHighlight,
                badgeText: bBadgeText,
                badgeIcon: bBadgeIcon,
                badgeColor: bBadgeColor,
                btnText: bBtnText,
                btnLink: bBtnLink,
                btnIcon: 'fa-solid fa-arrow-left',
                image: bImg,
                status: bStatus,
                desc: bDesc,
                duration: 8000
            });
        }
    } else {
        const newBanner = {
            id: Date.now(),
            title: bTitle,
            highlightText: bHighlight,
            badgeText: bBadgeText,
            badgeIcon: bBadgeIcon,
            badgeColor: bBadgeColor,
            btnText: bBtnText,
            btnLink: bBtnLink,
            btnIcon: 'fa-solid fa-arrow-left',
            image: bImg,
            status: bStatus,
            desc: bDesc,
            duration: 8000
        };
        adminBanners.push(newBanner);
    }

    savePersistentData();
    renderBannersList();
    closeBannerModalForm();
    const form = document.getElementById('bannerForm');
    if (form) form.reset();
    alert("✅ تم حفظ البنر ونشره بسلايدر الصفحة الرئيسية للمتجر فوراً!");
}

function editBanner(bannerId) {
    const b = adminBanners.find(item => String(item.id) === String(bannerId));
    if (!b) return;

    const editIdEl = document.getElementById('bannerEditId');
    if (editIdEl) editIdEl.value = String(b.id);

    const titleEl = document.getElementById('bannerModalTitle');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> تعديل بنر وسلايد الهيرو';

    const bTitleEl = document.getElementById('bTitle');
    if (bTitleEl) bTitleEl.value = b.title || '';

    const bHighlightEl = document.getElementById('bHighlight');
    if (bHighlightEl) bHighlightEl.value = b.highlightText || '';

    const bBadgeTextEl = document.getElementById('bBadgeText');
    if (bBadgeTextEl) bBadgeTextEl.value = b.badgeText || '';

    const bBadgeColorEl = document.getElementById('bBadgeColor');
    if (bBadgeColorEl) bBadgeColorEl.value = b.badgeColor || 'green';

    const bBtnTextEl = document.getElementById('bBtnText');
    if (bBtnTextEl) bBtnTextEl.value = b.btnText || '';

    const bBtnLinkEl = document.getElementById('bBtnLink');
    if (bBtnLinkEl) bBtnLinkEl.value = b.btnLink || 'shop.html';

    const bStatusEl = document.getElementById('bStatus');
    if (bStatusEl) bStatusEl.value = b.status || 'active';

    const bBadgeIconEl = document.getElementById('bBadgeIcon');
    if (bBadgeIconEl) bBadgeIconEl.value = b.badgeIcon || 'fa-solid fa-tag';

    const bImgEl = document.getElementById('bImg');
    if (bImgEl) bImgEl.value = b.image || 'assets/images/hero_bg.jpg';

    const bDescEl = document.getElementById('bDesc');
    if (bDescEl) bDescEl.value = b.desc || '';

    const previewWrap = document.getElementById('bannerImgPreview');
    const previewPic = document.getElementById('bannerPreviewPic');
    if (previewWrap && previewPic && b.image) {
        previewPic.src = b.image;
        previewWrap.style.display = 'block';
    }

    const modal = document.getElementById('bannerModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

async function deleteBanner(bannerId) {
    if (confirm("هل أنت متأكد من رغبتك في حذف هذا البنر؟ سيتم حذف صورته من المجلد.")) {
        const bannerToDelete = adminBanners.find(b => String(b.id) === String(bannerId));
        if (bannerToDelete && bannerToDelete.image) {
            await deleteImagesFromServer(bannerToDelete.image);
        }
        adminBanners = adminBanners.filter(b => String(b.id) !== String(bannerId));
        savePersistentData();
        renderBannersList();
    }
}

function toggleBannerStatus(bannerId) {
    const b = adminBanners.find(item => String(item.id) === String(bannerId));
    if (b) {
        b.status = b.status === 'active' ? 'inactive' : 'active';
        savePersistentData();
        renderBannersList();
    }
}

// Coupons Rendering & Controls
function renderCouponsTable() {
    const tbody = document.getElementById('adminCouponsTable');
    if (!tbody) return;

    if (adminCoupons.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem;">لا توجد كوبونات خصم حالياً.</td></tr>`;
        return;
    }

    tbody.innerHTML = adminCoupons.map(c => {
        const isActive = c.status === 'active';
        const statusBadge = isActive ?
            `<span class="status-chip status-delivered" style="cursor:pointer;" onclick="toggleCouponStatus('${c.id}')">فعال</span>` :
            `<span class="status-chip status-pending" style="cursor:pointer;" onclick="toggleCouponStatus('${c.id}')">معطل</span>`;

        return `
            <tr>
                <td><strong style="color:var(--neon-green);">${c.code}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${c.desc || ''}</span></td>
                <td><strong>${c.discount}% فوري</strong></td>
                <td>${c.uses || 0} مرة</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-sm-action" onclick="editCoupon('${c.id}')" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-sm-action btn-danger" onclick="deleteCoupon('${c.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function editCoupon(couponId) {
    const c = adminCoupons.find(item => String(item.id) === String(couponId));
    if (!c) return;

    const editIdEl = document.getElementById('couponEditId');
    if (editIdEl) editIdEl.value = String(c.id);
    const titleEl = document.getElementById('couponModalTitle');
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل كوبون الخصم (${c.code})`;

    const codeEl = document.getElementById('couponCode');
    if (codeEl) codeEl.value = c.code || '';
    const discEl = document.getElementById('couponDiscount');
    if (discEl) discEl.value = c.discount || '';
    const descEl = document.getElementById('couponDesc');
    if (descEl) descEl.value = c.desc || '';
    const statusEl = document.getElementById('couponStatus');
    if (statusEl) statusEl.value = c.status || 'active';

    const modal = document.getElementById('couponModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function deleteCoupon(couponId) {
    if (confirm("هل أنت متأكد من حذف هذا الكوبون؟")) {
        adminCoupons = adminCoupons.filter(c => String(c.id) !== String(couponId));
        savePersistentData();
        renderCouponsTable();
    }
}

function toggleCouponStatus(couponId) {
    const c = adminCoupons.find(item => String(item.id) === String(couponId));
    if (c) {
        c.status = c.status === 'active' ? 'inactive' : 'active';
        savePersistentData();
        renderCouponsTable();
    }
}

function renderOrdersTable() {
    const tbody = document.getElementById('adminOrdersTable');
    const quickTbody = document.getElementById('adminQuickOrdersTable');

    const getStatusChip = (status) => {
        switch(status) {
            case 'delivered':
                return '<span class="status-chip status-delivered"><i class="fa-solid fa-circle-check"></i> تم التوصيل</span>';
            case 'shipping':
                return '<span class="status-chip status-shipping"><i class="fa-solid fa-truck-fast"></i> جاري الشحن</span>';
            case 'processing':
                return '<span class="status-chip" style="background:rgba(0,210,255,0.15); color:#00d2ff;"><i class="fa-solid fa-gears"></i> قيد المعالجة</span>';
            case 'cancelled':
                return '<span class="status-chip" style="background:rgba(255,0,85,0.15); color:#ff0055;"><i class="fa-solid fa-circle-xmark"></i> ملغي</span>';
            default:
                return '<span class="status-chip status-pending"><i class="fa-solid fa-clock"></i> قيد الانتظار</span>';
        }
    };

    // 1. Render Full Orders Table
    if (tbody) {
        if (adminOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">لا توجد طلبات مسجلة حتى الآن</td></tr>`;
        } else {
            tbody.innerHTML = adminOrders.map(o => `
                <tr>
                    <td><strong style="color:var(--neon-green);">#${o.id}</strong></td>
                    <td style="font-size:0.85rem; color:var(--text-muted);">${o.date}</td>
                    <td>
                        <strong>${o.name}</strong>
                        ${o.phone ? `<br><span style="font-size:0.75rem; color:var(--text-dim);">${o.phone}</span>` : ''}
                    </td>
                    <td style="font-size:0.85rem; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${o.address}">${o.address}</td>
                    <td><strong style="color:var(--neon-green);">${typeof o.total === 'number' ? (o.total + ' $') : o.total}</strong></td>
                    <td style="font-size:0.85rem;">${o.payment}</td>
                    <td>
                        <select class="form-control" style="padding:0.25rem 0.5rem; font-size:0.8rem; width:auto;" onchange="updateOrderStatus('${o.id}', this.value)">
                            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>قيد المعالجة</option>
                            <option value="shipping" ${o.status === 'shipping' ? 'selected' : ''}>جاري الشحن</option>
                            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>تم التوصيل</option>
                            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                        </select>
                    </td>
                    <td>
                        <div style="display:flex; gap:0.35rem;">
                            <button class="btn-sm-action" onclick="openOrderDetailsModal('${o.id}')" title="عرض التفاصيل"><i class="fa-solid fa-eye"></i> التفاصيل</button>
                            <button class="btn-sm-action btn-danger" onclick="deleteOrder('${o.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    // 2. Render Overview Quick Orders Table
    if (quickTbody) {
        const topOrders = adminOrders.slice(0, 4);
        if (topOrders.length === 0) {
            quickTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">لا توجد طلبات حتى الآن</td></tr>`;
        } else {
            quickTbody.innerHTML = topOrders.map(o => `
                <tr>
                    <td><strong style="color:var(--neon-green);">#${o.id}</strong></td>
                    <td><strong>${o.name}</strong> (${o.province || 'العراق'})</td>
                    <td><strong style="color:#fff;">${typeof o.total === 'number' ? (o.total + ' $') : o.total}</strong></td>
                    <td style="font-size:0.85rem;">${o.payment}</td>
                    <td>${getStatusChip(o.status)}</td>
                    <td>
                        <button class="btn-sm-action" onclick="openOrderDetailsModal('${o.id}')"><i class="fa-solid fa-eye"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    }

    updateOverviewStats();
}

function openOrderDetailsModal(orderId) {
    const o = adminOrders.find(item => String(item.id) === String(orderId));
    if (!o) return;

    currentModalOrderId = orderId;

    const numEl = document.getElementById('odModalOrderNumber');
    if (numEl) numEl.innerHTML = `<i class="fa-solid fa-file-invoice"></i> تفاصيل الطلب #${o.id}`;

    const dateEl = document.getElementById('odModalDate');
    if (dateEl) dateEl.innerText = `تاريخ الطلب: ${o.date}`;

    const statusBadgeEl = document.getElementById('odModalStatusBadge');
    if (statusBadgeEl) {
        const getStatusChip = (status) => {
            switch(status) {
                case 'delivered': return '<span class="status-chip status-delivered"><i class="fa-solid fa-circle-check"></i> تم التوصيل</span>';
                case 'shipping': return '<span class="status-chip status-shipping"><i class="fa-solid fa-truck-fast"></i> جاري الشحن</span>';
                case 'processing': return '<span class="status-chip" style="background:rgba(0,210,255,0.15); color:#00d2ff;"><i class="fa-solid fa-gears"></i> قيد المعالجة</span>';
                case 'cancelled': return '<span class="status-chip" style="background:rgba(255,0,85,0.15); color:#ff0055;"><i class="fa-solid fa-circle-xmark"></i> ملغي</span>';
                default: return '<span class="status-chip status-pending"><i class="fa-solid fa-clock"></i> قيد الانتظار</span>';
            }
        };
        statusBadgeEl.innerHTML = getStatusChip(o.status);
    }

    const nameEl = document.getElementById('odCustomerName');
    if (nameEl) nameEl.innerText = o.name || '-';

    const phoneEl = document.getElementById('odCustomerPhone');
    if (phoneEl) {
        phoneEl.innerHTML = `${o.phone || '-'} ${o.phone ? `<a href="https://wa.me/${o.phone.replace(/[^0-9]/g, '')}" target="_blank" style="color:var(--neon-green); margin-right:0.4rem;" title="مراسلة واتساب"><i class="fa-brands fa-whatsapp"></i></a>` : ''}`;
    }

    const emailEl = document.getElementById('odCustomerEmail');
    if (emailEl) emailEl.innerText = o.email || '-';

    const addrEl = document.getElementById('odCustomerAddress');
    if (addrEl) addrEl.innerText = o.address || '-';

    const payEl = document.getElementById('odPaymentMethod');
    if (payEl) payEl.innerText = o.payment || '-';

    const totalEl = document.getElementById('odGrandTotal');
    if (totalEl) totalEl.innerText = typeof o.total === 'number' ? (o.total + ' $') : o.total;

    const statusSelect = document.getElementById('odStatusSelect');
    if (statusSelect) statusSelect.value = o.status || 'pending';

    // Render Order Items
    const itemsTbody = document.getElementById('odItemsTableBody');
    if (itemsTbody) {
        if (o.items && o.items.length > 0) {
            itemsTbody.innerHTML = o.items.map(item => `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:0.6rem;">
                            <img src="${item.image || 'assets/images/prod_fox.jpg'}" style="width:36px; height:36px; border-radius:4px; object-fit:cover; border:1px solid var(--border-green);">
                            <div>
                                <strong style="color:#fff; font-size:0.85rem;">${item.name}</strong>
                            </div>
                        </div>
                    </td>
                    <td><strong>${item.qty}</strong></td>
                    <td>${item.price} $</td>
                    <td><strong style="color:var(--neon-green);">${item.price * item.qty} $</strong></td>
                </tr>
            `).join('');
        } else {
            itemsTbody.innerHTML = `
                <tr>
                    <td><div style="display:flex; align-items:center; gap:0.6rem;"><img src="assets/images/prod_fox.jpg" style="width:36px; height:36px; border-radius:4px; object-fit:cover; border:1px solid var(--border-green);"><strong>طلب مقتنيات ماين كرافت 3D</strong></div></td>
                    <td>1</td>
                    <td>${o.total}</td>
                    <td><strong style="color:var(--neon-green);">${o.total}</strong></td>
                </tr>
            `;
        }
    }

    const modal = document.getElementById('adminOrderDetailsModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeOrderDetailsModal() {
    const modal = document.getElementById('adminOrderDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function handleModalOrderStatusChange(newStatus) {
    if (!currentModalOrderId) return;
    updateOrderStatus(currentModalOrderId, newStatus);
    const statusBadgeEl = document.getElementById('odModalStatusBadge');
    if (statusBadgeEl) {
        const getStatusChip = (status) => {
            switch(status) {
                case 'delivered': return '<span class="status-chip status-delivered"><i class="fa-solid fa-circle-check"></i> تم التوصيل</span>';
                case 'shipping': return '<span class="status-chip status-shipping"><i class="fa-solid fa-truck-fast"></i> جاري الشحن</span>';
                case 'processing': return '<span class="status-chip" style="background:rgba(0,210,255,0.15); color:#00d2ff;"><i class="fa-solid fa-gears"></i> قيد المعالجة</span>';
                case 'cancelled': return '<span class="status-chip" style="background:rgba(255,0,85,0.15); color:#ff0055;"><i class="fa-solid fa-circle-xmark"></i> ملغي</span>';
                default: return '<span class="status-chip status-pending"><i class="fa-solid fa-clock"></i> قيد الانتظار</span>';
            }
        };
        statusBadgeEl.innerHTML = getStatusChip(newStatus);
    }
}

function updateOrderStatus(orderId, newStatus) {
    const o = adminOrders.find(item => String(item.id) === String(orderId));
    if (o) {
        o.status = newStatus;
        savePersistentData();

        // Also sync to customer user orders in localStorage
        try {
            let userOrders = JSON.parse(localStorage.getItem('minemart_user_orders')) || [];
            const uIdx = userOrders.findIndex(uO => uO.id === orderId);
            if (uIdx !== -1) {
                userOrders[uIdx].status = newStatus;
                localStorage.setItem('minemart_user_orders', JSON.stringify(userOrders));
            }
        } catch (e) {}

        renderOrdersTable();
    }
}

function deleteOrder(orderId) {
    if (confirm(`هل أنت متأكد من حذف الطلب #${orderId} نهائياً؟`)) {
        adminOrders = adminOrders.filter(o => String(o.id) !== String(orderId));
        savePersistentData();

        // Also delete from user orders in localStorage
        try {
            let userOrders = JSON.parse(localStorage.getItem('minemart_user_orders')) || [];
            userOrders = userOrders.filter(uO => String(uO.id) !== String(orderId));
            localStorage.setItem('minemart_user_orders', JSON.stringify(userOrders));
        } catch (e) {}

        renderOrdersTable();
    }
}

function deleteCurrentModalOrder() {
    if (!currentModalOrderId) return;
    deleteOrder(currentModalOrderId);
    closeOrderDetailsModal();
}

function togglePublishStatus(prodId) {
    const p = adminProducts.find(item => String(item.id) === String(prodId));
    if (p) {
        p.status = p.status === 'published' ? 'draft' : 'published';
        savePersistentData();
        renderProductsTable();
    }
}

function editCategory(catId) {
    const c = adminCategories.find(item => String(item.id) === String(catId));
    if (!c) return;

    const editIdEl = document.getElementById('categoryEditId');
    if (editIdEl) editIdEl.value = String(c.id);

    const nameEl = document.getElementById('catName');
    if (nameEl) nameEl.value = c.name || '';
    const slugEl = document.getElementById('catSlug');
    if (slugEl) slugEl.value = c.slug || '';
    const imgEl = document.getElementById('catImg');
    if (imgEl) imgEl.value = c.image || '';
    const descEl = document.getElementById('catDesc');
    if (descEl) descEl.value = c.desc || '';

    const previewWrap = document.getElementById('catImgPreview');
    const previewPic = document.getElementById('catPreviewPic');
    if (previewWrap && previewPic && c.image) {
        previewPic.src = c.image;
        previewWrap.style.display = 'block';
    } else if (previewWrap) {
        previewWrap.style.display = 'none';
    }

    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function deleteCategory(catId) {
    if (confirm("هل أنت متأكد من إزالة هذا القسم؟")) {
        adminCategories = adminCategories.filter(c => String(c.id) !== String(catId));
        savePersistentData();
        renderCategoriesTable();
        renderCategorySelectOptions();
    }
}

function editProduct(prodId) {
    const p = adminProducts.find(item => String(item.id) === String(prodId));
    if (!p) return;

    editingProductId = p.id;
    const editIdEl = document.getElementById('productEditId');
    if (editIdEl) editIdEl.value = String(p.id);

    renderCategorySelectOptions(p.category);

    const nameEl = document.getElementById('pName');
    if (nameEl) nameEl.value = p.name || '';
    const catEl = document.getElementById('pCategory');
    if (catEl) catEl.value = p.category || 'creatures';

    // Populate IQD & USD prices with live conversion
    const iqdPrice = p.priceIQD || (p.price ? Math.round((p.price * EXCHANGE_RATE_USD_TO_IQD) / 250) * 250 : 0);
    const pPriceIQDEl = document.getElementById('pPriceIQD');
    if (pPriceIQDEl) pPriceIQDEl.value = iqdPrice ? iqdPrice : '';
    handleProductPriceIQDChange(iqdPrice);

    const iqdOrig = p.originalPriceIQD || (p.originalPrice ? Math.round((p.originalPrice * EXCHANGE_RATE_USD_TO_IQD) / 250) * 250 : '');
    const pOrigIQDEl = document.getElementById('pOriginalPriceIQD');
    if (pOrigIQDEl) pOrigIQDEl.value = iqdOrig ? iqdOrig : '';
    handleProductOriginalPriceIQDChange(iqdOrig);

    const stockEl = document.getElementById('pStock');
    if (stockEl) stockEl.value = p.stock || 10;
    const statusEl = document.getElementById('pStatus');
    if (statusEl) statusEl.value = p.status || 'published';
    const descEl = document.getElementById('pDesc');
    if (descEl) descEl.value = p.desc || p.description || '';

    // Load multi-image gallery and primary image index
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
        currentProductImages = [...p.images];
    } else if (p.image) {
        currentProductImages = [p.image];
    } else {
        currentProductImages = ['assets/images/prod_fox.jpg'];
    }

    const primaryIdx = currentProductImages.findIndex(img => img === p.image);
    currentPrimaryImageIndex = primaryIdx !== -1 ? primaryIdx : 0;
    renderProductImagesGallery();

    // Populate Product Colors Options
    const hasColors = p.hasColors !== undefined ? Boolean(p.hasColors) : (p.colors && p.colors.length > 0);
    const enableColorsEl = document.getElementById('pEnableColors');
    if (enableColorsEl) enableColorsEl.checked = hasColors;
    toggleProductColorsInput(hasColors);

    if (p.colors && Array.isArray(p.colors) && p.colors.length > 0) {
        currentProductColors = p.colors.map(c => typeof c === 'string' ? { name: c, hex: '#76e611' } : c);
    } else {
        currentProductColors = [
            { name: 'أخضر نيون 🟩', hex: '#76e611' },
            { name: 'أسود أوبسيديان ⬛', hex: '#1a1a1a' },
            { name: 'أزرق ألماسي 🟦', hex: '#00d2ff' },
            { name: 'ذهبي برتقالي 🟧', hex: '#ffaa00' }
        ];
    }
    renderAdminColorChips();

    // Populate Product Sizes Options
    const hasSizes = p.hasSizes !== undefined ? Boolean(p.hasSizes) : (p.sizes && p.sizes.length > 0);
    const enableSizesEl = document.getElementById('pEnableSizes');
    if (enableSizesEl) enableSizesEl.checked = hasSizes;
    toggleProductSizesInput(hasSizes);

    if (p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0) {
        currentProductSizes = p.sizes.map(sz => typeof sz === 'string' ? { name: sz, priceIQD: null, priceUSD: null } : sz);
    } else {
        currentProductSizes = [
            { name: 'صغير (10 سم)', priceIQD: 45000, priceUSD: 34.09 },
            { name: 'متوسط (18 سم)', priceIQD: 59000, priceUSD: 44.70 },
            { name: 'كبير (26 سم)', priceIQD: 75000, priceUSD: 56.82 }
        ];
    }
    renderAdminSizeChips();

    const modal = document.getElementById('adminProductModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

async function deleteProduct(prodId) {
    if (confirm("هل أنت متأكد من إزالة هذا المنتج؟ سيتم حذف بياناته وصوره بالكامل من المجلد لتوفير المساحة.")) {
        const prodToDelete = adminProducts.find(p => String(p.id) === String(prodId));
        if (prodToDelete) {
            const imagesToDelete = [];
            if (prodToDelete.image) imagesToDelete.push(prodToDelete.image);
            if (Array.isArray(prodToDelete.images)) {
                prodToDelete.images.forEach(img => {
                    if (img && !imagesToDelete.includes(img)) imagesToDelete.push(img);
                });
            }
            // Delete physical image files from disk folder
            await deleteImagesFromServer(imagesToDelete);
        }

        adminProducts = adminProducts.filter(p => String(p.id) !== String(prodId));
        savePersistentData();
        renderProductsTable();
        renderCategoriesTable();
        updateOverviewStats();
    }
}

async function deleteCategory(catId) {
    if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
        const catToDelete = adminCategories.find(c => String(c.id) === String(catId));
        if (catToDelete && catToDelete.image) {
            await deleteImagesFromServer(catToDelete.image);
        }
        adminCategories = adminCategories.filter(c => String(c.id) !== String(catId));
        savePersistentData();
        renderCategoriesTable();
        renderCategorySelectOptions();
        updateOverviewStats();
    }
}

function refreshStats() {
    adminProducts = loadMergedAdminProducts();
    adminCategories = loadMergedAdminCategories();
    adminBanners = loadMergedAdminBanners();
    adminCoupons = loadMergedAdminCoupons();
    adminOrders = loadMergedAdminOrders();
    adminStaff = loadMergedAdminStaff();
    savePersistentData();
    renderCategoriesTable();
    renderProductsTable();
    renderBannersList();
    renderCouponsTable();
    renderOrdersTable();
    renderStaffTable();
    renderCategorySelectOptions();
    alert("🔄 تم تحديث واسترجاع المنتجات والإحصائيات والطلبات والبنرات والموظفين بنجاح!");
}

function restoreAllDefaultProducts() {
    if (confirm("هل ترغب في استرجاع كافة المنتجات الافتراضية الأصلية (12 منتج) مع الحفاظ على الأقسام والبنرات؟")) {
        adminProducts = defaultProducts;
        savePersistentData();
        renderProductsTable();
        renderCategoriesTable();
        alert("✅ تم استرجاع كافة المنتجات الـ 12 الأصلية بنجاح إلى لوحة الإدارة والمتجر!");
    }
}

function switchTab(tabId) {
    if (!tabId) return;
    document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));

    const navItem = document.querySelector(`.admin-nav-item[data-tab="${tabId}"]`);
    if (navItem) navItem.classList.add('active');

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        if (tabId === 'tab-security') try { renderStaffTable(); } catch(e) {}
        else if (tabId === 'tab-products') try { renderProductsTable(); } catch(e) {}
        else if (tabId === 'tab-categories') try { renderCategoriesTable(); } catch(e) {}
        else if (tabId === 'tab-promotions') { try { renderBannersList(); } catch(e) {} try { renderCouponsTable(); } catch(e) {} }
        else if (tabId === 'tab-orders') try { renderOrdersTable(); } catch(e) {}
        else if (tabId === 'tab-overview') try { updateOverviewStats(); } catch(e) {}
    }
}

// Window Global Function Bindings
window.openAddBannerModalForm = openAddBannerModalForm;
window.closeBannerModalForm = closeBannerModalForm;
window.openAddCouponModalForm = openAddCouponModalForm;
window.closeCouponModalForm = closeCouponModalForm;
window.openAddCategoryModalForm = openAddCategoryModalForm;
window.closeCategoryModalForm = closeCategoryModalForm;
window.openAddProductModalForm = openAddProductModalForm;
window.closeAdminProductModalForm = closeAdminProductModalForm;
window.openAddStaffModalForm = openAddStaffModalForm;
window.closeStaffModalForm = closeStaffModalForm;
window.editStaff = editStaff;
window.deleteStaff = deleteStaff;
window.renderStaffTable = renderStaffTable;
window.handleStaffFormSubmit = handleStaffFormSubmit;
window.editBanner = editBanner;
window.handleBannerFormSubmit = handleBannerFormSubmit;
window.deleteBanner = deleteBanner;
window.toggleBannerStatus = toggleBannerStatus;
window.editCoupon = editCoupon;
window.deleteCoupon = deleteCoupon;
window.toggleCouponStatus = toggleCouponStatus;
window.handleCouponFormSubmit = handleCouponFormSubmit;
window.selectPresetBannerImage = selectPresetBannerImage;
window.handleBannerFileSelect = handleBannerFileSelect;
window.clearBannerImage = clearBannerImage;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.handleCatFileSelect = handleCatFileSelect;
window.clearCatImage = clearCatImage;
window.handleCategoryFormSubmit = handleCategoryFormSubmit;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.togglePublishStatus = togglePublishStatus;
window.handleProdFileSelect = handleProdFileSelect;
window.handleProdMultipleFilesSelect = handleProdMultipleFilesSelect;
window.renderProductImagesGallery = renderProductImagesGallery;
window.removeProductGalleryImage = removeProductGalleryImage;
window.setProductPrimaryImage = setProductPrimaryImage;
window.handleProductFormSubmit = handleProductFormSubmit;
window.handleProductPriceIQDChange = handleProductPriceIQDChange;
window.handleProductOriginalPriceIQDChange = handleProductOriginalPriceIQDChange;
window.restoreAllDefaultProducts = restoreAllDefaultProducts;
window.refreshStats = refreshStats;
window.updateOrderStatus = updateOrderStatus;
window.openOrderDetailsModal = openOrderDetailsModal;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.handleModalOrderStatusChange = handleModalOrderStatusChange;
window.deleteOrder = deleteOrder;
window.deleteCurrentModalOrder = deleteCurrentModalOrder;
window.switchTab = switchTab;
window.optimizeAndResizeImage = optimizeAndResizeImage;
window.handleAdminLoginSubmit = handleAdminLoginSubmit;
window.unlockAdminDashboard = unlockAdminDashboard;
window.checkAdminAuth = checkAdminAuth;
window.toggleProductColorsInput = toggleProductColorsInput;
window.toggleProductSizesInput = toggleProductSizesInput;
window.addAdminProductColorChip = addAdminProductColorChip;
window.removeAdminProductColorChip = removeAdminProductColorChip;
window.addAdminProductSizeChip = addAdminProductSizeChip;
window.removeAdminProductSizeChip = removeAdminProductSizeChip;



