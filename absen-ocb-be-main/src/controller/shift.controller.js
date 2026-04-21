
const shifthingModel = require('../models/shift.model')

const getAllShifting = async(req, res) =>{
    try{
        const [data] = await shifthingModel.getAllShifting();
        res.json({
            message: 'Get All Shifting Success',
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

const getTypeShiftWithEmployes = async (req, res) => {
    try {
      const data = await shifthingModel.getTypeShiftWithEmployes();
  
      if (data.length === 0) {
        return res.status(404).json({
          message: "Shifting not found",
          status: "failed",
          status_code: "404",
        });
      }

  
      // Group data berdasarkan absen_id
      const groupedData = data.reduce((result, row) => {
        const {
          shifting_id,
          user_id,
          retail_id,
          start_date,
          end_date,
          retail_name,
          created_at,
          created_by,
          name,
        } = row;
  
     
        if (!result[shifting_id]) {
          result[shifting_id] = {
            shifting_id,
          user_id,
          retail_id,
          start_date,
          end_date,
          name,
          retail_name,
          created_at,
          created_by,
            detail_user: [],
          };
        }
  

        if (row.shift_employe_id) {
          result[shifting_id].detail_user.push({
            shift_employe_id: row.shift_employe_id,
            user_id: row.user_id,
            name: row.name,
          });
        }
  
        return result;
      }, {});
  
      // Ubah hasil menjadi array
      let formattedData = Object.values(groupedData);
  
      // Sort ulang berdasarkan created_at secara descending
      formattedData = formattedData.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
  
      res.json({
        message: "Shift fetched successfully!",
        status: "success",
        status_code: "200",
        data: formattedData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        status: "failed",
        status_code: "500",
        serverMessage: error.message,
      });
    }
  };

const createNewShift = async (req, res) => {
    const { body } = req;
    const { employes_shift } = body; 
    try {

        const result = await shifthingModel.createNewShift(body);


        const shiftingId = result.insertId;


        if (Array.isArray(employes_shift) && employes_shift.length > 0) {
            const employesShift = employes_shift.map((group) => ({
                shifting_id: shiftingId,
                user_id: group.user_id,
                created_at: body.created_at,
                created_by: body.created_by,
            }));


            await shifthingModel.createNewShiftEmployes(employesShift);
        }else {
            // Jika group_details kosong atau tidak dikirim
            const employesShift = [{
                shifting_id: shiftingId,
                user_id: 0, // Set id_category menjadi 0
                created_at: body.created_at,
                created_by: body.created_by,
            }];

            await shifthingModel.createNewShiftEmployes(employesShift);
        }

        res.json({
            message: 'Shif Created successfully!',
            status: 'success',
            status_code: '200',
            data: { ...body, id: shiftingId },
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
            status: 'failed',
            status_code: '500',
            serverMessage: error,
        });
    }
};

const getShiftDetail = async(req, res) =>{
    const {shiftingId} = req.params;
    try{
        const [data] = await shifthingModel.getShiftDetail(shiftingId);
        res.json({
            message: 'Get Detail Shifting Type Success',
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

// const createNewShift = async(req, res) =>{
//     const {body} = req;
//     try {

//         // Simpan tipe absen baru ke database
//         await shifthingModel.createNewShift(body);
//         res.json({
//             message: 'Shifting Created successfully!',
//             status : 'success',
//             status_code : '200',
//             data: req.body
//         })
//         // Error jika gagal simpan ke DB
//     } catch (error) {
//         res.status(500).json({
//             message : "Internal Server Error",
//             status : 'failed',
//             status_code : '500',
//             serverMessage : error,
//         })
//     }
// }

// const updateShift = async(req, res)=>{
//     const {shiftingId} = req.params;
//     const {body} = req;
//     try {
//         await shifthingModel.updateShifting(body, shiftingId);
//         // console.log('idUser: ', idUser);
//     res.json({
//         message: "Update Shifting Success",
//         status : 'success',
//         status_code : '200',
//         data : {
//             shifting_id : shiftingId,
//             ...body

//         },
//     })
//     } catch (error) {
//         res.status(500).json({
//             message : "Internal Server Error",
//             status : 'failed',
//             status_code : '500',
//             serverMessage : error,
//         })
//         console.log(error)
//     }
    
// }

const updateShift = async (req, res) => {
    const {shiftingId} = req.params;
   const {body} = req;
   const { employes_shift } = body;

    try {
        // Update data di tabel utama (absen_type)
        await shifthingModel.updateShifting(body, shiftingId);

        // Hapus data group_absen lama
        await shifthingModel.deleteShiftEmployesByShifthingId(shiftingId);
        
        
        if (Array.isArray(employes_shift) && employes_shift.length > 0) {
            const employesShift = employes_shift.map((group) => ({
                shifting_id: shiftingId,
                user_id: group.user_id,
                created_at: body.updated_at, // Gunakan waktu diperbarui
                created_by: body.updated_by,
            }));

            await shifthingModel.createNewShiftEmployes(employesShift);
        } else {
          
            const employesShift = [
                {
                    shifting_id: shiftingId,
                    user_id: 0,
                    created_at: body.updated_at,
                    created_by: body.updated_by,
                },
            ];

            await shifthingModel.createNewShiftEmployes(employesShift);
        }

        // Kirim respons berhasil
        res.json({
            message: "Shifting Updated successfully!",
            status: "success",
            status_code: "200",
            data: body,
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            status: "failed",
            status_code: "500",
            serverMessage: error,
        });
    }
};

const deleteShift = async(req, res)=>{
    const {shiftingId} = req.params
    const {body} = req;
    try {
        await shifthingModel.deleteShift(body, shiftingId);
        res.json({
            message : "Delete Shift Success",
            status : 'success',
            status_code : '200',
            data : {
                shiftingId : shiftingId,
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
    getAllShifting,
    getShiftDetail,
    createNewShift,
    updateShift,
    deleteShift,
    getTypeShiftWithEmployes
}