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

module.exports = {
  getTottalDaily,
  getTotalFee,
  getChartTotalAbsensi,
  getTotalFeeDaily
};
