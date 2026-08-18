const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        required: [true, 'يرجى إدخال اسم العميل']
    },
    customerPhone: {
        type: String,
        default: '+966 50 000 0000'
    },
    address: {
        type: String,
        required: [true, 'يرجى إدخال عنوان التوصيل']
    },
    city: {
        type: String,
        default: 'الرياض'
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        qty: Number
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Mada', 'Visa', 'MasterCard', 'Apple Pay', 'COD'],
        default: 'Mada'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipping', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
