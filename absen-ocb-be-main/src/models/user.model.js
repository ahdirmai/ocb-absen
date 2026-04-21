const dbpool = require('../config/database');

const getAllUsers = async () =>{
    const SQLQuery =`SELECT u.user_id, u.username, u.name, u.imei, ur.name_role as role, ur.role_id, u.photo_url, uc.category_user, uc.id_category, up.name as upline, up.user_id as id_upline, u.enabled  FROM user u 
                    jOIN user_category uc ON uc.id_category = u.category_user
                      JOIN user_role ur ON uc.role_id = ur.role_id
                    LEFT JOIN user up ON up.user_id = u.upline WHERE u.is_deleted=0 ORDER BY u.user_id desc`;
    return dbpool.execute(SQLQuery);
}

const getUserUpline =async (idUser) =>{
    const SQLQuery =`SELECT 
                    u.user_id, 
                    u.username, 
                    u.name, 
                    u.photo_url, 
                    uc.category_user, 
                    CASE 
                        WHEN o.id IS NOT NULL THEN 'Off'
                        ELSE 'Masuk'
                    END AS status_kehadiran,
                    o.reason
                FROM 
                    user u
                JOIN 
                    user_category uc ON uc.id_category = u.category_user
                LEFT JOIN 
                    user up ON up.user_id = u.upline
                LEFT JOIN 
                    offday o ON o.user_id = u.user_id 
                            AND o.tanggal = CURRENT_DATE() 
                            AND o.is_deleted = 0
                WHERE 
                    u.is_deleted = 0 
                    AND u.upline =${idUser} 
                ORDER BY 
                    u.user_id DESC;
                `;

    return dbpool.execute(SQLQuery);
}
// const profileUsers = (idUser) =>{
//     const SQLQuery = `SELECT u.user_id, u.username, u.name, u.imei,  up.name as upline, up.user_id as id_upline, r.name as retail_name,
//                       ur.name_role as role, ur.role_id, uc.category_user, uc.id_category, u.photo_url  FROM user u
//                       jOIN user_category uc ON uc.id_category = u.category_user
//                       JOIN user_role ur ON uc.role_id = ur.role_id
//                       LEFT JOIN user up ON up.user_id = u.upline
//                       LEFT JOIN shifting s ON s.user_id = u.user_id AND CURDATE() between  s.start_date AND s.end_date
//                       LEFT JOIN retail r ON r.retail_id = s.retail_id
//                       WHERE u.user_id =${idUser} `;

//     return dbpool.execute(SQLQuery);
// }

const profileUsers = (idUser) =>{
    const SQLQuery = `SELECT DISTINCT u.user_id, u.username, u.name, u.imei,  
       up.name as upline, up.user_id as id_upline,  
       GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') AS retail_name,
       MIN(r.retail_id) AS retail_id,
       ur.name_role as role, ur.role_id,  
       uc.category_user, uc.id_category, u.photo_url  
FROM user u  
JOIN user_category uc ON uc.id_category = u.category_user  
JOIN user_role ur ON uc.role_id = ur.role_id  
LEFT JOIN user up ON up.user_id = u.upline  
LEFT JOIN shift_employes se ON se.user_id = u.user_id  
LEFT JOIN shifting s ON s.shifting_id = se.shifting_id AND CURDATE() BETWEEN s.start_date AND s.end_date  
LEFT JOIN retail r ON r.retail_id = s.retail_id  
WHERE u.user_id = ? AND (s.is_Deleted = 0 OR s.shifting_id IS NULL)  
GROUP BY u.user_id, u.username, u.name, u.imei, up.name, up.user_id, ur.name_role, ur.role_id, uc.category_user, uc.id_category, u.photo_url`;

    return dbpool.execute(SQLQuery, [idUser]);
}

const profileUsersWeb = (idUser) =>{
    const SQLQuery = `SELECT u.user_id, u.username, u.name, u.imei,  up.name as upline, up.user_id as id_upline,
                      ur.name_role as role, ur.role_id, uc.category_user, uc.id_category, u.photo_url  FROM user u
                      jOIN user_category uc ON uc.id_category = u.category_user
                      JOIN user_role ur ON uc.role_id = ur.role_id
                      LEFT JOIN user up ON up.user_id = u.upline
                      WHERE u.user_id = ? `;

    return dbpool.execute(SQLQuery, [idUser]);
}



const createNewUsers = async(body, hashedPassword, imageUser)=>{
    // const SQLQuery = `INSERT INTO user (name, username, password, role, imei, enabled, created_at, created_by ) 
    //                  VALUES ('${body.name}', '${body.username}', '${body.password}', '${body.role}', '${body.imei}', '${body.enabled}', '${body.created_at}', '${body.created_by}')`
    //                  return dbpool.execute(SQLQuery);
    const [result] = await dbpool.query(
        'INSERT INTO user (name, username, password, category_user, photo_url,  enabled, upline, created_at, created_by )VALUES (?,?,?,?,?,?,?,?,?)',
        [body.name, body.username, hashedPassword, body.id_category, imageUser, body.enabled, body.upline, body.created_at, body.created_by]
    );
    return result;

}

// const updateUsers = (body, idUser,) =>{
//     const SQLQuery = `UPDATE user 
//                         SET name ='${body.name}',username = '${body.username}',password = '${body.password}',role = '${body.role}',
//                         category_user = '${body.category_user}', upline='${body.upline}', imei = '${body.imei}', enabled = '${body.enabled}', updated_at ='${body.updated_at}',updated_by = '${body.updated_by}' 
//                         WHERE user_id =${idUser}`;

//     return dbpool.execute(SQLQuery);
// }
const updateUsers = (body, idUser, imageUrl) => {
    const SQLQuery = `
      UPDATE user 
      SET 
        name = ?,
        imei = ?,
        photo_url =?,
        category_user = ?,
        upline = ?,
        enabled = ?,
        updated_at = ?,
        updated_by = ?
      WHERE user_id = ?`;
  
    return dbpool.execute(SQLQuery, [
      body.name || null,
    //   body.role || null,
      body.imei || null,
      imageUrl, 
      body.id_category || null,
      body.upline || null,
      body.enabled || null,
      body.updated_at || null,
      body.updated_by || null,
      idUser,
    ]);
  };

const deleteUsers =(body, iduser)=>{
    const SQLQuery = `UPDATE  user set is_deleted=1, deleted_at ='${body.deleted_at}', deleted_by ='${body.deleted_by}' WHERE user_id =${iduser}`;

    return dbpool.execute(SQLQuery);
}

const findUserByUsername = async (username) => {
    const [users] = await dbpool.query('SELECT * FROM user WHERE username = ?', [username]);
    return users[0];
};

const findUserByUserId = async (user_id) => {
    const [users] = await dbpool.query('SELECT * FROM user WHERE user_id = ?', [user_id]);
    return users[0];
};

const findImei = async (imei) => {
    const [results] = await dbpool.query('SELECT username FROM user WHERE imei = ?', [imei]);
    return results[0]; // Mengembalikan data jika ditemukan, null jika tidak
};

const cekUserRole = async (username) => {
    const [results] = await dbpool.query('SELECT role FROM user WHERE username = ?', [username] );
    return results[0]; // Mengembalikan data jika ditemukan, null jika tidak
};
const saveImeiForUser = async (username, imei) => {
    return await dbpool.query('UPDATE user SET imei = ? WHERE username = ?', [imei, username]);
   
};

const findUsername = async ( username) => {
    const [results] = await dbpool.query('SELECT username FROM user WHERE username = ? and imei is null', [username]);
    return results[0]; // Mengembalikan data jika ditemukan, null jika tidak
};

const getPotonganMangkir = async (idPotongan) => {
    const [potongan] = await dbpool.query('SELECT value FROM potongan WHERE id = ? ', [idPotongan]);
    return potongan[0];
    
}



const getRolesWithCategories = async () => {
    const query = `
      SELECT 
        r.role_id, 
        r.name_role, 
        c.id_category, 
        c.category_user
      FROM user_role r
      LEFT JOIN user_category c ON r.role_id = c.role_id;
    `;
    const [rows] = await dbpool.execute(query);
    return rows;
  };

  const getRoles = async () =>{
    const SQLQuery =`SELECT * FROM user_role`;
    return dbpool.execute(SQLQuery);
}

const getCategories = async (idRole) =>{
    const SQLQuery =`SELECT * FROM user_category WHERE role_id = ${idRole}`;
    return dbpool.execute(SQLQuery);
}

const getAllCategories = async () =>{
    const SQLQuery =`SELECT id_category , role_id, category_user FROM user_category`;
    return dbpool.execute(SQLQuery);
}

const getFeePerUser = async(idUser, PotonganMangkir) =>{
    const SQLQuery =`-- Ambil daftar hari kerja dalam bulan ini, kecuali Minggu
WITH hari_kerja AS (
    SELECT 
        u.user_id,
        u.name,
        d.tanggal
    FROM 
        (
            SELECT DATE_ADD(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL seq DAY) AS tanggal
            FROM (
                SELECT 0 AS seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
                UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 
                UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 
                UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 
                UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 
                UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 
                UNION ALL SELECT 30
            ) AS seq_table
            WHERE DATE_ADD(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL seq DAY) <= LAST_DAY(NOW())
        ) d
    JOIN user u ON u.is_deleted = 0
    WHERE DAYOFWEEK(d.tanggal) NOT IN (1) -- Kecualikan hari Minggu
),
-- Ambil daftar hari libur untuk setiap user
hari_libur AS (
    SELECT 
        oe.user_id,
        o.tanggal
    FROM 
        offday o
    JOIN 
        offday_employes oe ON oe.id_offday = o.id
    WHERE 
        o.is_deleted = 0
),
-- Hitung potongan jika user tidak absen di hari kerja & tidak termasuk hari libur
potongan_kehadiran AS (
    SELECT 
        h.user_id, 
        COUNT(h.tanggal) * '${PotonganMangkir}' AS total_potongan
    FROM 
        hari_kerja h
    LEFT JOIN 
        absensi a ON h.user_id = a.user_id AND DATE(a.absen_time) = h.tanggal AND a.is_valid = 1
    LEFT JOIN 
        hari_libur hl ON h.user_id = hl.user_id AND h.tanggal = hl.tanggal
    WHERE 
        a.absensi_id IS NULL -- Tidak ada absen
        AND hl.tanggal IS NULL -- Bukan hari libur
        AND h.tanggal < CURDATE() 
    GROUP BY 
        h.user_id
),
-- Hitung potongan karena keterlambatan
potongan_telat AS (
    SELECT
        a.user_id,
        SUM(a.potongan) AS total_potongan_telat
    FROM
        absensi a
    JOIN 
        user u ON a.user_id = u.user_id
    WHERE
        u.is_deleted = 0 
        AND a.is_valid = 1 
        AND a.potongan > 0 
        AND DATE_FORMAT(a.absen_time, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    GROUP BY
        a.user_id
),
-- Hitung total bonus bulanan
bonus_bulan AS (
    SELECT 
        u.user_id,
        SUM(b.bonus) AS total_bonus
    FROM 
        user u
    LEFT JOIN 
        bonus_employes be ON (be.user_id = u.user_id OR be.user_id = 0) 
    LEFT JOIN 
        bonus b ON be.id_bonus = b.id
    WHERE 
        u.is_deleted = 0 
        AND b.is_deleted = 0 
        AND DATE_FORMAT(b.month, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    GROUP BY 
        u.user_id
)
-- Hitung total gaji akhir
SELECT 
    u.user_id,
    u.name,
    DATE_FORMAT(NOW(), '%Y-%m') AS period, 
    COALESCE(SUM(ta.fee), 0) AS total_gaji_awal, 
    COALESCE(ptl.total_potongan_telat, 0) AS potongan_terlambat,
    COALESCE(ptk.total_potongan, 0) AS potongan_kehadiran,
    COALESCE(b.total_bonus, 0) AS bonus,
    (COALESCE(ptl.total_potongan_telat, 0) + COALESCE(ptk.total_potongan, 0)) AS total_deduction,
    (COALESCE(SUM(ta.fee), 0) - (COALESCE(ptl.total_potongan_telat, 0) + COALESCE(ptk.total_potongan, 0)) + COALESCE(b.total_bonus, 0)) AS total_gaji_akhir
FROM 
    user u
LEFT JOIN 
    absensi a ON u.user_id = a.user_id AND a.is_valid = 1 AND DATE(a.absen_time) BETWEEN DATE_FORMAT(NOW(), '%Y-%m-01') AND LAST_DAY(NOW())
LEFT JOIN 
    tipe_absen ta ON a.absen_type_id = ta.absen_id
LEFT JOIN 
    potongan_kehadiran ptk ON u.user_id = ptk.user_id
LEFT JOIN 
    potongan_telat ptl ON u.user_id = ptl.user_id
LEFT JOIN 
    bonus_bulan b ON u.user_id = b.user_id
WHERE 
    u.is_deleted = 0
AND u.user_id ='${idUser}';`;

    return dbpool.execute(SQLQuery);
}
const getUserById = async (user_id) => {
    const [rows] = await dbpool.execute("SELECT * FROM user WHERE user_id = ?", [user_id]);
    return rows.length ? rows[0] : null;
};


const changePassword = async (user_id, newPassword) => {
    return dbpool.execute("UPDATE user SET password = ? WHERE user_id = ?", [newPassword, user_id]);
};



  
  

module.exports ={
    getAllUsers,
    createNewUsers,
    updateUsers,
    deleteUsers,
    findUserByUsername,
    findImei,
    saveImeiForUser,
    profileUsers,
    cekUserRole,
    findUsername,
    getRolesWithCategories, 
    getRoles,
    getCategories,
    getAllCategories,
    findUserByUserId,
    getUserUpline,
    getFeePerUser,
    getPotonganMangkir,
    changePassword,
    getUserById,
    profileUsersWeb

}
