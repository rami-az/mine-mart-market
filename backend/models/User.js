const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'يرجى إدخال اسم الموظف/الآدمن']
    },
    email: {
        type: String,
        required: [true, 'يرجى إدخال البريد الإلكتروني'],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'يرجى إدخال كلمة المرور'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['Admin', 'Manager', 'Staff'],
        default: 'Staff'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Pre-save password hashing using bcryptjs (12 salt rounds)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Instance method to check password validity
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);
