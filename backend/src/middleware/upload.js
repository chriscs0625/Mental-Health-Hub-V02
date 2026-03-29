const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/products/');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const slipStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/slips/');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const fileFilterPdf = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for product files'), false);
  }
};

const fileFilterImage = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for thumbnails and slips'), false);
  }
};

const uploadProductFile = multer({ 
  storage: productStorage, 
  fileFilter: fileFilterPdf, 
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const uploadThumbnail = multer({ 
  storage: productStorage, 
  fileFilter: fileFilterImage, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadSlip = multer({ 
  storage: slipStorage, 
  fileFilter: fileFilterImage, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = {
  uploadProductFile,
  uploadThumbnail,
  uploadSlip
};
