const dbpool = require("../config/database");

const getAlltypeAbsen = () => {
  const SQLQuery = `SELECT t.absen_id, t.name , t.fee, t.description, t.retail_id, r.latitude, r.longitude, r.radius, r.name as retail_name, t.start_time, t.end_time, uc.category_user, uc.id_category as group_absen
                    FROM tipe_absen t
                    LEFT JOIN retail r ON r.retail_id = t.retail_id
                    LEFT JOIN user_category uc ON uc.id_category = t.group_absen
                    WHere t.is_deleted=0 order BY t.name asc`;
  return dbpool.execute(SQLQuery);
};

// const createNewAbsenType = async(body)=>{

//     const [result] = await dbpool.query(
//         'INSERT INTO tipe_absen (name, description, fee, start_time, end_time,  created_at, created_by )VALUES (?,?,?,?,?,?,?)',
//         [body.name, body.description, body.fee, body.start_time, body.end_time, body.created_at, body.created_by]
//     );
//     return result;

// }

const createNewAbsenType = async (body) => {
  const query =
    "INSERT INTO tipe_absen (name, description, fee, start_time, end_time, kategori_absen,  created_at, created_by )VALUES (?,?,?,?,?,?,?,?)";
  const values = [
    body.name,
    body.description,
    body.fee,
    body.start_time,
    body.end_time,
    body.kategori_absen,
    body.created_at,
    body.created_by,
  ];
  const [result] = await dbpool.query(query, values);
  const logQuery = `
            INSERT INTO log_activity (table_name, action, dataquery, user_id)
            VALUES (?, ?, ?, ?)
        `;
  const logValues = [
    "tipe_absen",
    "INSERT",
    dbpool.escape(query.replace(/\?/g, () => dbpool.escape(values.shift()))), // Replace ? dengan value
    body.created_by,
  ];

  await dbpool.query(logQuery, logValues);

  return result;
};

const createNewGroupAbsen = async (groupDetails) => {
  const values = groupDetails.map((detail) => [
    detail.absen_type_id,
    detail.id_category,
    detail.created_at,
    detail.created_by,
  ]);

  const query = `
        INSERT INTO group_absen (absen_type_id, id_category, created_at, created_by)
        VALUES ?
    `;

  const [result] = await dbpool.query(query, [values]);

  const logQuery = `
        INSERT INTO log_activity (table_name, action, dataquery, user_id)
        VALUES (?, ?, ?, ?)
    `;

  const logData = {
    table_name: "group_absen",
    action: "INSERT",
    dataquery: JSON.stringify(values),
    user_id: groupDetails[0].created_by,
  };

  await dbpool.query(logQuery, [
    logData.table_name,
    logData.action,
    logData.dataquery,
    logData.user_id,
  ]);

  return result;
};

// Query lama: tipe absen berdasarkan kategori user + shift range aktif (untuk kategori non-sales / fallback).
const getTypeAbsenByCategory = async (userId) => {
  const SQLQuery = `SELECT DISTINCT
    t.absen_id,
    t.name,
    t.description,
    r.retail_id,
    r.name as retail_name,
    r.latitude,
    r.longitude,
    r.radius,
    t.start_time,
    t.end_time,
    ga.id_category as group_absen,
case when a.absensi_id is not null then 1 else 0 end as is_absen_today,
t.kategori_absen
FROM
    shifting s
JOIN
    shift_employes se ON se.shifting_id = s.shifting_id AND s.is_deleted=0
JOIN
    user u ON u.user_id = se.user_id
JOIN
    group_absen ga
    ON (ga.id_category = u.category_user OR ga.id_category = 0)
JOIN
    tipe_absen t ON t.absen_id = ga.absen_type_id AND t.is_deleted=0
JOIN
    retail r ON r.retail_id = s.retail_id
LEFT JOIN
  (select absensi_id, absen_type_id, user_id from absensi where absen_time >= CURDATE() AND (status_approval IS NULL OR status_approval <> 3) ) a on a.absen_type_id = t.absen_id AND a.user_id = u.user_id
WHERE
    se.user_id = ?
    AND s.start_date <= CURDATE()
    AND s.end_date >= CURDATE()
ORDER BY t.name ASC`;
  return dbpool.execute(SQLQuery, [userId]);
};

// Query jadwal harian: 2 tipe absen (masuk + keluar) via FK langsung.
// Retail hanya sumber koordinat (lat/long/radius).
const getTypeAbsenByJadwal = async (userId) => {
  const SQLQuery = `SELECT
    t.absen_id,
    t.name,
    t.description,
    r.retail_id,
    r.name as retail_name,
    r.latitude,
    r.longitude,
    r.radius,
    t.start_time,
    t.end_time,
    NULL as group_absen,
    CASE WHEN a.absensi_id IS NOT NULL THEN 1 ELSE 0 END AS is_absen_today,
    t.kategori_absen
  FROM
    jadwal_harian j
  JOIN
    retail r ON r.retail_id = j.retail_id
  JOIN
    tipe_absen t ON t.is_deleted = 0
      AND (t.absen_id = j.absen_masuk_id OR t.absen_id = j.absen_keluar_id)
  LEFT JOIN
    (SELECT absensi_id, absen_type_id, user_id
     FROM absensi
     WHERE absen_time >= CURDATE() AND (status_approval IS NULL OR status_approval <> 3)
    ) a ON a.absen_type_id = t.absen_id AND a.user_id = j.user_id
  WHERE
    j.user_id = ?
    AND j.tanggal = CURDATE()
    AND j.is_deleted = 0
  ORDER BY t.description ASC`;
  return dbpool.execute(SQLQuery, [userId]);
};

// Tipe absen lembur HANYA untuk Sales Toko (cat 18): masuk+keluar Pagi saja.
// Trainee Sales Toko (cat 21) TIDAK boleh lembur — sengaja dikecualikan
// (id_category IN (18,0) + name NOT LIKE '%TRAINEE%').
// Exclude absen_masuk_id + absen_keluar_id dari jadwal hari ini (sudah dipakai regular).
const getLemburTypes = async (userId) => {
  const SQLQuery = `
    SELECT DISTINCT
      t.absen_id, t.name, t.description, t.kategori_absen,
      t.start_time, t.end_time,
      r.retail_id, r.name AS retail_name,
      r.latitude, r.longitude, r.radius
    FROM tipe_absen t
    JOIN group_absen ga ON ga.absen_type_id = t.absen_id
    LEFT JOIN retail r ON r.retail_id = t.retail_id
    WHERE t.is_deleted = 0
      AND (ga.id_category IN (18, 0))
      AND LOWER(t.kategori_absen) = 'pagi'
      AND (LOWER(t.description) LIKE '%masuk%' OR LOWER(t.description) LIKE '%keluar%' OR LOWER(t.description) LIKE '%pulang%')
      AND t.name NOT LIKE '%TRAINEE%'
      AND t.absen_id NOT IN (
        SELECT j.absen_masuk_id FROM jadwal_harian j
        WHERE j.user_id = ? AND j.tanggal = CURDATE() AND j.is_deleted = 0
        UNION
        SELECT j.absen_keluar_id FROM jadwal_harian j
        WHERE j.user_id = ? AND j.tanggal = CURDATE() AND j.is_deleted = 0
      )
    ORDER BY t.name ASC, t.description ASC`;
  return dbpool.execute(SQLQuery, [userId, userId]);
};

// User dianggap pakai jalur jadwal harian bila punya shifting aktif hari ini
// (start <= CURDATE() <= end, belum dihapus) dengan flag uses_jadwal_harian = 1.
const userUsesJadwalHarian = async (userId) => {
  const [rows] = await dbpool.query(
    `SELECT s.shifting_id
     FROM shifting s
     JOIN shift_employes se ON se.shifting_id = s.shifting_id
     WHERE se.user_id = ?
       AND s.is_deleted = 0
       AND s.uses_jadwal_harian = 1
       AND s.start_date <= CURDATE()
       AND s.end_date >= CURDATE()
     LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
};

const getTypeAbsenPerShift = async (userId) => {
  // Shifting aktif dgn flag jadwal harian => pakai jadwal harian bila sudah di-assign hari ini.
  if (await userUsesJadwalHarian(userId)) {
    const [jadwalRows] = await dbpool.query(
      "SELECT id FROM jadwal_harian WHERE user_id = ? AND tanggal = CURDATE() AND is_deleted = 0 LIMIT 1",
      [userId]
    );
    if (jadwalRows.length > 0) {
      return getTypeAbsenByJadwal(userId);
    }
    // Belum di-assign hari ini => tidak ada tipe absen (tak boleh absen sampai admin memetakan).
    return [[], []];
  }

  // Non jadwal harian => perilaku lama tak berubah.
  return getTypeAbsenByCategory(userId);
};

// Status jadwal harian: bedakan "belum di-assign admin" vs non-jadwal-harian.
// Dipakai controller untuk pesan eksplisit saat daftar tipe absen kosong.
const getShiftJadwalStatus = async (userId) => {
  const isShiftScheduled = await userUsesJadwalHarian(userId);

  if (!isShiftScheduled) {
    return { isShiftScheduled: false, hasJadwal: false };
  }

  const [jadwalRows] = await dbpool.query(
    "SELECT id FROM jadwal_harian WHERE user_id = ? AND tanggal = CURDATE() AND is_deleted = 0 LIMIT 1",
    [userId]
  );

  return { isShiftScheduled: true, hasJadwal: jadwalRows.length > 0 };
};

const checkFlagAbsen = async (user_id) => {
  const [user] = await dbpool.query(
    "SELECT absensi_id FROM absensi WHERE user_id = ? AND DATE(absen_time) = CURDATE()",
    [user_id]
  );
  return user[0];
};

const getTypeAbsen = async (absenId) => {
  const SQLQuery = `SELECT * FROM tipe_absen where absen_id = ?`;
  return dbpool.execute(SQLQuery, [absenId]);
};

const getTypeAbsenWithGroups = async () => {
  const SQLQuery = `
      SELECT 
      ta.absen_id AS absen_id,
      ta.name,
      ta.description,
      ta.fee,
      ta.start_time,
      ta.end_time,
      ta.kategori_absen,
      ta.created_at,
      ta.created_by,
      ga.id AS group_absen_id,
      ga.id_category,
      CASE WHEN ga.id_category = 0 THEN 'Semua Group' ELSE uc.category_user END as category_user ,
      ga.created_at AS group_created_at,
      ga.created_by AS group_created_by
    FROM 
      tipe_absen ta
    LEFT JOIN 
      group_absen ga 
    ON 
      ta.absen_id = ga.absen_type_id
	LEFT JOIN 
		user_category uc
        ON uc.id_category = ga.id_category
    WHERE ta.is_deleted = 0
    ORDER BY ta.created_at DESC
    `;
  const [rows] = await dbpool.execute(SQLQuery);
  // console.log("Hasil Query:", rows);
  return rows;
};

const updateAbsenType2 = async (absenId, data) => {
  const query = `
        UPDATE tipe_absen
        SET name = ?, description = ?, fee = ?, start_time = ?, end_time = ?, updated_at = ?, updated_by = ?
        WHERE absen_id = ?
    `;

  const values = [
    data.name,
    data.description,
    data.fee,
    data.start_time,
    data.end_time,
    data.updated_at,
    data.updated_by,
    absenId,
  ];

  const [result] = await dbpool.query(query, values);
  return result;
};

const updateAbsenType = async (body, absenId) => {
    const query = `UPDATE tipe_absen SET name = ?,description = ?,fee = ?,start_time = ?,
        end_time = ?, kategori_absen = ?,updated_at = ?,updated_by = ? WHERE absen_id = ?
    `;
    const values = [
      body.name || null,
      body.description || null,
      body.fee || null,
      body.start_time || null,
      body.end_time || null,
      body.kategori_absen || null,
      body.updated_at || null,
      body.updated_by || null,
      absenId
    ];
  
    // Eksekusi query update
    const [result] = await dbpool.query(query, values);
  
    // Log Query ke Tabel log_activity
    const logQuery = `
      INSERT INTO log_activity (table_name, action, dataquery, user_id)
      VALUES (?, ?, ?, ?)
    `;
    const logValues = [
      'tipe_absen',  // Nama tabel yang terlibat
      'UPDATE',      // Tindakan yang dilakukan
      dbpool.escape(query.replace(/\?/g, () => dbpool.escape(values.shift()))),  // Menggantikan ? dengan nilai dari values
      body.updated_by  // user_id yang melakukan aksi update
    ];
  
    // Eksekusi query log untuk menyimpan aktivitas
    await dbpool.query(logQuery, logValues);
  
    return result;
  };
  

  const deleteTypeAbsen = async (body, absenId) => {
    const query = `UPDATE tipe_absen 
                    SET is_deleted = 1, deleted_at = ?, deleted_by = ?
                    WHERE absen_id = ?`;
  
    const values = [body.deleted_at, body.deleted_by, absenId];
  
    // Eksekusi query delete
    const [result] = await dbpool.query(query, values);
  
    // Log Query ke Tabel log_activity
    const logQuery = `
      INSERT INTO log_activity (table_name, action, dataquery, user_id)
      VALUES (?, ?, ?, ?)
    `;
    const logValues = [
      'tipe_absen',  
      'DELETE',      
      dbpool.escape(query.replace(/\?/g, () => dbpool.escape(values.shift()))), // Menggantikan ? dengan nilai dari values
      body.deleted_by //
    ];
  
    await dbpool.query(logQuery, logValues);
  
    return result;
  };
  

const deleteGroupAbsenByAbsenTypeId = async (absenTypeId, userId) => {
    const query = `DELETE FROM group_absen WHERE absen_type_id = ?`;
    const values = [absenTypeId];

    const [result] = await dbpool.query(query, values);
  
    // Log Query ke Tabel log_activity
    const logQuery = `
      INSERT INTO log_activity (table_name, action, dataquery, user_id)
      VALUES (?, ?, ?, ?)
    `;
    const logValues = [
      'group_absen',  
      'DELETE',       
      dbpool.escape(query.replace(/\?/g, () => dbpool.escape(values.shift()))),  // Menggantikan ? dengan nilai dari values
      userId          
    ];
  
    // Eksekusi query log untuk menyimpan aktivitas
    await dbpool.query(logQuery, logValues);
  
    return result;
  };
  

module.exports = {
  getAlltypeAbsen,
  createNewAbsenType,
  getTypeAbsen,
  updateAbsenType2,
  deleteTypeAbsen,
  getTypeAbsenPerShift,
  getShiftJadwalStatus,
  getLemburTypes,
  checkFlagAbsen,
  createNewGroupAbsen,
  getTypeAbsenWithGroups,
  deleteGroupAbsenByAbsenTypeId,
  updateAbsenType,
};
