
const { off } = require('../config/database');
const managementUserModel = require('../models/managementUser.model')


const getAllRoleUser = async(req, res) =>{
    try{
        const [data] = await managementUserModel.getAllRoleUser();
        res.json({
            message: 'Get All User Role Success',
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

const getAllCategoryUser = async(req, res) =>{
    try{
        const [data] = await managementUserModel.getAllCategoryUser();
        res.json({
            message: 'Get All User Category Success',
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

const createRoles = async(req, res) =>{
    const {body} = req;
    try {

        // Simpan tipe absen baru ke database
        const result = await managementUserModel.createRoles(body);
        res.json({
            message: 'Roles Created successfully!',
            status : 'success',
            status_code : '200',
            data: {
              role_id : result.insertId,
              ...body
            }
        })
        // Error jika gagal simpan ke DB
    } catch (error) {
        res.status(500).json({
            message : "Internal Server Error",
            status : 'failed',
            status_code : '500',
            serverMessage : error,
        })
    }
}

const createCategory = async(req, res) =>{
    const {body} = req;
    try {

        // Simpan tipe absen baru ke database
        const result = await managementUserModel.createCategory(body);
        res.json({
            message: 'User Category Created successfully!',
            status : 'success',
            status_code : '200',
            data: {
              id_category : result.insertId,
              ...body
            }
        })
        // Error jika gagal simpan ke DB
    } catch (error) {
        res.status(500).json({
            message : "Internal Server Error",
            status : 'failed',
            status_code : '500',
            serverMessage : error,
        })
    }
}

const updateRoles = async (req, res) => {
    const { idRole } = req.params;
    const { body } = req;
    try {

      await managementUserModel.updateRoles(body, idRole);
  
      res.json({
        message: "Update User Role success",
        status: "success",
        status_code: "200",
        data: {
          role_id: idRole,
          ...body,
        },
      });
    } catch (error) {
      console.error("Error in update Role:", {
        body,
       error
      });
  
      res.status(500).json({
        message: "Internal Server Error",
        status: "failed",
        status_code: "500",
        serverMessage: error.message,
      });
    }
  };

  const updateCategory = async (req, res) => {
    const { idCategory } = req.params;
    const { body } = req;
    try {

      await managementUserModel.updateCategory(body, idCategory);
  
      res.json({
        message: "Update User Category success",
        status: "success",
        status_code: "200",
        data: {
          id_category: idCategory,
          ...body,
        },
      });
    } catch (error) {
      console.error("Error in update Category:", {
        body,
        error,
      });
  
      res.status(500).json({
        message: "Internal Server Error",
        status: "failed",
        status_code: "500",
        serverMessage: error.message,
      });
    }
  };
  







module.exports={
    getAllRoleUser,
    createRoles,
    getAllCategoryUser,
    createCategory,
    updateRoles,
    updateCategory
   
}