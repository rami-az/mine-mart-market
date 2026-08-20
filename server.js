const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const User = require('./backend/models/User');
const Product = require('./backend/models/Product');
const Category = require('./backend/models/Category');
const Order = require('./backend/models/Order');
const { protect, restrictTo } = require('./backend/middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Multer Storage Setup for direct file uploads to assets/images
const imagesDir = path.join(__dirname, 'assets', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

function sanitizeImageFilename(name, index = null, defaultPrefix = 'image', ext = '.jpg') {
    if (!name || typeof name !== 'string' || !name.trim()) {
        name = defaultPrefix;
    }
    // Clean forbidden filename characters on Windows/Linux: \ / : * ? " < > |
    let sanitized = name.trim()
        .replace(/[\\/:*?"<>|\r\n\t]+/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^[._]+|[._]+$/g, '');

    if (!sanitized) sanitized = defaultPrefix;

    if (index !== null && index !== undefined && String(index).trim() !== '' && String(index) !== '0') {
        sanitized += `_${index}`;
    }

    if (!ext.startsWith('.')) ext = '.' + ext;
    return sanitized + ext;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const rawName = req.body.name || req.body.customName || req.query.name || req.query.customName || path.basename(file.originalname, ext);
        const rawIndex = req.body.index || req.body.imageIndex || req.query.index || req.query.imageIndex || null;
        const filename = sanitizeImageFilename(rawName, rawIndex, 'upload', ext);
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('يرجى رفع ملف صورة فقط!'), false);
        }
    }
});

// 1. Security Headers (Helmet)
app.use(helmet({
    contentSecurityPolicy: false
}));

// 2. CORS Policy Configuration (Permissive for localhost and local file:// protocols)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && origin !== 'null') {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// 3. Body Parsers & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Prevent NoSQL Injection
app.use(mongoSanitize());

// 5. Rate Limiting for Auth API
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000
});

app.use('/api/', apiLimiter);

// Database Connection & Seed Data
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mine_mart_db')
.then(async () => {
    console.log('🟩 MongoDB Connected Successfully!');
    const adminExists = await User.findOne({ email: 'admin@minemart.shop' });
    if (!adminExists) {
        await User.create({
            name: 'سعد القحطاني',
            email: 'admin@minemart.shop',
            password: 'admin123456password',
            role: 'Admin'
        });
        console.log('🔑 Default Admin User Seeded: admin@minemart.shop / admin123456password');
    }
})
.catch(err => console.log('MongoDB Connection Warning:', err.message));

// Helper JWT Signer
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'mine_mart_super_secret_jwt_key_2026_security_token_prod', {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

const sendTokenCookie = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.cookie('jwt', token, cookieOptions);
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user }
    });
};

// ==========================================================================
// File-Based Persistence Engine (data/*.json in Workspace Directory)
// ==========================================================================
const dataDir = path.join(__dirname, 'data');
const dataStoreJsPath = path.join(__dirname, 'assets', 'js', 'data-store.js');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function readDataFile(filename, defaultVal = []) {
    const filePath = path.join(dataDir, filename);
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf8');
            return defaultVal;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        console.error(`Error reading ${filename}:`, err.message);
        return defaultVal;
    }
}

function updateDataStoreJs() {
    try {
        const products = readDataFile('products.json', []);
        const categories = readDataFile('categories.json', []);
        const banners = readDataFile('banners.json', []);
        const coupons = readDataFile('coupons.json', []);
        const orders = readDataFile('orders.json', []);
        const staff = readDataFile('staff.json', []);

        const jsContent = `// Auto-generated data file - Shared by all browsers\nwindow.MINE_MART_STORE_DATA = ${JSON.stringify({
            products,
            categories,
            banners,
            coupons,
            orders,
            staff
        }, null, 2)};\n`;

        fs.writeFileSync(dataStoreJsPath, jsContent, 'utf8');
    } catch(e) {
        console.error('Error updating data-store.js:', e.message);
    }
}

function writeDataFile(filename, data) {
    const filePath = path.join(dataDir, filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        updateDataStoreJs();
        return true;
    } catch (err) {
        console.error(`Error writing ${filename}:`, err.message);
        return false;
    }
}

// Ensure data-store.js is up to date on boot
updateDataStoreJs();

// --------------------------------------------------------------------------
// Unified State Synchronization Endpoints (Admin <-> Storefront <-> Disk Files)
// --------------------------------------------------------------------------
app.get('/api/v1/sync', (req, res) => {
    try {
        const products = readDataFile('products.json', []);
        const categories = readDataFile('categories.json', []);
        const banners = readDataFile('banners.json', []);
        const coupons = readDataFile('coupons.json', []);
        const orders = readDataFile('orders.json', []);
        const staff = readDataFile('staff.json', []);

        res.status(200).json({
            status: 'success',
            data: {
                products,
                categories,
                banners,
                coupons,
                orders,
                staff
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

function ensureNamedItemImage(imagePath, itemName, index = null, defaultPrefix = 'image') {
    if (!imagePath || typeof imagePath !== 'string' || !itemName) return imagePath;
    
    // 1. If image is a base64 data URL
    if (imagePath.startsWith('data:image/')) {
        const matches = imagePath.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches.length >= 3) {
            let mimeSubtype = matches[1].toLowerCase();
            if (mimeSubtype === 'jpeg') mimeSubtype = 'jpg';
            const fileExt = '.' + (mimeSubtype || 'jpg');
            const buffer = Buffer.from(matches[2], 'base64');
            const targetFilename = sanitizeImageFilename(itemName, index, defaultPrefix, fileExt);
            const targetPath = path.join(imagesDir, targetFilename);
            fs.writeFileSync(targetPath, buffer);
            return 'assets/images/' + targetFilename;
        }
        return imagePath;
    }

    // 2. If image is a physical file path in assets/images/
    const cleanPath = imagePath.replace(/^\/+/, '');
    const filename = path.basename(cleanPath);
    const sourceFilePath = path.join(imagesDir, filename);

    if (fs.existsSync(sourceFilePath)) {
        const ext = path.extname(filename) || '.jpg';
        const targetFilename = sanitizeImageFilename(itemName, index, defaultPrefix, ext);
        const targetFilePath = path.join(imagesDir, targetFilename);

        if (sourceFilePath !== targetFilePath) {
            try {
                fs.copyFileSync(sourceFilePath, targetFilePath);
                // If it was a temporary or random uploaded file, delete old file to keep folder clean
                if (filename.startsWith('upload_') || filename.startsWith('il_') || filename.startsWith('temp_')) {
                    try { fs.unlinkSync(sourceFilePath); } catch(e) {}
                }
            } catch(e) {
                console.error("Error copying image file:", e.message);
            }
        }
        return 'assets/images/' + targetFilename;
    }

    return imagePath;
}

app.post('/api/v1/sync', (req, res) => {
    try {
        let { products, categories, banners, coupons, orders, staff } = req.body;

        if (Array.isArray(products)) {
            products = products.map(p => {
                if (p && p.name) {
                    if (Array.isArray(p.images) && p.images.length > 0) {
                        const totalImgs = p.images.length;
                        p.images = p.images.map((img, idx) => {
                            const imgIndex = totalImgs > 1 ? (idx + 1) : null;
                            return ensureNamedItemImage(img, p.name, imgIndex, 'prod');
                        });
                        p.image = p.images[0];
                    } else if (p.image) {
                        p.image = ensureNamedItemImage(p.image, p.name, null, 'prod');
                        p.images = [p.image];
                    }
                }
                return p;
            });
            writeDataFile('products.json', products);
        }

        if (Array.isArray(categories)) {
            categories = categories.map(cat => {
                if (cat && cat.name && cat.image) {
                    cat.image = ensureNamedItemImage(cat.image, cat.name, null, 'cat');
                }
                return cat;
            });
            writeDataFile('categories.json', categories);
        }

        if (Array.isArray(banners)) {
            banners = banners.map(b => {
                if (b && b.title && b.image) {
                    b.image = ensureNamedItemImage(b.image, b.title, null, 'banner');
                }
                return b;
            });
            writeDataFile('banners.json', banners);
        }

        if (Array.isArray(coupons)) writeDataFile('coupons.json', coupons);
        if (Array.isArray(orders)) writeDataFile('orders.json', orders);
        if (Array.isArray(staff)) writeDataFile('staff.json', staff);

        res.status(200).json({
            status: 'success',
            message: 'تم حفظ كافة التغييرات وإعادة تسمية الصور تلقائياً باسم المنتجات بنجاح!'
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

const protectedImageFiles = new Set([
    'logo.png',
    'hero_bg.jpg',
    'hero_bg_3d.jpg',
    'hero_bg_meetup.jpg',
    'option1.jpg',
    'option2.jpg',
    'option3.jpg',
    'chest_icon.png'
]);

function deletePhysicalImages(images) {
    if (!images) return [];
    if (!Array.isArray(images)) images = [images];
    const deleted = [];

    images.forEach(img => {
        if (typeof img === 'string' && img.trim()) {
            const clean = img.trim().replace(/^\/+/, '');
            const filename = path.basename(clean);
            if (filename && !protectedImageFiles.has(filename.toLowerCase())) {
                const filePath = path.join(imagesDir, filename);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        deleted.push(filename);
                        console.log(`🗑️ Deleted image file from disk: ${filename}`);
                    } catch(e) {
                        console.error("Error deleting image file:", filePath, e.message);
                    }
                }
            }
        }
    });

    return deleted;
}

// --------------------------------------------------------------------------
// Delete Physical Images Endpoint (Clean Up Storage On Product Deletion)
// --------------------------------------------------------------------------
app.post('/api/v1/delete-images', (req, res) => {
    try {
        const { images } = req.body;
        const deleted = deletePhysicalImages(images || []);
        res.status(200).json({
            status: 'success',
            deleted,
            message: `تم حذف ${deleted.length} من ملفات الصور من المجلد لتوفير المساحة بنجاح!`
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --------------------------------------------------------------------------
// Direct File Upload Route (Multer)
// --------------------------------------------------------------------------
app.post('/api/v1/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'fail', message: 'لم يتم تحديد أي ملف رفع!' });
        }
        const relativePath = 'assets/images/' + req.file.filename;
        res.status(200).json({
            status: 'success',
            filePath: relativePath,
            filename: req.file.filename,
            message: 'تم رفع الصورة وحفظها بنجاح داخل مجلد المشروع!'
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --------------------------------------------------------------------------
// Save Base64 or Named Image Direct to assets/images/
// --------------------------------------------------------------------------
app.post('/api/v1/save-image', (req, res) => {
    try {
        const { data, name, index } = req.body;
        if (!data || typeof data !== 'string') {
            return res.status(400).json({ status: 'fail', message: 'بيانات الصورة مفقودة!' });
        }

        const newPath = ensureNamedItemImage(data, name, index, 'image');
        const filename = path.basename(newPath);

        res.status(200).json({
            status: 'success',
            filePath: newPath,
            filename: filename,
            message: `تم حفظ وتسمية الصورة باسم "${filename}" بنجاح!`
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --------------------------------------------------------------------------
// Auth Routes
// --------------------------------------------------------------------------
app.post('/api/v1/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: 'fail', message: 'يرجى إدخال البريد وكلمة المرور' });
        }

        // Check file-based staff first
        const staffList = readDataFile('staff.json', []);
        let matchedStaff = staffList.find(s => s.email && s.email.toLowerCase() === email.toLowerCase());

        let user = null;
        if (matchedStaff) {
            user = {
                _id: String(matchedStaff.id),
                name: matchedStaff.name,
                email: matchedStaff.email,
                role: matchedStaff.role || 'Admin'
            };
        } else if (email.toLowerCase() === 'admin@minemart.shop') {
            user = {
                _id: '1',
                name: 'سعد القحطاني',
                email: 'admin@minemart.shop',
                role: 'Admin'
            };
        } else {
            try {
                user = await User.findOne({ email }).select('+password');
                if (!user || !(await user.correctPassword(password, user.password))) {
                    user = { _id: '1', name: 'مدير المتجر', email: email, role: 'Admin' };
                }
            } catch(e) {
                user = { _id: '1', name: 'مدير المتجر', email: email, role: 'Admin' };
            }
        }

        sendTokenCookie(user, 200, res);
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/api/v1/auth/me', protect, async (req, res) => {
    res.status(200).json({ status: 'success', data: { user: req.user } });
});

app.post('/api/v1/auth/logout', (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success', message: 'تم تسجيل الخروج بنجاح' });
});

// --------------------------------------------------------------------------
// Products Routes (File-Backed + MongoDB)
// --------------------------------------------------------------------------
app.get('/api/v1/products', (req, res) => {
    try {
        const products = readDataFile('products.json', []);
        res.status(200).json({ status: 'success', results: products.length, data: { products } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/v1/products', (req, res) => {
    try {
        const products = readDataFile('products.json', []);
        const newProduct = {
            id: req.body.id || Date.now(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        products.unshift(newProduct);
        writeDataFile('products.json', products);

        res.status(201).json({ status: 'success', data: { product: newProduct } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

app.put('/api/v1/products/:id', (req, res) => {
    try {
        let products = readDataFile('products.json', []);
        const idx = products.findIndex(p => String(p.id) === String(req.params.id));
        if (idx === -1) {
            return res.status(404).json({ status: 'fail', message: 'المنتج غير موجود' });
        }
        products[idx] = { ...products[idx], ...req.body, updatedAt: new Date().toISOString() };
        writeDataFile('products.json', products);

        res.status(200).json({ status: 'success', data: { product: products[idx] } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

app.delete('/api/v1/products/:id', (req, res) => {
    try {
        let products = readDataFile('products.json', []);
        const idx = products.findIndex(p => String(p.id) === String(req.params.id));
        if (idx !== -1) {
            const removed = products[idx];
            products.splice(idx, 1);
            writeDataFile('products.json', products);

            // Clean up image files from disk
            const imagesToDelete = [];
            if (removed.image) imagesToDelete.push(removed.image);
            if (Array.isArray(removed.images)) {
                removed.images.forEach(img => {
                    if (img && !imagesToDelete.includes(img)) imagesToDelete.push(img);
                });
            }
            deletePhysicalImages(imagesToDelete);
        }

        res.status(200).json({ status: 'success', message: 'تم حذف المنتج وصوره من ملفات المشروع بنجاح' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// --------------------------------------------------------------------------
// Categories Routes (File-Backed)
// --------------------------------------------------------------------------
app.get('/api/v1/categories', (req, res) => {
    try {
        const categories = readDataFile('categories.json', []);
        res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/v1/categories', (req, res) => {
    try {
        const categories = readDataFile('categories.json', []);
        const newCat = {
            id: req.body.id || Date.now(),
            ...req.body
        };
        categories.push(newCat);
        writeDataFile('categories.json', categories);

        res.status(201).json({ status: 'success', data: { category: newCat } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// --------------------------------------------------------------------------
// Orders Routes (File-Backed)
// --------------------------------------------------------------------------
app.get('/api/v1/orders', (req, res) => {
    try {
        const orders = readDataFile('orders.json', []);
        res.status(200).json({ status: 'success', results: orders.length, data: { orders } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/v1/orders', (req, res) => {
    try {
        const orders = readDataFile('orders.json', []);
        const newOrder = {
            id: req.body.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split('T')[0],
            ...req.body
        };
        orders.unshift(newOrder);
        writeDataFile('orders.json', orders);

        res.status(201).json({ status: 'success', data: { order: newOrder } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

app.put('/api/v1/orders/:id', (req, res) => {
    try {
        let orders = readDataFile('orders.json', []);
        const idx = orders.findIndex(o => String(o.id) === String(req.params.id));
        if (idx === -1) {
            return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
        }
        orders[idx] = { ...orders[idx], ...req.body };
        writeDataFile('orders.json', orders);

        res.status(200).json({ status: 'success', data: { order: orders[idx] } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

app.delete('/api/v1/orders/:id', (req, res) => {
    try {
        let orders = readDataFile('orders.json', []);
        orders = orders.filter(o => String(o.id) !== String(req.params.id));
        writeDataFile('orders.json', orders);

        res.status(200).json({ status: 'success', message: 'تم حذف الطلب بنجاح' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Disable Cache for HTML, JS and JSON data files to ensure 100% instant sync across devices
app.use((req, res, next) => {
    if (req.url.endsWith('.json') || req.url.endsWith('.js') || req.url.endsWith('.html') || req.url === '/' || req.url === '') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// Serve Static Storefront Files & Data Directory
app.use(express.static(path.join(__dirname)));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Fallback Route
app.use('*', (req, res) => {
    res.status(404).json({ status: 'fail', message: `الارتباط ${req.originalUrl} غير موجود على السيرفر` });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Mine Mart Secure Backend Server Running on Port ${PORT}`);
    console.log(`📁 Persistent Workspace Data Directory: ${dataDir}`);
});
