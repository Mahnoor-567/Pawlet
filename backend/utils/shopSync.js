const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const syncUserShopFields = async (user, shop) => {
    if (!shop) {
        user.shopName = '';
        user.shopDescription = '';
        user.shopStatus = 'inactive';
    } else {
        user.shopName = shop.shopName;
        user.shopDescription = shop.description;
        user.shopStatus = shop.status === 'approved' ? 'active' : shop.status;
        if (shop.contactInfo) {
            user.phone = shop.contactInfo;
        }
    }
    await user.save();
};

module.exports = { syncUserShopFields, escapeRegex };
