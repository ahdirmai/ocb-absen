const usersModel = require('../models/user.model');
const createError = require('http-errors');
const bcrypt = require("bcrypt");




const checkImei = async (req, res, next) => {
    const { username,imei, password } = req.body;
    //validasi input
    if (!username || !password) {
        return res.status(400).json({
            message: 'Bad Request.',
            status : 'failed',
            status_code : '400',
        });
    }
    if (!imei) {
        return res.status(404).json({
            message: 'Login Failed. The IMEI is not found',
            status : 'failed',
            status_code : '404',
        });
    }

    try {
        const user = await usersModel.findUserByUsername(username);
        if (!user) return res.status(404).json({ message: 'User not found!', status: 'failed', status_code :'404' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid password!', status: 'failed', status_code :'400'});
        
         // Validasi IMEI apakah sudah ada di database
        const existingImei = await usersModel.findImei(imei);

         if (existingImei) {
             // Jika IMEI sudah ada, cek apakah milik username ini
             if (existingImei.username === username) {
             // IMEI sesuai dengan username, lanjutkan ke controller
                    next();
             }else{
                 return res.status(400).json({
                     message: 'Login failed. The IMEI is already registered to another user.',
                     status : 'failed',
                     status_code : '404',
                 });
             }  
         }else{
             // Jika IMEI belum ada, cek Username apakah sudah ada imei atau belum
             const cekUsername = await usersModel.findUsername(username);
              if(cekUsername){
                 updatedUser = await usersModel.saveImeiForUser(username, imei);
                 if (!updatedUser) {
                     return res.status(500).json({
                         message: 'Failed to save IMEI for the user.',
                         status : 'failed',
                         status_code : '404',
                     });
                 }
                 // IMEI berhasil disimpan, lanjutkan ke controller
                 next();
              }else {
                 return res.status(400).json({
                     message: 'Login failed. The Account is alredy registered to another device .',
                     status : 'failed',
                     status_code : '404',
                 });
              }
              
         }  
        
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
            status : 'failed',
            status_code : '500',
            serverMessage: error.message,
        });
    }
};

module.exports = checkImei;
