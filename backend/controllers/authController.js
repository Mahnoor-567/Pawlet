const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validatePassword } = require('../utils/passwordValidation');

// Ensure role/isSeller remain aligned and coerce legacy values (e.g., buyer/admin -> user)
const normalizeUserRoleFlags = (user) => {
    if (!user) {
        return { user, needsUpdate: false };
    }

    // Preserve all named roles; only fall back to 'user' for truly unknown/legacy values
    const PRESERVED_ROLES = ['seller', 'expert', 'writer', 'admin'];
    const normalizedRole = PRESERVED_ROLES.includes(user.role)
        ? user.role
        : (user.isSeller ? 'seller' : 'user');
    const normalizedIsSeller = normalizedRole === 'seller';

    let needsUpdate = false;
    if (user.role !== normalizedRole) {
        user.role = normalizedRole;
        needsUpdate = true;
    }

    if (user.isSeller !== normalizedIsSeller) {
        user.isSeller = normalizedIsSeller;
        needsUpdate = true;
    }

    return { user, needsUpdate };
};

// User registration (User default)
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Public registration — admin accounts are system/database only
        const validRoles = ['user', 'seller', 'expert', 'writer'];
        const normalizedRole = role && typeof role === 'string' ? role.toLowerCase() : 'user';
        if (normalizedRole === 'admin') {
            return res.status(403).json({ message: 'Admin accounts cannot be created through registration.' });
        }
        if (!validRoles.includes(normalizedRole)) {
            return res.status(400).json({ message: 'Invalid role. Must be one of: user, seller, expert, writer' });
        }

        // Basic required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
            return res.status(400).json({ message: passwordCheck.errors[0], errors: passwordCheck.errors });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name: name || '',
            email,
            password: hashedPassword,
            role: normalizedRole,
            isSeller: normalizedRole === 'seller',
            isVerified: normalizedRole === 'seller',
            shopStatus: 'inactive'
        });
        await user.save();
        res.status(201).json({ 
            message: 'User registered successfully', 
            user: { 
                id: user._id, 
                name: user.name,
                email: user.email, 
                role: user.role, 
                isSeller: user.isSeller,
                sellerType: user.sellerType,
                shopStatus: user.shopStatus
            } 
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Error during registration', error: error.message });
    }
};

// Seller registration
const sellerRegister = async (req, res) => {
    try {
        const { email, password, role, shopName } = req.body;

        // Force role to seller for this endpoint
        const normalizedRole = role && typeof role === 'string' ? role.toLowerCase() : 'seller';
        if (normalizedRole !== 'seller') {
            return res.status(400).json({ message: 'Only seller role allowed on this endpoint' });
        }

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
            role: 'seller',
            isSeller: true,
            isVerified: true,
            shopStatus: 'inactive',
            shopName: shopName || ''
        });
        await user.save();
        res.status(201).json({ message: 'Seller registered', user: { id: user._id, email: user.email, role: user.role, isSeller: user.isSeller, isVerified: user.isVerified, sellerType: user.sellerType, shopStatus: user.shopStatus } });
    } catch (error) {
        console.error('Seller register error:', error);
        res.status(500).json({ message: 'Error during seller registration', error: error.message });
    }
};

// User login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Normalize legacy roles/isSeller and ensure seller accounts stay verified/active
        const { user: normalizedUser, needsUpdate: needsNormalization } = normalizeUserRoleFlags(user);

        let updatedUser = normalizedUser;
        let needsUpdate = needsNormalization;

        if (needsUpdate) {
            updatedUser = await normalizedUser.save();
        }

        // Generate JWT token
        const token = jwt.sign({ id: updatedUser._id, role: updatedUser.role }, process.env.JWT_SECRET);
        
        // Return token and user data with explicit role/isSeller and userId
        res.json({ 
            token,
            userId: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isSeller: updatedUser.isSeller,
            shopStatus: updatedUser.shopStatus,
            shopName: updatedUser.shopName,
            sellerType: updatedUser.sellerType,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                isSeller: updatedUser.isSeller,
                isVerified: updatedUser.isVerified,
                shopStatus: updatedUser.shopStatus,
                shopName: updatedUser.shopName,
                sellerType: updatedUser.sellerType
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login', error: error.message });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { name, email, profileImage } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!name && !email && !profileImage) {
            return res.status(400).json({ message: 'At least one field (name, email, or profileImage) is required' });
        }

        // Check if email is already in use by another user
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update user profile
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (profileImage !== undefined) updateData.profileImage = profileImage; // Allow empty string to remove image

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ 
            message: 'Profile updated successfully', 
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                profileImage: updatedUser.profileImage,
                phone: updatedUser.phone,
                isVerified: updatedUser.isVerified,
                isSeller: updatedUser.isSeller,
                shopName: updatedUser.shopName,
                shopStatus: updatedUser.shopStatus,
                sellerType: updatedUser.sellerType
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

// Convert existing user to seller
const becomeSeller = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sellerType } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If already a seller, return current data (optionally update seller type)
        if (user.role === 'seller' || user.isSeller) {
            if (sellerType && ['business', 'individual'].includes(sellerType)) {
                if (sellerType === 'individual' && user.shopStatus === 'active') {
                    return res.status(400).json({ message: 'Cannot switch to individual seller with an active shop' });
                }
                user.sellerType = sellerType;
                await user.save();
            }
            return res.json({
                message: 'User is already a seller',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isSeller: user.isSeller,
                    isVerified: user.isVerified,
                    sellerType: user.sellerType,
                    shopStatus: user.shopStatus,
                    shopName: user.shopName,
                    profileImage: user.profileImage,
                    phone: user.phone
                }
            });
        }

        user.role = 'seller';
        user.isSeller = true;
        user.isVerified = true;
        user.shopStatus = 'inactive';
        if (sellerType && ['business', 'individual'].includes(sellerType)) {
            user.sellerType = sellerType;
        }

        await user.save();

        return res.json({
            message: 'User converted to seller successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSeller: user.isSeller,
                isVerified: user.isVerified,
                sellerType: user.sellerType,
                shopStatus: user.shopStatus,
                shopName: user.shopName,
                profileImage: user.profileImage,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Become seller error:', error);
        res.status(500).json({ message: 'Error converting to seller', error: error.message });
    }
};

// Set seller type (business or individual)
const setSellerType = async (req, res) => {
    try {
        const { sellerType } = req.body;

        if (!['business', 'individual'].includes(sellerType)) {
            return res.status(400).json({ message: 'sellerType must be business or individual' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'seller' || !user.isSeller) {
            return res.status(403).json({ message: 'Only sellers can set seller type' });
        }

        if (sellerType === 'individual' && user.shopStatus === 'active') {
            return res.status(400).json({ message: 'Cannot switch to individual seller with an active shop' });
        }

        user.sellerType = sellerType;
        await user.save();

        return res.json({
            message: `Seller type set to ${sellerType}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSeller: user.isSeller,
                isVerified: user.isVerified,
                sellerType: user.sellerType,
                shopStatus: user.shopStatus,
                shopName: user.shopName,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Set seller type error:', error);
        res.status(500).json({ message: 'Error setting seller type', error: error.message });
    }
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch user from database
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ 
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profileImage: user.profileImage,
                isVerified: user.isVerified,
                isSeller: user.isSeller,
                sellerType: user.sellerType,
                shopName: user.shopName,
                shopStatus: user.shopStatus,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

// Simple password reset (academic flow — email verification only, no tokens)
const resetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'Email, new password, and confirm password are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
            return res.status(400).json({ message: passwordCheck.errors[0], errors: passwordCheck.errors });
        }

        const user = await User.findOne({ email: email.trim() });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email address' });
        }

        user.password = await bcrypt.hash(password, 10);
        await user.save();

        res.json({ message: 'Password updated successfully. You can now sign in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};

module.exports = { register, sellerRegister, login, updateProfile, getProfile, becomeSeller, setSellerType, resetPassword };