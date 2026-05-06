const dbpool = require('../config/database');


const createAbsensi = async (body, imageUrl, status_absen, status_approval, upline, timeAbsenFull, potongan, is_valid) => {
    const query = `INSERT INTO absensi (user_id, retail_id, absen_type_id, absen_time, latitude, longitude, reason, potongan, photo_url, is_approval, approval_by, status_absen, status_approval, is_valid)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      body.user_id,
      body.retail_id,
      body.absen_type_id,
      timeAbsenFull,
      body.latitude,
      body.longitude,
      body.reason,
      potongan,
      imageUrl,
      body.is_approval,
      upline,
      status_absen,
      status_approval,
      is_valid
    ];
  
    // Eksekusi query untuk insert data absensi
    const [result] = await dbpool.query(query, values);
  
    // Log Query ke Tabel log_activity
    const logQuery = `
      INSERT INTO log_activity (table_name, action, dataquery, user_id)
      VALUES (?, ?, ?, ?)
    `;
    const logValues = [
      'absensi', // Nama tabel yang terlibat
      'INSERT',  // Tindakan yang dilakukan
      dbpool.escape(query.replace(/\?/g, () => dbpool.escape(values.shift()))), // Menggantikan ? dengan nilai dari values
      body.user_id // user_id yang melakukan aksi insert
    ];
  
    // Eksekusi query log untuk menyimpan aktivitas
    await dbpool.query(logQuery, logValues);
  
    return result;
  };
  

const getTimeDB = async (absen_id, retail_id) => {
    const [results] = await dbpool.query('SELECT * FROM tipe_absen WHERE absen_id = ?', [absen_id]);
    return results[0];
    
}

const getUpline = async (user_id) => {
    const [user] = await dbpool.query('SELECT upline FROM user WHERE user_id = ? ', [user_id]);
    return user[0];
    
}

const getPotonganLate = async (idPotongan) => {
    const [potongan] = await dbpool.query('SELECT value FROM potongan WHERE id = ? ', [idPotongan]);
    return potongan[0];
    
}

const approveAbsen =(approved_at, absenId)=>{
    const SQLQuery = `UPDATE  absensi set status_approval=2, approved_at ='${approved_at}' WHERE absensi_id =${absenId}`;

    return dbpool.execute(SQLQuery);
}
const rejectAbsen =(approved_at, absenId)=>{
    const SQLQuery = `UPDATE  absensi set status_approval=3, approved_at ='${approved_at}' WHERE absensi_id =${absenId}`;

    return dbpool.execute(SQLQuery);
}

const validasiAbsen =(body, absenId)=>{
    const SQLQuery = `UPDATE  absensi set is_valid ='${body.is_valid}' WHERE absensi_id =${absenId}`;

    return dbpool.execute(SQLQuery);
}



// const getTimeDB = async (absen_id, retail_id, time) => {
//     const [results] = await dbpool.query('SELECT absen_id FROM tipe_absen WHERE absen_id = ? AND retail_id = ? AND ? BETWEEN start_time AND end_time', [absen_id, retail_id, time]);
//     return results[0];
    
// }

const historyAbsensiPerUser = async (userId, body) => {
    let SQLQuery = `
        SELECT 
            a.absensi_id, a.user_id, u.name AS nama_karyawan, a.absen_time, 
            a.retail_id, r.name AS retail_name, a.absen_type_id, a.photo_url,
            ta.name AS category_absen, ta.description, ta.fee, a.reason, 
            sa.description AS status, uap.name AS approval_by, ap.description_status AS status_approval, a.is_valid 
        FROM absensi a 
        JOIN user u ON u.user_id = a.user_id  
        JOIN retail r ON r.retail_id = a.retail_id 
        JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id 
        JOIN absen_status sa ON sa.status_id = a.status_absen
        LEFT JOIN approval_status ap ON ap.id = a.status_approval
        JOIN user uap ON uap.user_id = a.approval_by
        WHERE a.user_id = ? `;

    const params = [userId]; 

    if (body.start_date) {
        SQLQuery += ` AND DATE(a.absen_time) >= ?`;
        params.push(body.start_date);
    }
    if (body.end_date) {
        SQLQuery += ` AND DATE(a.absen_time) <= ?`;
        params.push(body.end_date);
    }

   
    if (!body.start_date && !body.end_date) {
        SQLQuery += ` AND MONTH(a.absen_time) = MONTH(CURDATE()) 
                      AND YEAR(a.absen_time) = YEAR(CURDATE())`;
    }

    SQLQuery += ` ORDER BY a.absen_time DESC`;

    // console.log("Executing SQL:", SQLQuery, params);
    return dbpool.execute(SQLQuery, params);
};


const listAbsensiApproval = async(approvalId) =>{
    const SQLQuery =`SELECT a.absensi_id, a.user_id, u.name as nama_karyawan, a.absen_time, a.retail_id, r.name as retail_name, a.absen_type_id, a.photo_url,
    ta.name as category_absen, ta.description, ta.fee, a.reason, sa.description as status , uap.name as approval_by, ap.description_status as status_approval
    FROM absensi a JOIN user u ON u.user_id = a.user_id  
    JOIN retail r ON r.retail_id = a.retail_id 
    JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id 
    JOIN absen_status sa ON sa.status_id = a.status_absen
    LEFT JOIN approval_status ap ON ap.id = a.status_approval
    JOIN user uap ON uap.user_id = a.approval_by
    WHERE a.approval_by =${approvalId} AND a.is_approval = '1' ORDER BY a.absen_time DESC`;

    
    return dbpool.execute(SQLQuery);

}

const totalAbsenPerMonth = async (user_id, body) => {
    let SQLQuery = `
        SELECT 
            COUNT(a.absensi_id) AS total_absensi,
            SUM(CASE WHEN a.status_absen = '1' THEN 1 ELSE 0 END) AS total_ontime,
            SUM(CASE WHEN a.status_absen = '2' THEN 1 ELSE 0 END) AS total_late
        FROM absensi a 
        JOIN user u ON u.user_id = a.user_id
        WHERE a.user_id = ? `;

    const params = [user_id]; 

    if (body.start_date) {
        SQLQuery += ` AND DATE(a.absen_time) >= ?`;
        params.push(body.start_date);
    }
    if (body.end_date) {
        SQLQuery += ` AND DATE(a.absen_time) <= ?`;
        params.push(body.end_date);
    }

    
    if (!body.start_date && !body.end_date) {
        SQLQuery += ` AND MONTH(a.absen_time) = MONTH(CURDATE()) 
                      AND YEAR(a.absen_time) = YEAR(CURDATE())`;
    }

    // console.log("Executing SQL:", SQLQuery, params);
    return dbpool.execute(SQLQuery, params);
};


const cekFeePeruser = async(userId) =>{
    const SQLQuery =`SELECT 
                    DATE_FORMAT(a.absen_time, '%Y-%m') AS month,
                    SUM(ta.fee) AS total_fee
                    FROM 
                        absensi a JOIN tipe_absen ta 
                         ON ta.absen_id=a.absen_type_id
                    WHERE 
                        a.user_id = '${userId}'
                        AND a.is_valid=1
                    GROUP BY 
                        DATE_FORMAT(a.absen_time, '%Y-%m')
                    ORDER BY 
                        month;`;
    return dbpool.execute(SQLQuery);

}

// const historyAbsensiAllUser = async() =>{
//     const SQLQuery =`SELECT a.absensi_id, a.user_id, u.name as nama_karyawan, a.absen_time, a.retail_id, r.name as retail_name, a.absen_type_id, 
//     ta.name as category_absen, ta.description, ta.fee, uz.name as Approval, a.is_valid, a.photo_url
//     FROM absensi a JOIN user u ON u.user_id = a.user_id  
//     JOIN retail r ON r.retail_id = a.retail_id 
//     JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id 
//     LEFT JOIN user uz ON uz.user_id = a.approval_by
//     ORDER BY a.absen_time DESC`;
//     return dbpool.execute(SQLQuery);
// }
const historyAbsensiAllUser = async (start_date, end_date) => {
    let SQLQuery = `
      SELECT 
        a.absensi_id, 
        a.user_id, 
        u.name AS nama_karyawan, 
        a.absen_time, 
        a.retail_id, 
        r.name AS retail_name, 
        a.absen_type_id, 
        ta.name AS category_absen, 
        ta.description, 
        ta.fee, 
        uz.name AS Approval, 
        a.is_valid, 
        a.reason,
        a.photo_url
      FROM absensi a 
      JOIN user u ON u.user_id = a.user_id  
      JOIN retail r ON r.retail_id = a.retail_id 
      JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id 
      LEFT JOIN user uz ON uz.user_id = a.approval_by
    `;

    const params = [];
    let whereClause = '';

    if (start_date) {
      whereClause += `DATE(a.absen_time) >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      whereClause += whereClause ? ` AND DATE(a.absen_time) <= ?` : `DATE(a.absen_time) <= ?`;
      params.push(end_date);
    }
    if (whereClause) {
      SQLQuery += ` WHERE ` + whereClause;
    }
    SQLQuery += ` ORDER BY a.absen_time DESC`;
    return dbpool.execute(SQLQuery, params);
};







const cekAbesensiToday = async (user_id, absen_type_id) => {
    const [results] = await dbpool.query(
        "SELECT * FROM absensi WHERE user_id = ? AND absen_type_id = ? AND DATE(absen_time) = CURDATE()", 
        [user_id, absen_type_id]
    );

    //console.log("Hasil Query:", results); 

    return results.length > 0 ? results[0] : null; 
};







module.exports={
    createAbsensi,
    historyAbsensiPerUser,
    cekFeePeruser,
    historyAbsensiAllUser,
    listAbsensiApproval,
    totalAbsenPerMonth,
    getTimeDB,
    getUpline,
    approveAbsen,
    rejectAbsen,
    validasiAbsen,
    getPotonganLate,
    cekAbesensiToday
}