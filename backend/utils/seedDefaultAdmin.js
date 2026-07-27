const bcrypt = require('bcrypt');
const User = require('../models/User');

const DEFAULT_ADMIN_EMAIL = 'admin@pawlet.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';
const LEGACY_ADMIN_EMAILS = ['admin@gmail.com'];

const seedDefaultAdmin = async () => {
    try {
        const existing = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });
        if (existing) {
            if (existing.role !== 'admin') {
                existing.role = 'admin';
                await existing.save();
            }
            return;
        }

        for (const legacyEmail of LEGACY_ADMIN_EMAILS) {
            const legacyAdmin = await User.findOne({ email: legacyEmail, role: 'admin' });
            if (legacyAdmin) {
                legacyAdmin.email = DEFAULT_ADMIN_EMAIL;
                legacyAdmin.password = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
                await legacyAdmin.save();
                console.log(`Default admin email updated to ${DEFAULT_ADMIN_EMAIL}`);
                return;
            }
        }

        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
        await User.create({
            name: 'Admin',
            email: DEFAULT_ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin',
            isVerified: true,
            isActive: true
        });
        console.log(`Default admin account created: ${DEFAULT_ADMIN_EMAIL}`);
    } catch (error) {
        console.error('Default admin seed error:', error.message);
    }
};

module.exports = seedDefaultAdmin;
