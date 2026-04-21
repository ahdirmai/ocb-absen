
const retailModel = require('../models/retailManagement.model');

const getAllRetail = async(req, res) =>{
    try{
        const [data] = await retailModel.getAllRetail();
        res.json({
            message: 'Get All Retail Success',
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
            serverMessage : error
        })
    }
    
}

const getRetail = async(req, res) =>{
    const {retailId} = req.params;
    try{
        const [data] = await retailModel.getRetail(retailId);
        res.json({
            message: 'Get Detail Retail Success',
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
            serverMessage : error
        })
    }
    
}

const updateRetail = async(req, res)=>{
    const {retailId} = req.params;
    const {body} = req;
    try {
        await retailModel.updateRetail(body, retailId);
        // console.log('idUser: ', idUser);
    res.json({
        message: "Update retail Success",
        status : 'success',
        status_code : '200',
        data : {
            retailId : retailId,
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

const createNewRetail = async(req, res) =>{
    const {body} = req;
    try {

        const result = await retailModel.createNewRetail(body);

        const newRetailId = result.insertId;
        res.json({
            message: 'Retail Created successfully!',
            status : 'success',
            status_code : '200',
            data: {
                retail_id: newRetailId,
                ...body,
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

const deleteRetail = async(req, res)=>{
    const {retailId} = req.params
    const {body} = req
    try {
        await retailModel.deleteRetail(body, retailId);
        res.json({
            message : "Delete retail Success",
            status : 'success',
            status_code : '200',
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



module.exports ={
    getAllRetail,
    getRetail,
    updateRetail,
    createNewRetail,
    deleteRetail
}