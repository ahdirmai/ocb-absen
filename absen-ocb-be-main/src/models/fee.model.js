const dbpool = require('../config/database');


const formatLocalDate = (date) => {
    if (!date) return "-"; // Jika date tidak valid, tampilkan "-"
    
    const d = new Date(date);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const createOffDay = async (body) => {
    const query = `INSERT INTO offday (tanggal, type_off, reason, created_at, created_by) 
                   VALUES (?, ?, ?, ?, ?)`;
  
    const values = [
      body.tanggal,
      body.type_off,
      body.reason,
      body.created_at,
      body.created_by
    ];
  
    // Eksekusi query untuk insert data offday
    const [result] = await dbpool.query(query, values);
  
    // Log Query ke Tabel log_activity
    const logQuery = `
      INSERT INTO log_activity (table_name, action, dataquery, user_id)
      VALUES (?, ?, ?, ?)
    `;
    const logValues = [
      'offday', // Nama tabel yang terlibat
      'INSERT',  // Tindakan yang dilakukan
      dbpool.escape(query.replace(/\?/g, () => dbpool.escape(values.shift()))), // Menggantikan ? dengan nilai dari values
      body.created_by // user_id yang melakukan aksi insert
    ];
  
    // Eksekusi query log untuk menyimpan aktivitas
    await dbpool.query(logQuery, logValues);
  
    return result;
  };
  

const createOffDayEmployes = async (employesOffDay) => {
    const values = employesOffDay.map((detail) => [
        detail.id_offday,
        detail.user_id,
        detail.created_at,
        detail.created_by,
    ]);

    const query = `
        INSERT INTO offday_employes (id_offday, user_id, created_at, created_by)
        VALUES ?
    `;

    const [result] = await dbpool.query(query, [values]);
    return result;
};

const createBonusEmployes = async (employesBonus) => {
    const values = employesBonus.map((detail) => [
        detail.id_bonus,
        detail.user_id,
        detail.created_at,
        detail.created_by,
    ]);

    const query = `
        INSERT INTO bonus_employes (id_bonus, user_id, created_at, created_by)
        VALUES ?
    `;

    const [result] = await dbpool.query(query, [values]);
    return result;
};

const createBonus = async (body) => {
    const query = `
      INSERT INTO bonus (bonus, month, type_pb, reason, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      body.bonus,
      body.month, // Pastikan formatLocalDate menangani format tanggal sesuai yang diinginkan
      body.type_pb,
      body.reason,
      body.created_at,
      body.created_by
    ];
  
    // Eksekusi query untuk insert data bonus
    const [result] = await dbpool.query(query, values);
  
    // Log Query ke Tabel log_activity
    const logQuery = `
      INSERT INTO log_activity (table_name, action, dataquery, user_id)
      VALUES (?, ?, ?, ?)
    `;
    const logValues = [
      'bonus', // Nama tabel yang terlibat
      'INSERT',  // Tindakan yang dilakukan
      dbpool.escape(query.replace(/\?/g, () => dbpool.escape(values.shift()))), // Menggantikan ? dengan nilai dari values
      body.created_by // user_id yang melakukan aksi insert
    ];
  
    // Eksekusi query log untuk menyimpan aktivitas
    await dbpool.query(logQuery, logValues);
  
    return result;
  };
  

const updateOffDay = (body, idOffday) =>{
    const SQLQuery = `UPDATE offday 
                        SET tanggal = '${formatLocalDate(body.tanggal)}',type_off = '${body.type_off}', reason = '${body.reason}', updated_at ='${body.updated_at}',updated_by = '${body.updated_by}' 
                        WHERE id =${idOffday}`;

    return dbpool.execute(SQLQuery);
}

const updateBonus = (body, bonusID) =>{
    const SQLQuery = `UPDATE bonus 
                        SET month = '${formatLocalDate(body.month)}', type_pb ='${body.type_pb}', reason = '${body.reason}', bonus = '${body.bonus}', updated_at ='${body.updated_at}',updated_by = '${body.updated_by}' 
                        WHERE id =${bonusID}`;

    return dbpool.execute(SQLQuery);
}


const deleteOffDay =(body, offID)=>{
    const SQLQuery = `UPDATE offday set is_deleted =1, deleted_at ='${body.deleted_at}',deleted_by = '${body.deleted_by}' WHERE id =${offID}`;

    return dbpool.execute(SQLQuery);
}

const deleteOffDaymployesByIdOffday = async (idOffday) => {
    const query = `DELETE FROM offday_employes WHERE id_offday = ?`;
    const [result] = await dbpool.query(query, [idOffday]);
    return result;
};

const deleteBonusmployesByIdBonus = async (idBonus) => {
    const query = `DELETE FROM bonus_employes WHERE id_bonus = ?`;
    const [result] = await dbpool.query(query, [idBonus]);
    return result;
};


const deleteBonus=(body, bonusID)=>{
    const SQLQuery = `UPDATE bonus set is_deleted =1, deleted_at ='${body.deleted_at}',deleted_by = '${body.deleted_by}' WHERE id =${bonusID}`;

    return dbpool.execute(SQLQuery);
}
const getAllDayOff = () =>{
    const SQLQuery =`SELECT o.id as id_off, o.user_id, u.name, t.type_off, o.reason, DATE_FORMAT(o.tanggal, '%Y-%m-%d') AS tanggal, t.id as id_type_off, o.created_at FROM offday o
                    JOIN user u ON u.user_id = o.user_id
                    jOIN type_off t ON t.id = o.type_off
                    WHERE o.is_deleted=0 AND u.is_deleted=0 order by o.id desc`;
    return dbpool.execute(SQLQuery);
}

const getOffDaytWithEmployes = async () => {
    const SQLQuery = `
      SELECT 
      o.id as id_offday, 
      o.reason, 
      o.tanggal,  
	  t.type_off, 
      t.id as id_type_off ,
      oe.id as off_employe_id,
      oe.user_id,
      o.created_at,
      CASE WHEN oe.user_id = 0 THEN 'Semua Karyawan' ELSE u.name END as name
    FROM 
      offday o
    LEFT JOIN 
      offday_employes oe 
    ON 
      o.id = oe.id_offday
    LEFT JOIN 
        user u
        ON u.user_id = oe.user_id
    JOIN type_off t
    ON t.id = o.type_off
    WHERE o.is_deleted = 0
    ORDER BY o.created_at DESC
    `;
    const [rows] = await dbpool.execute(SQLQuery, );
    // console.log("Hasil Query:", rows);
    return rows;
  };

  const getBonustWithEmployes = async () => {
    const SQLQuery = `
      SELECT 
      o.id as id_bonus, 
      o.reason, 
      DATE_FORMAT(o.month, '%Y-%m-%d') AS month,
      o.bonus,
	  t.type_pb, 
      t.id as id_type_pb ,
      oe.id as bonus_employe_id,
      oe.user_id,
      CASE WHEN oe.user_id = 0 THEN 'Semua Karyawan' ELSE u.name END as name
    FROM 
      bonus o
    LEFT JOIN 
      bonus_employes oe 
    ON 
      o.id = oe.id_bonus
    LEFT JOIN 
        user u
        ON u.user_id = oe.user_id
    JOIN type_punishment t
    ON t.id = o.type_pb
    WHERE o.is_deleted = 0
    ORDER BY o.created_at DESC
    `;
    const [rows] = await dbpool.execute(SQLQuery, );
    // console.log("Hasil Query:", rows);
    return rows;
  };

const getAllBonus = () =>{
    const SQLQuery =`SELECT b.id as id_bonus, b.user_id, u.name, DATE_FORMAT(o.month, '%Y-%m-%d') AS month, b.bonus, t.type_pb, b.reason, t.id as id_type_pb  FROM bonus b
                    JOIN user u ON u.user_id = b.user_id
                    JOIN type_punishment t ON t.id = b.type_pb
                    WHERE b.is_deleted=0 AND u.is_deleted=0 AND 
                     MONTH(b.month) = MONTH(CURDATE()) order by b.id desc`;
    return dbpool.execute(SQLQuery);



}

 const getTypeOff = async () =>{
    const SQLQuery =`SELECT * FROM type_off`;
    return dbpool.execute(SQLQuery);
}

const getPotongan = async () =>{
    const SQLQuery =`SELECT * FROM potongan`;
    return dbpool.execute(SQLQuery);
}
const updatePotongan = (body, potonganID) =>{
    const SQLQuery = `UPDATE potongan 
                        SET value ='${body.value}', updated_at ='${body.updated_at}',updated_by = '${body.updated_by}' 
                        WHERE id =${potonganID}`;

    return dbpool.execute(SQLQuery);
}


const getTypePB = async () =>{
    const SQLQuery =`SELECT * FROM type_punishment`;
    return dbpool.execute(SQLQuery);
}

const getSalaryKaryawan = async(PotonganMangkir) =>{
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
GROUP BY 
    u.user_id, u.name
ORDER BY 
    total_gaji_akhir DESC;`
    return dbpool.execute(SQLQuery);
}



// Same as getSalaryKaryawan but accepts an explicit month ('YYYY-MM') instead of NOW()
const getSalaryKaryawanByMonth = async (PotonganMangkir, month) => {
    const monthStart = `${month}-01`;
    const SQLQuery = `
WITH hari_kerja AS (
    SELECT
        u.user_id,
        u.name,
        d.tanggal
    FROM (
        SELECT DATE_ADD('${monthStart}', INTERVAL seq DAY) AS tanggal
        FROM (
            SELECT 0 AS seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
            UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
            UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
            UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
            UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29
            UNION ALL SELECT 30
        ) AS seq_table
        WHERE DATE_ADD('${monthStart}', INTERVAL seq DAY) <= LAST_DAY('${monthStart}')
    ) d
    JOIN user u ON u.is_deleted = 0
    WHERE DAYOFWEEK(d.tanggal) NOT IN (1)
),
hari_libur AS (
    SELECT oe.user_id, o.tanggal
    FROM offday o
    JOIN offday_employes oe ON oe.id_offday = o.id
    WHERE o.is_deleted = 0
),
potongan_kehadiran AS (
    SELECT
        h.user_id,
        COUNT(h.tanggal) * '${PotonganMangkir}' AS total_potongan
    FROM hari_kerja h
    LEFT JOIN absensi a ON h.user_id = a.user_id AND DATE(a.absen_time) = h.tanggal AND a.is_valid = 1
    LEFT JOIN hari_libur hl ON h.user_id = hl.user_id AND h.tanggal = hl.tanggal
    WHERE a.absensi_id IS NULL
      AND hl.tanggal IS NULL
      AND h.tanggal < CURDATE()
    GROUP BY h.user_id
),
potongan_telat AS (
    SELECT
        a.user_id,
        SUM(a.potongan) AS total_potongan_telat
    FROM absensi a
    JOIN user u ON a.user_id = u.user_id
    WHERE u.is_deleted = 0
      AND a.is_valid = 1
      AND a.potongan > 0
      AND DATE_FORMAT(a.absen_time, '%Y-%m') = '${month}'
    GROUP BY a.user_id
),
bonus_bulan AS (
    SELECT
        u.user_id,
        SUM(b.bonus) AS total_bonus
    FROM user u
    LEFT JOIN bonus_employes be ON (be.user_id = u.user_id OR be.user_id = 0)
    LEFT JOIN bonus b ON be.id_bonus = b.id
    WHERE u.is_deleted = 0
      AND b.is_deleted = 0
      AND DATE_FORMAT(b.month, '%Y-%m') = '${month}'
    GROUP BY u.user_id
)
SELECT
    u.user_id,
    u.name,
    '${month}' AS period,
    COALESCE(SUM(ta.fee), 0) AS total_gaji_awal,
    COALESCE(ptl.total_potongan_telat, 0) AS potongan_terlambat,
    COALESCE(ptk.total_potongan, 0) AS potongan_kehadiran,
    COALESCE(b.total_bonus, 0) AS bonus,
    (COALESCE(ptl.total_potongan_telat, 0) + COALESCE(ptk.total_potongan, 0)) AS total_deduction,
    (COALESCE(SUM(ta.fee), 0) - (COALESCE(ptl.total_potongan_telat, 0) + COALESCE(ptk.total_potongan, 0)) + COALESCE(b.total_bonus, 0)) AS total_gaji_akhir
FROM user u
LEFT JOIN absensi a ON u.user_id = a.user_id AND a.is_valid = 1
    AND DATE(a.absen_time) BETWEEN '${monthStart}' AND LAST_DAY('${monthStart}')
LEFT JOIN tipe_absen ta ON a.absen_type_id = ta.absen_id
LEFT JOIN potongan_kehadiran ptk ON u.user_id = ptk.user_id
LEFT JOIN potongan_telat ptl ON u.user_id = ptl.user_id
LEFT JOIN bonus_bulan b ON u.user_id = b.user_id
WHERE u.is_deleted = 0
GROUP BY u.user_id, u.name
ORDER BY total_gaji_akhir DESC;`;
    return dbpool.execute(SQLQuery);
};

module.exports ={
    getAllDayOff,
    getTypeOff,
    createOffDay,
    updateOffDay,
    deleteOffDay,
    getAllBonus,
    createBonus,
    updateBonus,
    deleteBonus,
    getSalaryKaryawan,
    getSalaryKaryawanByMonth,
    getTypePB,
    getPotongan,
    updatePotongan,
    getOffDaytWithEmployes,
    getBonustWithEmployes,
    createOffDayEmployes,
    deleteOffDaymployesByIdOffday,
    createBonusEmployes,
    deleteBonusmployesByIdBonus

}