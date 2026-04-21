const versionModel = require('../models/version.model');
const moment = require('moment-timezone');
const timezone = 'Asia/Jakarta';


const getLatestVersion = async (req, res) => {
    try {
        const  [rows]  = await versionModel.getLatestVersion(); 
        
        if (!rows) {
            return res.status(404).json({
                message: "Data not found",
                status: "failed",
                status_code: 404
            });
        }
        const data = rows[0];

        if(data.force_update === 1){
            force_update = true;
        }else{
            force_update = false;
        }

        res.json({
            latest_version: data.latest_version || "1.0.0",
            force_update: force_update || false ,// Pastikan tipe data Boolean jika di DB pakai INT
            update_url: data.update_url || "url not found"
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            status: "failed",
            status_code: 500,
            serverMessage: error.message
        });
    }
};





module.exports={
    
    getLatestVersion,

}