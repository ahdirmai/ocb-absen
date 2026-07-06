
const summaryModel = require('../models/summary.model')

const getTottalDaily = async(req, res) =>{
    try{
        const [result] = await summaryModel.getTottalDaily();
        console.log(result); 
        
        
        const dailyData = result[0]; 

    
        const getTotalDaily = [
            { label: 'Total Absensi', value: dailyData.total_absensi },
            { label: 'Total Ontime', value: dailyData.total_ontime },
            { label: 'Total Late', value: dailyData.total_late }
        ];
        res.json({
            getTotalDaily
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

const getChartTotalAbsensi = async(req, res) =>{
    try{
        const [rows] = await summaryModel.getChartTotalAbsensi();
        const response = rows.map(row => ({
            retail_name: row.retail_name,
            total_absensi: row.total_absensi,
            total_ontime: row.total_ontime,
            total_late: row.total_late,
          }));
      
          res.json(response);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Error retrieving data' });
        }
    }
    
    


const getTotalFee = async(req, res) =>{
    try{
        const [data] = await summaryModel.getTotalFee();
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

const getTotalFeeDaily = async(req, res) =>{
    try{
        const [data] = await summaryModel.getTotalFeeDaily();
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







const BULAN_REGEX = /^(0[1-9]|1[0-2])-\d{4}$/;

const parseBulan = (bulan) => {
    if (bulan === undefined) return { bulan: null };
    if (!BULAN_REGEX.test(bulan)) return { error: true };
    return { bulan };
};

const getTopOntimeMonthly = async(req, res) =>{
    try{
        const { bulan, error } = parseBulan(req.query.bulan);
        if (error) {
            return res.status(400).json({
                message : "Format bulan tidak valid. Gunakan MM-YYYY",
                status : 'failed',
                status_code : '400',
            });
        }
        const [rows] = await summaryModel.getTopOntimeMonthly(bulan);
        const data = rows.map((row, index) => ({
            ranking: index + 1,
            nama: row.nama,
            retail: row.retail_name,
            jumlah: Number(row.jumlah),
        }));
        res.json({ data })
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

const getTopLateMonthly = async(req, res) =>{
    try{
        const { bulan, error } = parseBulan(req.query.bulan);
        if (error) {
            return res.status(400).json({
                message : "Format bulan tidak valid. Gunakan MM-YYYY",
                status : 'failed',
                status_code : '400',
            });
        }
        const [rows] = await summaryModel.getTopLateMonthly(bulan);
        const data = rows.map((row, index) => ({
            ranking: index + 1,
            nama: row.nama,
            retail: row.retail_name,
            jumlah: Number(row.jumlah),
        }));
        res.json({ data })
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

module.exports={
    getTottalDaily,
    getTotalFee,
    getChartTotalAbsensi,
    getTotalFeeDaily,
    getTopOntimeMonthly,
    getTopLateMonthly
}