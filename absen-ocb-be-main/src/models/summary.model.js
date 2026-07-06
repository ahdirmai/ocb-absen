const { Model } = require("sequelize");
const dbpool = require("../config/database");

const getTottalDaily = async () => {
  const SQLQuery = `SELECT 
                    COALESCE(COUNT(a.absensi_id), 0) AS total_absensi,
                    COALESCE(SUM(CASE WHEN a.status_absen = '1' THEN 1 ELSE 0 END), 0) AS total_ontime,
                    COALESCE(SUM(CASE WHEN a.status_absen = '2' THEN 1 ELSE 0 END), 0) AS total_late
                    FROM 
                    absensi a
                    WHERE 
                    DATE(a.absen_time) = CURDATE();`;

  return dbpool.execute(SQLQuery);
};

const getChartTotalAbsensi = async () => {
  const SQLQuery = ` SELECT 
                      r.name AS retail_name, 
                      COUNT(a.absensi_id) AS total_absensi, 
                      SUM(CASE WHEN a.status_absen = '1' THEN 1 ELSE 0 END) AS total_ontime,
                      SUM(CASE WHEN a.status_absen = '2' THEN 1 ELSE 0 END) AS total_late
                    FROM 
                      retail r
                    LEFT JOIN absensi a ON r.retail_id = a.retail_id
                    WHERE 
                      a.absen_time >= CURDATE() AND a.absen_time < CURDATE() + INTERVAL 1 DAY
                    GROUP BY 
                      r.name;`;

  return dbpool.execute(SQLQuery);
};

const getTotalFee = async () => {
    const SQLQuery = `SELECT 
                      SUM (fee) as total_fee
                      FROM 
                      absensi a
                      JOIN tipe_absen t ON t.absen_id = a.absen_type_id 
                      WHERE 
                      MONTH(a.absen_time) = MONTH(CURDATE())
                      AND YEAR(a.absen_time) = YEAR(CURDATE())`;
  
    return dbpool.execute(SQLQuery);
  };

  const getTotalFeeDaily = async () => {
    const SQLQuery = `SELECT 
                      SUM (fee) as total_fee
                      FROM 
                      absensi a
                      JOIN tipe_absen t ON t.absen_id = a.absen_type_id 
                      WHERE 
                       a.absen_time >= CURDATE() AND a.absen_time < CURDATE() + INTERVAL 1 DAY`;
  
    return dbpool.execute(SQLQuery);
  };

// bulan format 'MM-YYYY'. null => bulan berjalan
const buildTopMonthlyQuery = (statusAbsen, bulan) => {
  let periodClause;
  const params = [statusAbsen];

  if (bulan) {
    const [mm, yyyy] = bulan.split('-');
    periodClause = ` AND MONTH(a.absen_time) = ? AND YEAR(a.absen_time) = ?`;
    params.push(mm, yyyy);
  } else {
    periodClause = ` AND MONTH(a.absen_time) = MONTH(CURDATE())
                     AND YEAR(a.absen_time) = YEAR(CURDATE())`;
  }

  const SQLQuery = `SELECT
                      u.user_id,
                      u.name AS nama,
                      r.name AS retail_name,
                      COUNT(a.absensi_id) AS jumlah
                    FROM absensi a
                    JOIN user u ON u.user_id = a.user_id
                    JOIN retail r ON r.retail_id = a.retail_id
                    JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
                    WHERE a.status_absen = ?
                      AND ta.description LIKE 'Absen Masuk%'
                      ${periodClause}
                    GROUP BY u.user_id, u.name, r.name
                    ORDER BY jumlah DESC, u.name ASC
                    LIMIT 10`;

  return { SQLQuery, params };
};

const getTopOntimeMonthly = async (bulan) => {
  const { SQLQuery, params } = buildTopMonthlyQuery('1', bulan);
  return dbpool.execute(SQLQuery, params);
};

const getTopLateMonthly = async (bulan) => {
  const { SQLQuery, params } = buildTopMonthlyQuery('2', bulan);
  return dbpool.execute(SQLQuery, params);
};

module.exports = {
  getTottalDaily,
  getTotalFee,
  getChartTotalAbsensi,
  getTotalFeeDaily,
  getTopOntimeMonthly,
  getTopLateMonthly
};
