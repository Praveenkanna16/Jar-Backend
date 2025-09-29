const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { KYC, User } = require('../models');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'kyc');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `kyc-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed'));
    }
  }
});

// Middleware for file upload
exports.uploadKYCDocuments = upload.fields([
  { name: 'documentFront', maxCount: 1 },
  { name: 'documentBack', maxCount: 1 }
]);

/**
 * Submit KYC documents
 */
exports.submitKYC = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { documentType, documentNumber } = req.body;

    // Validate required fields
    if (!documentType || !documentNumber) {
      return res.status(400).json({
        success: false,
        message: 'Document type and number are required'
      });
    }

    // Check if files are uploaded
    if (!req.files || !req.files.documentFront) {
      return res.status(400).json({
        success: false,
        message: 'Document front image is required'
      });
    }

    // Check if KYC already exists for this user
    const existingKYC = await KYC.findOne({
      where: { userId, documentType }
    });

    if (existingKYC && existingKYC.status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'KYC already verified for this document type'
      });
    }

    // Create or update KYC record
    const kycData = {
      userId,
      documentType,
      documentNumber,
      documentImageFront: req.files.documentFront[0].path,
      documentImageBack: req.files.documentBack ? req.files.documentBack[0].path : null,
      status: 'PENDING'
    };

    let kyc;
    if (existingKYC) {
      await existingKYC.update(kycData);
      kyc = existingKYC;
    } else {
      kyc = await KYC.create(kycData);
    }

    // Update user KYC status
    await User.update(
      { kycStatus: 'IN_PROGRESS' },
      { where: { id: userId } }
    );

    logger.info(`KYC submitted for user ${userId}`);

    res.json({
      success: true,
      data: {
        kycId: kyc.id,
        status: kyc.status,
        message: 'KYC documents submitted successfully. Verification pending.'
      }
    });
  } catch (error) {
    logger.error('KYC submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit KYC documents'
    });
  }
};

/**
 * Get KYC status
 */
exports.getKYCStatus = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const kycDocuments = await KYC.findAll({
      where: { userId },
      attributes: ['id', 'documentType', 'status', 'verifiedAt', 'rejectionReason', 'createdAt']
    });

    const user = await User.findByPk(userId, {
      attributes: ['kycStatus', 'kycVerifiedAt']
    });

    res.json({
      success: true,
      data: {
        overallStatus: user.kycStatus,
        verifiedAt: user.kycVerifiedAt,
        documents: kycDocuments
      }
    });
  } catch (error) {
    logger.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KYC status'
    });
  }
};

/**
 * Verify KYC (Admin only)
 */
exports.verifyKYC = async (req, res) => {
  try {
    const { kycId } = req.params;
    const { status, rejectionReason } = req.body;
    const verifiedBy = req.user.userId || req.user.id;

    // Check if user is admin
    const adminUser = await User.findByPk(verifiedBy);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Admin access required.'
      });
    }

    // Find KYC document
    const kyc = await KYC.findByPk(kycId);
    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: 'KYC document not found'
      });
    }

    // Update KYC status
    const updateData = {
      status,
      verifiedBy,
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null
    };

    await kyc.update(updateData);

    // Update user KYC status if all documents are verified
    if (status === 'VERIFIED') {
      const allKYCs = await KYC.findAll({
        where: { userId: kyc.userId }
      });

      const allVerified = allKYCs.every(doc => doc.status === 'VERIFIED');
      
      if (allVerified) {
        await User.update(
          { 
            kycStatus: 'VERIFIED',
            kycVerifiedAt: new Date()
          },
          { where: { id: kyc.userId } }
        );
      }
    } else if (status === 'REJECTED') {
      await User.update(
        { kycStatus: 'REJECTED' },
        { where: { id: kyc.userId } }
      );
    }

    logger.info(`KYC ${kycId} ${status} by admin ${verifiedBy}`);

    res.json({
      success: true,
      data: {
        kycId,
        status,
        message: `KYC ${status.toLowerCase()} successfully`
      }
    });
  } catch (error) {
    logger.error('KYC verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify KYC'
    });
  }
};

/**
 * Get pending KYC requests (Admin only)
 */
exports.getPendingKYC = async (req, res) => {
  try {
    const adminId = req.user.userId || req.user.id;
    
    // Check if user is admin
    const adminUser = await User.findByPk(adminId);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Admin access required.'
      });
    }

    const { limit = 10, offset = 0 } = req.query;

    const pendingKYCs = await KYC.findAll({
      where: { status: 'PENDING' },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'phone']
      }],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await KYC.count({ where: { status: 'PENDING' } });

    res.json({
      success: true,
      data: {
        kycRequests: pendingKYCs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get pending KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending KYC requests'
    });
  }
};
