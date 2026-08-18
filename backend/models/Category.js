const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'يرجى إدخال اسم القسم بالعربية'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'يرجى إدخال رمز القسم باللغة الإنجليزية'],
        unique: true,
        lowercase: true,
        trim: true
    },
    image: {
        type: String,
        required: [true, 'يرجى تحديد صورة القسم الرئيسية']
    },
    productCount: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: 'تصنيف رئيسي لابتكارات الـ 3D ومستلزمات العوالم المكعبة.'
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
