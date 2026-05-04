const feeModel = require('../models/fee.model');
const usersModel = require('../models/user.model');

const createOffDay = async (req, res) => {
    const { body } = req;
    const { tanggal, employes_offday } = body; // Ambil tanggal & employes_offday dari request body

    try {
        if (!Array.isArray(tanggal) || tanggal.length === 0) {
            return res.status(400).json({
                message: "Tanggal harus berupa array dan tidak boleh kosong",
                status: "failed",
                status_code: "400",
            });
        }

        // Simpan tiap tanggal sebagai baris terpisah di tabel `offday`
        const offdayIds = [];
        for (const date of tanggal) {
            const result = await feeModel.createOffDay({
                tanggal: date,
                type_off: body.type_off,
                reason: body.reason,
                created_at: body.created_at,
                created_by: body.created_by,
            });
            offdayIds.push(result.insertId);
        }

        // Simpan ke `offday_employes`
        if (Array.isArray(employes_offday) && employes_offday.length > 0) {
            const employesOffDay = [];

            for (const idOffday of offdayIds) {
                for (const group of employes_offday) {
                    employesOffDay.push({
                        id_offday: idOffday,
                        user_id: group.user_id,
                        created_at: body.created_at,
                        created_by: body.created_by,
                    });
                }
            }

            await feeModel.createOffDayEmployes(employesOffDay);
        } else {
            // Jika tidak ada employes_offday, tetap simpan dengan user_id = 0
            const employesOffDay = offdayIds.map(idOffday => ({
                id_offday: idOffday,
                user_id: 0,
                created_at: body.created_at,
                created_by: body.created_by,
            }));

            await feeModel.createOffDayEmployes(employesOffDay);
        }

        res.json({
            message: "OffDay Created successfully!",
            status: "success",
            status_code: "200",
            data: { ...body, id_offdays: offdayIds }
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


const createBonus = async(req, res) =>{
    const {body} = req;
    const { month , employes_bonus } = body;
    try {

        if (!Array.isArray(month) || month.length === 0) {
            return res.status(400).json({
                message: "Tanggal harus berupa array dan tidak boleh kosong",
                status: "failed",
                status_code: "400",
            });
        }

        const bonusdayIds = [];
        for (const date of month) {
            const result = await feeModel.createBonus({
                month: date,
                bonus : body.bonus,
                type_pb: body.type_pb,
                reason: body.reason,
                created_at: body.created_at,
                created_by: body.created_by,
            });
            bonusdayIds.push(result.insertId);
        }

                 if (Array.isArray(employes_bonus) && employes_bonus.length > 0) {
                    const employesBonus = [];
        
                    for (const idBonus of bonusdayIds) {
                        for (const group of employes_bonus) {
                            employesBonus.push({
                                id_bonus: idBonus,
                                user_id: group.user_id,
                                created_at: body.created_at,
                                created_by: body.created_by,
                            });
                        }
                    }
        
                    await feeModel.createBonusEmployes(employesBonus);
                } else {
                    // Jika tidak ada employes_offday, tetap simpan dengan user_id = 0
                    const employesBonus = bonusdayIds.map(idBonus => ({
                        id_bonus: idBonus,
                        user_id: 0,
                        created_at: body.created_at,
                        created_by: body.created_by,
                    }));
        
                    await feeModel.createBonusEmployes(employesBonus);
                }
        res.json({
            message: 'Bonus/Punishment Created successfully!',
            status : 'success',
            status_code : '200',
            data: {...body, id_bonuss: bonusdayIds}
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

const updateOffDay = async(req, res)=>{
    const {idOffday} = req.params;
    const {body} = req;
    const { employes_offday } = body;

    try {


        await feeModel.updateOffDay(body, idOffday);
        await feeModel.deleteOffDaymployesByIdOffday(idOffday);

        if (Array.isArray(employes_offday) && employes_offday.length > 0) {
                    const employesOffDay = employes_offday.map((group) => ({
                        id_offday: idOffday,
                        user_id: group.user_id,
                        created_at: body.updated_at, // Gunakan waktu diperbarui
                        created_by: body.updated_by,
                    }));
        
                    await feeModel.createOffDayEmployes(employesOffDay);
                } else {
                  
                    const employesOffDay = [
                        {
                            id_offday: idOffday,
                            user_id: 0,
                            created_at: body.updated_at,
                            created_by: body.updated_by,
                        },
                    ];
        
                    await feeModel.createOffDayEmployes(employesOffDay);
                }
        // console.log('idUser: ', idUser);
    res.json({
        message: "Update OffDay Success",
        status : 'success',
        status_code : '200',
        data : {
            id_offday : idOffday,
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

const updateBonus = async(req, res)=>{
    const {bonusID} = req.params;
    const {body} = req;
    const { employes_bonus } = body;
    console.log(bonusID);
    try {

        await feeModel.updateBonus(body, bonusID);
        await feeModel.deleteBonusmployesByIdBonus(bonusID);

        if (Array.isArray(employes_bonus) && employes_bonus.length > 0) {
            const employesBonus = employes_bonus.map((group) => ({
                id_bonus: bonusID,
                user_id: group.user_id,
                created_at: body.updated_at, // Gunakan waktu diperbarui
                created_by: body.updated_by,
            }));

            await feeModel.createBonusEmployes(employesBonus);
        } else {
          
            const employesBonus = [
                {
                    id_bonus: bonusID,
                    user_id: 0,
                    created_at: body.updated_at,
                    created_by: body.updated_by,
                },
            ];

            await feeModel.createBonusEmployes(employesBonus);
        }
    res.json({
        message: "Update Bonus Success",
        status : 'success',
        status_code : '200',
        data : {
            id_bonus : bonusID,
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

const deleteOffDay = async(req, res)=>{
    const {offID} = req.params
    const {body} = req;
    try {
        await feeModel.deleteOffDay(body, offID);
        await feeModel.deleteOffDaymployesByIdOffday(offID);
        res.json({
            message : "Delete OffDay Success",
            status : 'success',
            status_code : '200',
            data : {
                id_off : offID,
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

const deleteBonus = async(req, res)=>{
    const {bonusID} = req.params
    const {body} = req;
    try {
        await feeModel.deleteBonus(body, bonusID);
        await feeModel.deleteBonusmployesByIdBonus(bonusID);
        res.json({
            message : "Delete Bonus Success",
            status : 'success',
            status_code : '200',
            data : {
                id_bonys : bonusID,
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


const getAllDayOff = async(req, res) =>{
    try{
        const [data] = await feeModel.getAllDayOff();
        res.json({
            message: 'Get All User Offday Success',
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

const getOffDaytWithEmployes = async (req, res) => {
    try {
      const data = await feeModel.getOffDaytWithEmployes();
  
      if (data.length === 0) {
        return res.status(200).json({
          message: "OffDay not found",
          status: "success",
          status_code: "200",
          data : []
        });
      }

      const groupedData = data.reduce((result, row) => {
        const {
          id_offday,
          reason,
          type_off,
          id_type_off,
          name,
          user_id,
          tanggal,
          created_at,
        } = row;
  
     
        if (!result[id_offday]) {
          result[id_offday] = {
          id_offday,
          reason,
          type_off,
          id_type_off,
          name,
          user_id,
          tanggal,
          created_at,
          detail_user: [],
          };
        }
  

        if (row.off_employe_id) {
          result[id_offday].detail_user.push({
            off_employe_id: row.off_employe_id,
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
        message: "OffDay fetched successfully!",
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

  const getBonustWithEmployes = async (req, res) => {
    try {
      const data = await feeModel.getBonustWithEmployes();
  
      if (data.length === 0) {
        return res.status(200).json({
          message: "Bonus/Punishment not found",
          status: "success",
          status_code: "200",
          data : []
        });
      }

      const groupedData = data.reduce((result, row) => {
        const {
          id_bonus,
          reason,
          bonus,
          type_pb,
          id_type_pb,
          name,
          user_id,
          month,
        } = row;
  
     
        if (!result[id_bonus]) {
          result[id_bonus] = {
            id_bonus,
            reason,
            bonus,
            type_pb,
            id_type_pb,
            name,
            user_id,
            month,
          detail_user: [],
          };
        }
  

        if (row.bonus_employe_id) {
          result[id_bonus].detail_user.push({
            off_employe_id: row.bonus_employe_id,
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
        message: "Bonus fetched successfully!",
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

const getAllBonus = async(req, res) =>{
    try{
        const [data] = await feeModel.getAllBonus();
        res.json({
            message: 'Get All Bonus Success',
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

const getAllCuti = async(req, res) =>{
    try{
        const [data] = await feeModel.getTotalFee();
        res.json({
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

const getTypeOff = async(req, res) =>{
    try{
        const [data] = await feeModel.getTypeOff();
        res.json({
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
const getTypePB = async(req, res) =>{
    try{
        const [data] = await feeModel.getTypePB();
        res.json({
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

const getSalaryKaryawan= async(req, res) =>{
    try{
        const idPotongan = 2;
        const getPotonganMangkir = await usersModel.getPotonganMangkir(idPotongan);
        const PotonganMangkir = getPotonganMangkir.value;
        const [data] = await feeModel.getSalaryKaryawan(PotonganMangkir);
        res.json({
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

const getSalaryKaryawanByMonth = async (req, res) => {
    const { month } = req.query;
    try {
        const idPotongan = 2;
        const getPotonganMangkir = await usersModel.getPotonganMangkir(idPotongan);
        const PotonganMangkir = getPotonganMangkir.value;

        let data;
        if (month) {
            [data] = await feeModel.getSalaryKaryawanByMonth(PotonganMangkir, month);
        } else {
            [data] = await feeModel.getSalaryKaryawan(PotonganMangkir);
        }

        res.json({ data });
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error',
            status: 'failed',
            status_code: '500',
            serverMessage: error,
        });
    }
};

const getPotongan = async(req, res) =>{
    try{
        const [data] = await feeModel.getPotongan();
        res.json({
            message: 'Get All Potongan Success',
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

const updatePotongan = async(req, res)=>{
    const {potonganID} = req.params;
    const {body} = req;
    try {
        await feeModel.updatePotongan(body, potonganID);
        // console.log('idUser: ', idUser);
    res.json({
        message: "Update Potongan Success",
        status : 'success',
        status_code : '200',
        data : {
            id_potongan : potonganID,
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
    getAllDayOff,
    getAllCuti,
    getTypeOff,
    createOffDay,
    updateOffDay,
    deleteOffDay,
    getAllBonus,
    createBonus,
    deleteBonus,
    updateBonus,
    getSalaryKaryawan,
    getSalaryKaryawanByMonth,
    getTypePB,
    getPotongan,
    updatePotongan,
    getOffDaytWithEmployes,
    getBonustWithEmployes
}