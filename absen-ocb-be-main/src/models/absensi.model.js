const dbpool = require('../config/database');


// conn opsional: bila diisi (koneksi transaksi), insert absensi + log ikut
// transaksi yang sama supaya atomic dgn open/close absensi_sesi. Default dbpool.
const createAbsensi = async (body, imageUrl, status_absen, status_approval, upline, timeAbsenFull, potongan, is_valid, conn = dbpool) => {
    const query = `INSERT INTO absensi (user_id, retail_id, absen_type_id, absen_time, latitude, longitude, reason, potongan, photo_url, is_approval, approval_by, status_absen, status_approval, is_valid, is_lembur)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
      is_valid,
      body.is_lembur ? 1 : 0
    ];

    // Eksekusi query untuk insert data absensi
    const [result] = await conn.query(query, values);

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
    await conn.query(logQuery, logValues);

    return result;
  };
  

const getTimeDB = async (absen_id, retail_id) => {
    const [results] = await dbpool.query('SELECT * FROM tipe_absen WHERE absen_id = ?', [absen_id]);
    return results[0];
    
}

const getUpline = async (user_id) => {
    const [user] = await dbpool.query('SELECT upline, category_user FROM user WHERE user_id = ? ', [user_id]);
    return user[0];

}

// Jam pulang shift = start_time tipe KELUAR pasangan (match by name). Dipakai
// batas atas absen masuk (tak boleh masuk bila shift sudah usai). Return "HH:mm:ss"
// atau null bila tak ada pasangan.
const getKeluarStartTimeByName = async (name) => {
    if (!name) return null;
    const [rows] = await dbpool.query(
        `SELECT start_time FROM tipe_absen
         WHERE name = ? AND is_deleted = 0
           AND (LOWER(description) LIKE '%keluar%' OR LOWER(description) LIKE '%pulang%')
         ORDER BY absen_id LIMIT 1`,
        [name]
    );
    return rows.length > 0 ? rows[0].start_time : null;
}

// Kategori shift = kategori_absen tipe KELUAR pasangan (match by name). Fallback
// saat tipe MASUK punya kategori_absen NULL (mis. ter-null saat edit tipe absen) —
// tanpa ini openSesi simpan kategori NULL & findOpenSesi gagal pasangkan keluar
// (sesi cross-date pecah). Return kategori atau null bila tak ada pasangan.
const getKeluarKategoriByName = async (name) => {
    if (!name) return null;
    const [rows] = await dbpool.query(
        `SELECT kategori_absen FROM tipe_absen
         WHERE name = ? AND is_deleted = 0
           AND (LOWER(description) LIKE '%keluar%' OR LOWER(description) LIKE '%pulang%')
           AND kategori_absen IS NOT NULL AND kategori_absen <> ''
         ORDER BY absen_id LIMIT 1`,
        [name]
    );
    return rows.length > 0 ? rows[0].kategori_absen : null;
}

// Daftar tipe absen per arah (masuk/keluar) untuk dropdown koreksi. Filter arah
// via description (selaras getAbsenDirection FE). Hanya tipe aktif (is_deleted=0).
const getTipeAbsenByDirection = async (direction) => {
    const dir = String(direction || "").toLowerCase();
    let cond;
    if (dir === "keluar") {
        cond = "(LOWER(description) LIKE '%keluar%' OR LOWER(description) LIKE '%pulang%')";
    } else if (dir === "masuk") {
        cond = "LOWER(description) LIKE '%masuk%'";
    } else {
        return [];
    }
    const [rows] = await dbpool.query(
        `SELECT absen_id, name, description, start_time, end_time, kategori_absen, is_cross_date
         FROM tipe_absen
         WHERE is_deleted = 0 AND ${cond}
         ORDER BY name, absen_id`
    );
    return rows;
}

// Tipe absen 1 arah (masuk/keluar) untuk shift name tertentu. Dipakai saat admin
// tambah absen bagian hilang di sesi incomplete (resolve tipe lawan-arah pasangan).
const getTipeByNameDirection = async (name, direction) => {
    if (!name) return null;
    const dir = String(direction || "").toLowerCase();
    let cond;
    if (dir === "keluar") {
        cond = "(LOWER(description) LIKE '%keluar%' OR LOWER(description) LIKE '%pulang%')";
    } else if (dir === "masuk") {
        cond = "LOWER(description) LIKE '%masuk%'";
    } else {
        return null;
    }
    const [rows] = await dbpool.query(
        `SELECT absen_id, name, description, start_time, end_time, kategori_absen, is_cross_date
         FROM tipe_absen
         WHERE name = ? AND is_deleted = 0 AND ${cond}
         ORDER BY absen_id LIMIT 1`,
        [name, ]
    );
    return rows.length ? rows[0] : null;
}

const getPotonganLate = async (idPotongan) => {
    const [potongan] = await dbpool.query('SELECT value FROM potongan WHERE id = ? ', [idPotongan]);
    return potongan[0];
    
}

const approveAbsen =(approved_at, absenId)=>{
    const SQLQuery = `UPDATE  absensi set status_approval=2, is_valid=1, approved_at = ? WHERE absensi_id = ?`;

    return dbpool.execute(SQLQuery, [approved_at, absenId]);
}
const rejectAbsen =(approved_at, absenId)=>{
    const SQLQuery = `UPDATE  absensi set status_approval=3, is_valid=0, approved_at = ? WHERE absensi_id = ?`;

    return dbpool.execute(SQLQuery, [approved_at, absenId]);
}

const validasiAbsen =(body, absenId)=>{
    const isValid = Number(body.is_valid);
    const statusApproval = isValid === 1 ? 2 : 1; // 2=approved, 1=waiting
    const SQLQuery = `UPDATE absensi SET is_valid = ?, status_approval = ? WHERE absensi_id = ?`;

    return dbpool.execute(SQLQuery, [isValid, statusApproval, absenId]);
}

// Ambil 1 baris absensi mentah (untuk koreksi: nilai lama + cek sesi + tipe).
const getAbsensiById = async (absenId) => {
    const [rows] = await dbpool.query('SELECT * FROM absensi WHERE absensi_id = ?', [absenId]);
    return rows[0];
}

// Koreksi absen (transaksional). Update jam/status/potongan/reason + audit.
// conn = koneksi transaksi (atomic dgn sinkron sesi). Log old->new ke log_activity.
const koreksiAbsen = async (conn, absenId, fields, adminId, oldRow) => {
    const { absen_time, status_absen, potongan, reason, updated_at, absen_type_id } = fields;
    const query = `UPDATE absensi
        SET absen_time = ?, status_absen = ?, potongan = ?, reason = ?, absen_type_id = ?, updated_by = ?, updated_at = ?
        WHERE absensi_id = ?`;
    const values = [absen_time, status_absen, potongan, reason, absen_type_id, adminId, updated_at, absenId];
    const [result] = await conn.query(query, values);

    // Audit old->new ke log_activity (kolom timestamp default CURRENT_TIMESTAMP).
    const ringkas = JSON.stringify({
        absensi_id: absenId,
        old: {
            absen_time: oldRow?.absen_time,
            status_absen: oldRow?.status_absen,
            potongan: oldRow?.potongan,
            reason: oldRow?.reason,
            absen_type_id: oldRow?.absen_type_id,
        },
        new: { absen_time, status_absen, potongan, reason, absen_type_id },
    });
    await conn.query(
        `INSERT INTO log_activity (table_name, action, dataquery, user_id) VALUES (?, ?, ?, ?)`,
        ['absensi', 'UPDATE', ringkas, adminId]
    );

    return result;
}



// const getTimeDB = async (absen_id, retail_id, time) => {
//     const [results] = await dbpool.query('SELECT absen_id FROM tipe_absen WHERE absen_id = ? AND retail_id = ? AND ? BETWEEN start_time AND end_time', [absen_id, retail_id, time]);
//     return results[0];
    
// }

// Hapus 1 baris absensi (hard delete — tabel tak punya kolom soft-delete).
// Snapshot baris lama diaudit ke log_activity untuk jejak/recovery manual.
// File foto TIDAK dihapus dari disk (aman bila perlu recovery).
const deleteAbsensi = async (conn, absenId, adminId, oldRow) => {
    const ringkas = JSON.stringify({ absensi_id: Number(absenId), deleted: oldRow });
    await conn.query(
        `INSERT INTO log_activity (table_name, action, dataquery, user_id) VALUES (?, ?, ?, ?)`,
        ['absensi', 'DELETE', ringkas, adminId]
    );
    const [result] = await conn.query('DELETE FROM absensi WHERE absensi_id = ?', [absenId]);
    return result;
}

const historyAbsensiPerUser = async (userId, body) => {
    let SQLQuery = `
        SELECT
            a.absensi_id, a.user_id, u.name AS nama_karyawan, a.absen_time,
            a.retail_id, r.name AS retail_name, a.absen_type_id, a.photo_url,
            ta.name AS category_absen, ta.description, ta.start_time, ta.end_time, ta.kategori_absen, ta.is_cross_date, ta.fee, a.reason,
            (SELECT tk.start_time FROM tipe_absen tk
               WHERE tk.name = ta.name AND tk.is_deleted = 0
                 AND (LOWER(tk.description) LIKE '%keluar%' OR LOWER(tk.description) LIKE '%pulang%')
               ORDER BY tk.absen_id LIMIT 1) AS keluar_start_time,
            sa.description AS status, uap.name AS approval_by, ap.description_status AS status_approval, a.is_valid, a.is_lembur,
            s.sesi_id, s.status AS sesi_status,
            CASE WHEN s.masuk_absensi_id = a.absensi_id THEN 'masuk'
                 WHEN s.keluar_absensi_id = a.absensi_id THEN 'keluar'
                 ELSE NULL END AS sesi_direction
        FROM absensi a
        JOIN user u ON u.user_id = a.user_id
        JOIN retail r ON r.retail_id = a.retail_id
        JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
        JOIN absen_status sa ON sa.status_id = a.status_absen
        LEFT JOIN approval_status ap ON ap.id = a.status_approval
        JOIN user uap ON uap.user_id = a.approval_by
        LEFT JOIN absensi_sesi s ON s.masuk_absensi_id = a.absensi_id OR s.keluar_absensi_id = a.absensi_id
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
    WHERE a.approval_by = ? AND a.is_approval = '1' ORDER BY a.absen_time DESC`;


    return dbpool.execute(SQLQuery, [approvalId]);

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
                        a.user_id = ?
                        AND a.is_valid=1
                    GROUP BY 
                        DATE_FORMAT(a.absen_time, '%Y-%m')
                    ORDER BY
                        month;`;
    return dbpool.execute(SQLQuery, [userId]);

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
        ta.start_time,
        ta.end_time,
        uz.name AS Approval,
        a.is_valid,
        a.status_absen,
        a.reason,
        a.photo_url,
        a.status_approval,
        a.is_lembur,
        a.latitude,
        a.longitude,
        r.latitude AS retail_latitude,
        r.longitude AS retail_longitude,
        r.radius AS retail_radius
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

const cekAbsensiTodayByTimeCategory = async (user_id, absen_type_id) => {
    const [results] = await dbpool.query(
        `SELECT a.*
         FROM absensi a
         JOIN tipe_absen existing_type ON existing_type.absen_id = a.absen_type_id
         JOIN tipe_absen selected_type ON selected_type.absen_id = ?
         WHERE a.user_id = ?
           AND DATE(a.absen_time) = CURDATE()
           AND (a.status_approval IS NULL OR a.status_approval <> 3)
           AND (
             a.absen_type_id = selected_type.absen_id
             OR (
               (
                 (LOWER(selected_type.description) LIKE '%masuk%' AND LOWER(existing_type.description) LIKE '%masuk%')
                 OR (
                   (LOWER(selected_type.description) LIKE '%keluar%' OR LOWER(selected_type.description) LIKE '%pulang%')
                   AND (LOWER(existing_type.description) LIKE '%keluar%' OR LOWER(existing_type.description) LIKE '%pulang%')
                 )
               )
               AND (
                 (
                   selected_type.kategori_absen IS NOT NULL
                   AND selected_type.kategori_absen <> ''
                   AND existing_type.kategori_absen = selected_type.kategori_absen
                 )
                 OR (
                   TIME(existing_type.start_time) = TIME(selected_type.start_time)
                   AND TIME(existing_type.end_time) = TIME(selected_type.end_time)
                 )
               )
             )
           )
         LIMIT 1`,
        [absen_type_id, user_id]
    );

    return results.length > 0 ? results[0] : null;
};

const getTodayAttendanceDirectionSummary = async (user_id) => {
    const [results] = await dbpool.query(
        `SELECT
            SUM(CASE WHEN LOWER(ta.description) LIKE '%masuk%' THEN 1 ELSE 0 END) AS total_masuk,
            SUM(CASE WHEN LOWER(ta.description) LIKE '%keluar%' OR LOWER(ta.description) LIKE '%pulang%' THEN 1 ELSE 0 END) AS total_keluar
         FROM absensi a
         JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
         WHERE a.user_id = ?
           AND DATE(a.absen_time) = CURDATE()
           AND (a.status_approval IS NULL OR a.status_approval <> 3)`,
        [user_id]
    );

    const summary = results[0] || {};

    return {
        masuk: Number(summary.total_masuk || 0),
        keluar: Number(summary.total_keluar || 0),
    };
};

// Ringkasan arah absen hari ini difilter is_lembur.
// isLembur=false => regular (is_lembur NULL/0), isLembur=true => lembur (is_lembur=1).
const getTodayDirectionSummaryByLembur = async (user_id, isLembur, includeYesterday = false) => {
    const lemburFilter = isLembur
        ? "a.is_lembur = 1"
        : "(a.is_lembur IS NULL OR a.is_lembur = 0)";
    const dateFilter = includeYesterday
        ? "DATE(a.absen_time) >= (CURDATE() - INTERVAL 1 DAY)"
        : "DATE(a.absen_time) = CURDATE()";

    const [results] = await dbpool.query(
        `SELECT
            SUM(CASE WHEN LOWER(ta.description) LIKE '%masuk%' THEN 1 ELSE 0 END) AS total_masuk,
            SUM(CASE WHEN LOWER(ta.description) LIKE '%keluar%' OR LOWER(ta.description) LIKE '%pulang%' THEN 1 ELSE 0 END) AS total_keluar
         FROM absensi a
         JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
         WHERE a.user_id = ?
           AND ${dateFilter}
           AND (a.status_approval IS NULL OR a.status_approval <> 3)
           AND ${lemburFilter}`,
        [user_id]
    );

    const summary = results[0] || {};

    return {
        masuk: Number(summary.total_masuk || 0),
        keluar: Number(summary.total_keluar || 0),
    };
};

// Hitung absen masuk hari ini + kemarin, untuk shift cross-midnight
// (mis. SORE 9 JAM masuk 16:00, keluar 01:00 keesokan harinya)
const getMasukCountIncludingYesterday = async (user_id) => {
    const [results] = await dbpool.query(
        `SELECT
            SUM(CASE WHEN LOWER(ta.description) LIKE '%masuk%' THEN 1 ELSE 0 END) AS total_masuk
         FROM absensi a
         JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
         WHERE a.user_id = ?
           AND DATE(a.absen_time) >= (CURDATE() - INTERVAL 1 DAY)
           AND (a.status_approval IS NULL OR a.status_approval <> 3)`,
        [user_id]
    );

    const summary = results[0] || {};

    return {
        masuk: Number(summary.total_masuk || 0),
    };
};

// Hitung absen masuk yang SUDAH DISETUJUI (approved / tak butuh approval).
// status_approval: 1=waiting, 2=approved, 3=rejected. NULL = legacy dianggap sah.
// Dipakai untuk memblokir absen keluar bila masuk masih menunggu approval.
const getApprovedMasukCount = async (user_id, includeYesterday = false) => {
    const dateFilter = includeYesterday
        ? "DATE(a.absen_time) >= (CURDATE() - INTERVAL 1 DAY)"
        : "DATE(a.absen_time) = CURDATE()";

    const [results] = await dbpool.query(
        `SELECT
            SUM(CASE WHEN LOWER(ta.description) LIKE '%masuk%' THEN 1 ELSE 0 END) AS total_masuk
         FROM absensi a
         JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
         WHERE a.user_id = ?
           AND ${dateFilter}
           AND (a.status_approval IS NULL OR a.status_approval = 2)`,
        [user_id]
    );

    return Number(results[0]?.total_masuk || 0);
};







const getRekapKalenderUsers = async (month, retailId) => {
    // Ambil user + retail dari shift aktif pada bulan tersebut
    let query = `
        SELECT DISTINCT u.user_id, u.name, r.retail_id, r.name AS retail_name
        FROM user u
        JOIN shift_employes se ON se.user_id = u.user_id
        JOIN shifting s ON s.shifting_id = se.shifting_id AND s.is_Deleted = 0
            AND DATE_FORMAT(s.start_date, '%Y-%m') <= ? AND DATE_FORMAT(s.end_date, '%Y-%m') >= ?
        JOIN retail r ON r.retail_id = s.retail_id AND r.is_deleted = 0
        WHERE u.is_deleted = 0
    `;
    const params = [month, month];
    if (retailId) {
        query += ` AND r.retail_id = ?`;
        params.push(retailId);
    }
    query += ` ORDER BY r.name, u.name`;
    const [rows] = await dbpool.execute(query, params);
    return rows;
};

const getRekapKalenderAbsensi = async (month, retailId) => {
    let query = `
        SELECT a.user_id, DATE(a.absen_time) AS tanggal, a.status_absen, a.absen_time
        FROM absensi a
        JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
        WHERE DATE_FORMAT(a.absen_time, '%Y-%m') = ?
          AND ta.description LIKE 'Absen Masuk%'
    `;
    const params = [month];
    if (retailId) {
        query += ` AND a.retail_id = ?`;
        params.push(retailId);
    }
    query += ` ORDER BY a.user_id, tanggal`;
    const [rows] = await dbpool.execute(query, params);
    return rows;
};

// Set (user_id, tanggal) yang punya sesi REGULAR closed (masuk+keluar lengkap).
// Untuk mode STRICT rekap. is_lembur=0. tanggal = tanggal masuk (anchor sesi),
// konsisten dengan tanggal hadir (yang juga dari masuk) — cross-date aman.
const getRekapKalenderSesiComplete = async (month, retailId) => {
    let query = `
        SELECT DISTINCT s.user_id, DATE(s.tanggal) AS tanggal
        FROM absensi_sesi s
        WHERE DATE_FORMAT(s.tanggal, '%Y-%m') = ?
          AND s.is_lembur = 0 AND s.status = 'closed'
    `;
    const params = [month];
    if (retailId) { query += ` AND s.retail_id = ?`; params.push(retailId); }
    const [rows] = await dbpool.execute(query, params);
    return rows;
};

// (user_id, tanggal) yang lembur. Gabung dua sumber supaya transisi data mulus:
//  - masuk 2x+ dalam 1 hari (data historis, flag is_lembur belum dipakai)
//  - is_lembur=1 (fitur lembur baru)
// tanggal = DATE(absen_time) baris masuk.
const getRekapKalenderLembur = async (month, retailId) => {
    const retailFilter = retailId ? ` AND a.retail_id = ?` : ``;
    const query = `
        SELECT user_id, tanggal FROM (
          SELECT a.user_id, DATE(a.absen_time) AS tanggal, COUNT(*) cnt
          FROM absensi a JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
          WHERE ta.description LIKE '%masuk%'
            AND DATE_FORMAT(a.absen_time, '%Y-%m') = ?${retailFilter}
          GROUP BY a.user_id, DATE(a.absen_time) HAVING cnt >= 2
        ) ganda
        UNION
        SELECT DISTINCT a.user_id, DATE(a.absen_time) AS tanggal
        FROM absensi a
        WHERE a.is_lembur = 1 AND DATE_FORMAT(a.absen_time, '%Y-%m') = ?${retailFilter}
    `;
    const params = retailId ? [month, retailId, month, retailId] : [month, month];
    const [rows] = await dbpool.execute(query, params);
    return rows;
};

const getRekapKalenderOffday = async (month, retailId) => {
    let query = `
        SELECT oe.user_id, DATE(o.tanggal) AS tanggal
        FROM offday o
        JOIN offday_employes oe ON oe.id_offday = o.id
        WHERE DATE_FORMAT(o.tanggal, '%Y-%m') = ? AND o.is_deleted = 0
    `;
    const params = [month];
    if (retailId) {
        query += ` AND oe.user_id IN (SELECT user_id FROM user WHERE retail_id = ? AND is_deleted = 0)`;
        params.push(retailId);
    }
    const [rows] = await dbpool.execute(query, params);
    return rows;
};

module.exports={
    createAbsensi,
    historyAbsensiPerUser,
    cekFeePeruser,
    historyAbsensiAllUser,
    listAbsensiApproval,
    totalAbsenPerMonth,
    getTimeDB,
    getKeluarStartTimeByName,
    getKeluarKategoriByName,
    getTipeAbsenByDirection,
    getTipeByNameDirection,
    getUpline,
    approveAbsen,
    rejectAbsen,
    validasiAbsen,
    getAbsensiById,
    koreksiAbsen,
    deleteAbsensi,
    getPotonganLate,
    cekAbesensiToday,
    cekAbsensiTodayByTimeCategory,
    getTodayAttendanceDirectionSummary,
    getTodayDirectionSummaryByLembur,
    getMasukCountIncludingYesterday,
    getApprovedMasukCount,
    getRekapKalenderUsers,
    getRekapKalenderAbsensi,
    getRekapKalenderSesiComplete,
    getRekapKalenderLembur,
    getRekapKalenderOffday
}
