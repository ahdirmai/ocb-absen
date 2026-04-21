const multer = require('multer');
const express = require('express');
const path = require('path');
const app = express();



//Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination : (req, file, cb)=>{
        cb(null, 'public/laporan');
    }, 
    filename :(req, file, cb)=>{
        const timestamp = new Date().getTime();
        const originalname = file.originalname.replace(/\s+/g, '_');
        const extension = path.extname(file.originalname);
        cb(null, `${timestamp}_${originalname}`);
    }
    
})


  const fileFilter = (req, file, cb) => {
    // const allowedTypes = ['*/*'];
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg' , // Gambar
        'video/mp4',  // Video  
        'application/pdf',  // File PDF
        'application/msword',  // File Word (.doc)
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // File Word (.docx)
        'application/vnd.ms-excel',  // File Excel (.xls)
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // File Excel (.xlsx)
        'application/zip',  // File ZIP
        'text/plain'  // File teks
      ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type !'), false);
    }
  };

  const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024 // 2 GB
    },
    fileFilter: fileFilter
});

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