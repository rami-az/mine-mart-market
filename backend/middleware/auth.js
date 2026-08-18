const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;
        
        // 1. Get token from cookies or Authorization header
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'غير مصرح للوصول! يرجى تسجيل الدخول كمسؤول أولاً.'
            });
        }

        // 2. Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mine_mart_super_secret_jwt_key_2026_security_token_prod');

        // 3. Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                status: 'fail',
                message: 'المستخدم صاحب هذا الرمز لم يعد موجوداً.'
            });
        }

        // 4. Grant access to protected route
        req.user = currentUser;
        next();
    } catch (err) {
        return res.status(401).json({
            status: 'fail',
            message: 'جلسة التسجيل غير صالحة أو منتهية الصلاحية. يرجى إعارة الدخول.'
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء.'
            });
        }
        next();
    };
};
