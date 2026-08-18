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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = 'upload_' + Date.now() + Math.floor(Math.random() * 1000) + ext;
        cb(null, name);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// 2. CORS Policy Configuration
app.use(cors({
    origin: true,
    credentials: true
}));

// 3. Body Parsers & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Prevent NoSQL Injection
app.use(mongoSanitize());

// 5. Rate Limiting for Auth API
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { status: 'fail', message: 'محاولات دخول كثيرة خاطئة! يرجى الانتظار 15 دقيقة.' }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
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

// --------------------------------------------------------------------------
// Direct File Upload Route
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
            message: 'تم رفع الصورة وحفظها بنجاح!'
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

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ status: 'fail', message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }

        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });

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
// Products Routes
// --------------------------------------------------------------------------
app.get('/api/v1/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', results: products.length, data: { products } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/v1/products', protect, restrictTo('Admin', 'Manager'), async (req, res) => {
    try {
        const newProduct = await Product.create(req.body);
        res.status(201).json({ status: 'success', data: { product: newProduct } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

app.put('/api/v1/products/:id', protect, restrictTo('Admin', 'Manager'), async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ status: 'success', data: { product: updated } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

app.delete('/api/v1/products/:id', protect, restrictTo('Admin'), async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// --------------------------------------------------------------------------
// Categories Routes
// --------------------------------------------------------------------------
app.get('/api/v1/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/v1/categories', protect, restrictTo('Admin'), async (req, res) => {
    try {
        const newCat = await Category.create(req.body);
        res.status(201).json({ status: 'success', data: { category: newCat } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});
// --------------------------------------------------------------------------
// Orders Routes
// --------------------------------------------------------------------------
app.get('/api/v1/orders', protect, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', results: orders.length, data: { orders } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/v1/orders', async (req, res) => {
    try {
        const newOrder = await Order.create(req.body);
        res.status(201).json({ status: 'success', data: { order: newOrder } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

app.put('/api/v1/orders/:id', protect, async (req, res) => {
    try {
        const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ status: 'success', data: { order: updated } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

app.delete('/api/v1/orders/:id', protect, restrictTo('Admin'), async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Serve Static Storefront Files
app.use(express.static('./'));

// Fallback Route
app.use('*', (req, res) => {
    res.status(404).json({ status: 'fail', message: `الارتباط ${req.originalUrl} غير موجود على السيرفر` });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Mine Mart Secure Backend Server Running on Port ${PORT}`);
});
