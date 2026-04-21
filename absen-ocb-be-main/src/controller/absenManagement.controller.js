
const absenManagementModel = require('../models/absenManagement.model');

const getAlltypeAbsen = async(req, res) =>{
    try{
        const [data] = await absenManagementModel.getAlltypeAbsen();
        res.json({
            message: 'Get All Type Absen Success',
            status : "success",
            status_code : "200",
            data : data
        })
    }
    catch(error){
        res.status(500).json({
            message : "Internal Server Error",
            status : "failed",
            status_code : "500",
            serverMessage : error
        })
    }
    
}

const getTypeAbsenWithGroups = async (req, res) => {
    try {
      const data = await absenManagementModel.getTypeAbsenWithGroups();
  
      if (data.length === 0) {
        return res.status(404).json({
          message: "Tipe Absen not found",
          status: "failed",
          status_code: "404",
        });
      }
      console.log("Data sebelum sorting:", data);
  
      // Group data berdasarkan absen_id
      const groupedData = data.reduce((result, row) => {
        const {
          absen_id,
          name,
          description,
          fee,
          start_time,
          end_time,
          kategori_absen,
          created_at,
          created_by,
        } = row;
  
        // Jika absen_id belum ada di hasil, tambahkan
        if (!result[absen_id]) {
          result[absen_id] = {
            absen_id,
            name,
            description,
            fee,
            start_time,
            end_time,
            kategori_absen,
            created_at,
            created_by,
            groups: [],
          };
        }
  
        // Tambahkan group jika ada data group_absen_id
        if (row.group_absen_id) {
          result[absen_id].groups.push({
            group_absen_id: row.group_absen_id,
            id_category: row.id_category,
            category_user: row.category_user,
            created_at: row.group_created_at,
            created_by: row.group_created_by,
          });
        }
  
        return result;
      }, {});
  
      // Ubah hasil menjadi array
      let formattedData = Object.values(groupedData);
  
      // Sort ulang berdasarkan created_at secara descending
      formattedData = formattedData.sort((a, b) => a.name.localeCompare(b.name));
  
      res.json({
        message: "Tipe Absen fetched successfully!",
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
  
  
  

const createNewAbsenType = async (req, res) => {
    const { body } = req;
    const { group_details } = body; // Array detail group absen
    try {

        const result = await absenManagementModel.createNewAbsenType(body);


        const absenTypeId = result.insertId;


        if (Array.isArray(group_details) && group_details.length > 0) {
            const groupDetails = group_details.map((group) => ({
                absen_type_id: absenTypeId,
                id_category: group.id_category,
                created_at: body.created_at,
                created_by: body.created_by,
            }));


            await absenManagementModel.createNewGroupAbsen(groupDetails);
        }else {
            // Jika group_details kosong atau tidak dikirim
            const groupDetails = [{
                absen_type_id: absenTypeId,
                id_category: 0, // Set id_category menjadi 0
                created_at: body.created_at,
                created_by: body.created_by,
            }];

            await absenManagementModel.createNewGroupAbsen(groupDetails);
        }

        res.json({
            message: 'Absen Type Created successfully!',
            status: 'success',
            status_code: '200',
            data: { ...body, id: absenTypeId },
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

const getTypeAbsen = async(req, res) =>{
    const {absenId} = req.params;
    try{
        const [data] = await absenManagementModel.getTypeAbsen(absenId);
        res.json({
            message: 'Get Detail Absen Type Success',
            status : "success",
            status_code : "200",
            data : data
        })
    }
    catch(error){
        res.status(500).json({
            message : "Internal Server Error",
            status : "failed",
            status_code : "500",
            serverMessage : error
        })
    }  
}

const getTypeAbsenPerShift = async(req, res) =>{
    const {userId} = req.params;
    let  isAbsenToday = '';
    try{
        const [data] = await absenManagementModel.getTypeAbsenPerShift(userId);
        const flagAbsen = await absenManagementModel.checkFlagAbsen(userId);
        if(flagAbsen){
            isAbsenToday = 1;
        }else{
            isAbsenToday = 0;
        }

        res.json({
            message: 'Get Detail Absen Type Shift Success',
            status : "success",
            status_code : "200",
            is_absen_today : isAbsenToday,
            data : data
        })
    }
    catch(error){
        res.status(500).json({
            message : "Internal Server Error",
            status : "failed",
            status_code : "500",
            serverMessage : error
        })
    }  
}



// const updateTypeAbsen = async(req, res)=>{
//     const {absenId} = req.params;
//     const {body} = req;
//     try {
//         await absenManagementModel.updateTypeAbsen(body, absenId);
//         // console.log('idUser: ', idUser);
//     res.json({
//         message: "Update Type Absen Success",
//         status : "success",
//         status_code : "200",
//         data : {
//             absenId : absenId,
//             ...body

//         },
//     })
//     } catch (error) {
//         res.status(500).json({
//             message : "Internal Server Error",
//             status : "failed",
//             status_code : "500",
//             serverMessage : error,
//         })
//         console.log(error)
//     }
    
// }
const updateAbsenType = async (req, res) => {
    const {absenId} = req.params;
   const {body} = req;
   const { group_details } = body;

    try {
        // Update data di tabel utama (absen_type)
        await absenManagementModel.updateAbsenType(body, absenId);

        // Hapus data group_absen lama
        await absenManagementModel.deleteGroupAbsenByAbsenTypeId(absenId, body.updated_by);

        // Jika group_details ada, tambahkan data baru ke group_absen
        if (Array.isArray(group_details) && group_details.length > 0) {
            const groupDetails = group_details.map((group) => ({
                absen_type_id: absenId,
                id_category: group.id_category,
                created_at: body.updated_at, // Gunakan waktu diperbarui
                created_by: body.updated_by,
            }));

            await absenManagementModel.createNewGroupAbsen(groupDetails);
        } else {
            // Jika group_details kosong, tambahkan default group dengan id_category 0
            const groupDetails = [
                {
                    absen_type_id: absenId,
                    id_category: 0,
                    created_at: body.updated_at,
                    created_by: body.updated_by,
                },
            ];

            await absenManagementModel.createNewGroupAbsen(groupDetails);
        }

        // Kirim respons berhasil
        res.json({
            message: "Absen Type Updated successfully!",
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



const deleteTypeAbsen = async(req, res)=>{
    const {absenId} = req.params
    const {body} = req
    try {
        await absenManagementModel.deleteTypeAbsen(body, absenId);
        res.json({
            message : "Delete Absen Type Success",
            status : "success",
            status_code : "200",
        })
    } catch (error) {
        res.status(500).json({
            message : "Internal Server Error",
            status : "failed",
            status_code : "500",
            serverMessage : error,
        })
        console.log(error)
    }
    
}



module.exports ={
    getAlltypeAbsen,
    getTypeAbsen,
    createNewAbsenType,
    deleteTypeAbsen,
    getTypeAbsenPerShift,
    getTypeAbsenWithGroups,
    updateAbsenType
}