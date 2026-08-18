const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'يرجى إدخال اسم المنتج'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'يرجى تحديد قسم المنتج'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'يرجى إدخال سعر المنتج']
    },
    originalPrice: {
        type: Number,
        default: null
    },
    discountPercent: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        default: 10
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
        required: [true, 'يرجى تحديد صورة المنتج الرئيسية']
    },
    images: [{
        type: String
    }],
    description: {
        type: String,
        default: 'مجسم ومحاكاة 3D عالية الجودة بأسلوب الفوكسل الفاخر من متجر ماين مارت.'
    },
    status: {
        type: String,
        enum: ['published', 'draft'],
        default: 'published'
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
