const multer = require('multer');
const express = require('express');
const path = require('path');
const app = express();



//Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination : (req, file, cb)=>{
        cb(null, 'public/images');
    }, 
    filename :(req, file, cb)=>{
        const timestamp = new Date().getTime();
        const originalname = file.originalname.replace(/\s+/g, '_');
        const extension = path.extname(file.originalname);
        cb(null, `${timestamp}_${originalname}`);
    }
    
})

// Filter file untuk memastikan hanya gambar yang diunggah
  const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mkv', 'video/mov', 'video/webm', 'video/wmv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and MP4 are allowed!'), false);
    }
  };

const upload = multer({
    storage : storage,
    limits : {
      fileSize: 5 * 1000 * 1000 * 1000 // 5 GB
    },  
    fileFilter : fileFilter
})

// Middleware Error Handling 
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(500).json({ message: 'Server Error' });
    }
    next();
  });

module.exports = upload;