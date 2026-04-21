const menuModel = require('../models/menu.model');
const moment = require('moment-timezone');
const timezone = 'Asia/Jakarta';


const getMenuCategoryUser = async(req, res)=>{
    const {idCategory} = req.params;
    try {
        const [data] = await menuModel.getMenuCategoryUser(idCategory);
        res.json({
            message:'Get Menu Category Successfully!',
            status : "success",
            status_code : "200",
            data :data 
        })
    } catch (error) {
        res.status(500).json({
            message : "Internal Server Error",
            status : "failed",
            status_code : "500",
            serverMessage : error,
            
        })
    }
}

const getAllMenuCategory = async(req, res) =>{
    try{
        const [data] = await menuModel.getAllMenucategory();
        res.json({
            message:'Get All Menu Category Successfully!',
            status : "success",
            status_code : "200",
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

const getAllMenu = async(req, res) =>{
    try{
        const [data] = await menuModel.getAllMenu();
        res.json({
            message:'Get All Menu Successfully!',
            status : "success",
            status_code : "200",
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

const createMenuConfig = async(req, res) =>{
    const {body} = req;
    try {

        // Simpan tipe absen baru ke database
        const result = await menuModel.createMenuConfig(body);
        res.json({
            message: 'Config Menu Created successfully!',
            status : 'success',
            status_code : '200',
            data: {
                id : result.insertId,
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

const updateMenuConfig = async(req, res)=>{
    const {idMenuConfig} = req.params;
    const {body} = req;
    try {
        await menuModel.updateMenuConfig(body, idMenuConfig);
        // console.log('idUser: ', idUser);
    res.json({
        message: "Update Menu Config Success",
        status : 'success',
        status_code : '200',
        data : {
            id : idMenuConfig,
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

const deleteMenuConfig = async(req, res)=>{
    const {idMenuConfig} = req.params
    const {body} = req;
    try {
        await menuModel.deleteMenuConfig(body, idMenuConfig);
        res.json({
            message : "Delete Menu Config Success",
            status : 'success',
            status_code : '200',
            data : {
                id_menu_config : idMenuConfig,
                ...body,
            }
        })
    } catch (error) {
        res.status(500).json({
            message : "Internal Server Error",
            serverMessage : error,
        })
        console.log(error)
    }
    
}


module.exports={
    getMenuCategoryUser,
    getAllMenuCategory,
    getAllMenu,
    createMenuConfig,
    updateMenuConfig,
    deleteMenuConfig

}