const { get } = require("../routes/users");
const laporanModel = require('../models/laporan.model');

const fs = require("fs");
const path = require("path");

const getAllFiles = async(req, res) =>{
    try{
        const [data] = await laporanModel.getAllFiles();
        res.json({
            message: 'Get All Files Success',
            status : 'success',
            status_code : '200',
            data : data
        })
    }
    catch(error){
        res.status(500).json({
            message : "Internal Server Error",
            status : 'failed',
            status_code : '500',
            serverMessage : error,
        })
    }
    
}

const UploadFile = async (req, res) =>{
    // console.log(req.body)
    const {body} = req;
    try {
        const fileUrl = `/assets/laporan/${req.file.filename}`;
        
         // Periksa apakah username/email sudah ada di database
       console.log(body.created_at)
        const newFileResult = await laporanModel.UploadFile(body,fileUrl);
        // console.log(newFileResult);

        res.json({
            message: 'Upload File Successfully!',
            status: 'success',
            status_code: '200',
            data: {
                id : newFileResult.insertId,
                ...req.body,
                file_url: fileUrl, 
            },
        });
        // SET rror jika gagal simpan ke DB
    } catch (error) {
        res.status(500).json({
            message : "Internal Server Error",
            status : 'failed',
            status_code : '500',
            serverMessage : error,
        })
    }
   
}

const updateFile = async (req, res) => {
    const { idFile } = req.params;
    const { body } = req;
    let fileUrl;

    // console.log("Request File:", req.file);
    try {
      //Cek jika ada file baru
      if (req.file) {
        fileUrl = `/assets/laporan/${req.file.filename}`;
        
        // Cari pengguna berdasarkan idUser
        const existingFile = await laporanModel.findFile(idFile);
    
        if (existingFile.file_url) {
            // Ekstrak nama file dari path URL di database
            const fileName = path.basename(existingFile.file_url); 
            // console.log(fileName);
            const oldImagePath = path.resolve(__dirname, "../../public/laporan", fileName);
            console.log("Path file yang akan dihapus:", oldImagePath);
            // Hapus file lama jika ada
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
    } else {
        // Jika tidak ada file baru, gunakan yang lama
        const existingFile = await laporanModel.findFile(idFile);
        fileUrl = existingFile.file_url;
    }
  
      // Lakukan update
    //   await usersModel.updateUsers(body, idUser, imageUrl);
      await laporanModel.updateFile(body, idFile, fileUrl);
  
      res.json({
        message: "Update File success",
        status: "success",
        status_code: "200",
        data: {
          id: idFile,
          ...body,
          file_url: fileUrl, // Sertakan URL gambar baru/lama dalam respons
        },
      });
    } catch (error) {
      console.error("Error in update File:", {
        idFile,
        body,
        file: req.file,
        error,
      });
  
      res.status(500).json({
        message: "Internal Server Error",
        status: "failed",
        status_code: "500",
        serverMessage: error.message,
      });
    }
  }

  const deleteFile = async(req, res)=>{
      const {idFile} = req.params
      const {body} = req;
      try {
          await laporanModel.deleteFile(body, idFile);
          res.json({
              message : "Delete File Success",
              status : "success",
              status_code : "200",
              data : {
                  id : idFile,
                  ...body
              },
          })
      } catch (error) {
          res.status(500).json({
              message : "Internal Server Error",
              status : 'failed',
              status_code : '500',
              serverMessage : error,
          })
          console.log(error)
      }
      
  }


module.exports={
    getAllFiles,
    UploadFile,
    updateFile,
    deleteFile

}