const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const DogListing = require('../models/DogListing');
const User = require('../models/User');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSellerContact = (listing, seller) => {
  const sellerType = seller?.sellerType || 'business';

  if (sellerType === 'individual') {
    return {
      id: seller._id,
      sellerType: 'individual',
      name: seller.name,
      displayLabel: 'Individual Seller',
      email: seller.email,
      phone: listing.contactPhone || seller.phone || 'Not provided',
      city: listing.location || ''
    };
  }

  return {
    id: seller._id,
    sellerType: 'business',
    name: seller.name,
    shopName: seller.shopName,
    displayLabel: seller.shopName || seller.name,
    email: seller.email,
    phone: seller.phone || 'Not provided'
  };
};

/**
 * POST /api/dogs
 * Upload a new dog listing
 * Requires: Authentication (seller with active shop)
 * Request body: { name, breed, age, price, location, healthStatus, images, description (optional) }
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, breed, gender, age, price, location, contactPhone, healthStatus, images, description } = req.body;

    // Validate required fields
    if (!name || !breed || !gender || age === undefined || !price || !location || !healthStatus || !images || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, breed, gender, age, price, location, healthStatus, images, description'
      });
    }

    const validGenders = ['Male', 'Female'];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({
        success: false,
        message: `Invalid gender. Must be one of: ${validGenders.join(', ')}`
      });
    }

    // Validate age and price are numbers
    if (typeof age !== 'number' || age < 0) {
      return res.status(400).json({
        success: false,
        message: 'Age must be a positive number'
      });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    // Validate healthStatus enum
    const validHealthStatuses = ['Healthy', 'Vaccinated', 'Neutered/Spayed', 'Under Treatment'];
    if (!validHealthStatuses.includes(healthStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid health status. Must be one of: ${validHealthStatuses.join(', ')}`
      });
    }

    // Validate images array
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    // Validate image formats (must be URLs or base64)
    const validImageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const isValidImageFormat = images.every(image => {
      if (typeof image !== 'string') return false;
      
      // Check if it's a valid URL
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return true;
      }
      
      // Check if it's base64
      if (image.startsWith('data:image/')) {
        const format = image.split(';')[0].split('/')[1];
        return validImageFormats.includes(format);
      }
      
      // Check file extension
      const ext = image.split('.').pop().toLowerCase();
      return validImageFormats.includes(ext);
    });

    if (!isValidImageFormat) {
      return res.status(400).json({
        success: false,
        message: `Invalid image format. Supported formats: ${validImageFormats.join(', ')}`
      });
    }

    // Verify user is a seller (role + flag). Shop creation not required for listings.
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'seller' || user.isSeller !== true) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can upload dog listings'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Seller account must be verified before uploading dog listings'
      });
    }

    const isIndividualSeller = user.sellerType === 'individual';

    if (!isIndividualSeller && user.shopStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Activate your shop before uploading dogs.'
      });
    }

    if (isIndividualSeller && !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for individual seller listings'
      });
    }

    // Create new dog listing — pending admin approval
    const newListing = new DogListing({
      sellerId: req.user.id,
      name,
      breed,
      gender,
      age,
      price,
      location,
      contactPhone: isIndividualSeller ? contactPhone : (contactPhone || ''),
      healthStatus,
      images,
      description: description.trim(),
      status: 'Available',
      approvalStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save to database
    const savedListing = await newListing.save();

    return res.status(201).json({
      success: true,
      message: 'Dog listing submitted for admin approval.',
      listing: savedListing
    });

  } catch (error) {
    console.error('Error uploading dog listing:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error. Failed to create listing',
      error: error.message
    });
  }
});

/**
 * GET /api/dogs
 * Retrieve and filter available dog listings (public endpoint)
 * Query Parameters:
 *   - search (optional): search by dog name or breed (case-insensitive)
 *   - breed (optional): filter by breed (case-insensitive)
 *   - ageMin (optional): minimum age in years
 *   - ageMax (optional): maximum age in years
 *   - location (optional): filter by location (case-insensitive)
 *   - page (optional): pagination (default 1)
 *   - limit (optional): results per page (default 20)
 */
router.get('/', async (req, res) => {
  try {
    const { search, breed, ageMin, ageMax, location, page = 1, limit = 20 } = req.query;
    
    // Build filter query - only show available approved listings
    const filter = { status: 'Available', approvalStatus: 'approved' };

    // Search by dog name or breed
    const searchTerm = typeof search === 'string' ? search.trim() : '';
    if (searchTerm) {
      const regex = { $regex: escapeRegex(searchTerm), $options: 'i' };
      filter.$or = [{ name: regex }, { breed: regex }];
    }

    // Add breed filter if provided (works alongside search)
    if (breed) {
      filter.breed = { $regex: escapeRegex(breed), $options: 'i' };
    }

    // Add age range filter if provided
    if (ageMin !== undefined || ageMax !== undefined) {
      filter.age = {};
      if (ageMin !== undefined) {
        const minAge = parseInt(ageMin);
        if (!isNaN(minAge)) {
          filter.age.$gte = minAge;
        }
      }
      if (ageMax !== undefined) {
        const maxAge = parseInt(ageMax);
        if (!isNaN(maxAge)) {
          filter.age.$lte = maxAge;
        }
      }
    }

    // Add location filter if provided
    if (location) {
      filter.location = { $regex: location, $options: 'i' }; // case-insensitive
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageSize;

    // Get total count for pagination
    const total = await DogListing.countDocuments(filter);

    // Fetch filtered listings with pagination
    const listings = await DogListing.find(filter)
      .populate('sellerId', 'name shopName email phone sellerType')
      .select('_id name breed gender age price location contactPhone healthStatus images description createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const listingsWithSeller = listings.map((listing) => {
      const item = listing.toObject();
      if (item.sellerId) {
        item.seller = buildSellerContact(item, item.sellerId);
      }
      return item;
    });

    return res.status(200).json({
      success: true,
      count: listingsWithSeller.length,
      total,
      page: pageNum,
      limit: pageSize,
      pages: Math.ceil(total / pageSize),
      message: listingsWithSeller.length === 0 ? 'No listings found matching your criteria' : 'Listings retrieved successfully',
      listings: listingsWithSeller
    });
  } catch (error) {
    console.error('Error fetching dog listings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch listings',
      error: error.message
    });
  }
});

/**
 * GET /api/dogs/mine
 * Retrieve all listings of the logged-in seller (management view)
 * Requires: Authentication
 */
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const listings = await DogListing.find({ sellerId: req.user.id })
      .populate('sellerId', 'name shopName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    console.error('Error fetching seller listings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your listings',
      error: error.message
    });
  }
});

/**
 * GET /api/dogs/seller/:sellerId
 * Get all listings from a specific seller
 */
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const listings = await DogListing.find({ sellerId: req.params.sellerId })
      .populate('sellerId', 'name shopName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    console.error('Error fetching seller listings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch listings',
      error: error.message
    });
  }
});

/**
 * GET /api/dogs/:id
 * Retrieve a specific dog listing with seller contact details
 * Used for Purchase/Contact Seller feature
 * Returns: dog details, seller info (email, phone, shopName)
 * Validates: listing exists and status is "Available"
 */
router.get('/:id', async (req, res) => {
  try {
    const listing = await DogListing.findById(req.params.id)
      .populate('sellerId', 'name shopName email phone sellerType');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check if listing is approved and available
    if (listing.approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'This listing is pending admin approval'
      });
    }

    // Check if listing is still available for purchase
    if (listing.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'This dog is no longer available.',
        status: listing.status
      });
    }

    // Return listing with seller contact info
    return res.status(200).json({
      success: true,
      listing,
      seller: buildSellerContact(listing, listing.sellerId)
    });
  } catch (error) {
    console.error('Error fetching dog listing:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch listing',
      error: error.message
    });
  }
});

/**
 * PUT /api/dogs/:id
 * Update a dog listing (only seller who created it can update)
 * Request body: { name, breed, age, price, location, healthStatus, images, description, status }
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await DogListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check if user is the seller
    if (listing.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own listings'
      });
    }

    // Update allowed fields
    const { name, breed, gender, age, price, location, contactPhone, healthStatus, images, description, status } = req.body;

    if (name) {
      listing.name = name;
    }
    if (breed) {
      listing.breed = breed;
    }
    if (gender) {
      const validGenders = ['Male', 'Female'];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          success: false,
          message: `Invalid gender. Must be one of: ${validGenders.join(', ')}`
        });
      }
      listing.gender = gender;
    }
    if (age !== undefined) {
      if (typeof age !== 'number' || age < 0) {
        return res.status(400).json({
          success: false,
          message: 'Age must be a positive number'
        });
      }
      listing.age = age;
    }
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a positive number'
        });
      }
      listing.price = price;
    }
    if (location !== undefined) {
      listing.location = location;
    }
    if (contactPhone !== undefined) {
      listing.contactPhone = contactPhone;
    }
    if (healthStatus) {
      const validHealthStatuses = ['Healthy', 'Vaccinated', 'Neutered/Spayed', 'Under Treatment'];
      if (!validHealthStatuses.includes(healthStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid health status. Must be one of: ${validHealthStatuses.join(', ')}`
        });
      }
      listing.healthStatus = healthStatus;
    }
    if (images && Array.isArray(images) && images.length > 0) {
      listing.images = images;
    }
    if (description !== undefined) {
      listing.description = description;
    }
    if (status && ['Available', 'Sold', 'Unlisted'].includes(status)) {
      if (status === 'Sold' && listing.status !== 'Sold' && !listing.soldAt) {
        listing.soldAt = new Date();
      }
      listing.status = status;
    }

    listing.updatedAt = new Date();
    const updatedListing = await listing.save();

    return res.status(200).json({
      success: true,
      message: 'Listing updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Error updating dog listing:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update listing',
      error: error.message
    });
  }
});

/**
 * PATCH /api/dogs/:id/sold
 * Mark a dog listing as sold
 * Only seller who created the listing can mark as sold
 */
router.patch('/:id/sold', authMiddleware, async (req, res) => {
  try {
    const listing = await DogListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check if user is the seller
    if (listing.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own listings'
      });
    }

    if (listing.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved listings can be marked as sold'
      });
    }

    // Update status to Sold
    listing.status = 'Sold';
    if (!listing.soldAt) {
      listing.soldAt = new Date();
    }
    listing.updatedAt = new Date();
    const updatedListing = await listing.save();

    return res.status(200).json({
      success: true,
      message: 'Listing marked as sold successfully',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Error marking listing as sold:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark listing as sold',
      error: error.message
    });
  }
});

/**
 * DELETE /api/dogs/:id
 * Delete a dog listing (only seller who created it can delete)
 * Permanently removes the listing from the database
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await DogListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check if user is the seller
    if (listing.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own listings'
      });
    }

    // Permanently delete the listing
    await listing.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dog listing:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete listing',
      error: error.message
    });
  }
});

module.exports = router;