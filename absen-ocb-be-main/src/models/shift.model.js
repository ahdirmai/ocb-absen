const dbpool = require('../config/database');

const formatLocalDate = (date) => {
    if (!date) return "-"; // Jika date tidak valid, tampilkan "-"
    
    const d = new Date(date);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};


const getAllShifting = () =>{
    const SQLQuery =`SELECT s.shifting_id, s.user_id, s.retail_id, DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,  DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date, u.name, u.username, r.name as retail_name, s.created_at, s.created_by 
    FROM shifting s 
    JOIN user u ON u.user_id = s.user_id 
    JOIN retail r ON r.retail_id = s.retail_id
    WHERE s.is_deleted = 0 ORDER BY s.shifting_id desc`;
    return dbpool.execute(SQLQuery);
}

const getShiftDetail = async(shiftingId) =>{
    const SQLQuery =`SELECT s.shifting_id, s.start_date, s.end_date, u.name, r.name as retail_name, s.created_at, s.created_by 
    FROM shifting s 
    JOIN user u ON u.user_id = s.user_id 
    JOIN retail r ON r.retail_id = s.retail_id 
    WHERE shifting_id =${shiftingId}`;
    return dbpool.execute(SQLQuery);

}

const getTypeShiftWithEmployes = async () => {
    const SQLQuery = `
      SELECT 
      s.shifting_id, 
      s.retail_id, 
      DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,  
      DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
      r.name as retail_name, 
      s.created_at, s.created_by,
      se.id AS shift_employe_id,
      se.user_id, 
      CASE WHEN se.user_id = 0 THEN 'Semua Karyawan' ELSE u.name END as name
    FROM 
      shifting s
    LEFT JOIN 
      shift_employes se 
    ON 
      s.shifting_id = se.shifting_id
    LEFT JOIN 
        user u
        ON u.user_id = se.user_id
	JOIN retail r
    ON r.retail_id = s.retail_id
    WHERE s.is_deleted = 0
    ORDER BY s.created_at DESC
    `;
    const [rows] = await dbpool.execute(SQLQuery, );
    // console.log("Hasil Query:", rows);
    return rows;
  };

const createNewShift = async(body)=>{

    const [result] = await dbpool.query(
        'INSERT INTO shifting (retail_id, start_date, end_date, created_at, created_by )VALUES (?,?,?,?,?)',
        [ body.retail_id, formatLocalDate(body.start_date), formatLocalDate(body.end_date), body.created_at, body.created_by]
    );
    return result;

}
const createNewShiftEmployes = async (employesShift) => {
    const values = employesShift.map((detail) => [
        detail.shifting_id,
        detail.user_id,
        detail.created_at,
        detail.created_by,
    ]);

    const query = `
        INSERT INTO shift_employes (shifting_id, user_id, created_at, created_by)
        VALUES ?
    `;

    const [result] = await dbpool.query(query, [values]);
    return result;
};
const updateShifting = (body, shiftingId) =>{
    const SQLQuery = `UPDATE shifting 
                        SET retail_id = '${body.retail_id}',start_date = '${formatLocalDate(body.start_date)}', end_date = '${formatLocalDate(body.end_date)}', updated_at ='${body.updated_at}',updated_by = '${body.updated_by}' 
                        WHERE shifting_id =${shiftingId}`;

    // console.log(SQLQuery);
    return dbpool.execute(SQLQuery);
}

const deleteShift =(body, shiftingId)=>{
    const SQLQuery = `UPDATE shifting set is_deleted =1, deleted_at ='${body.deleted_at}',deleted_by = '${body.deleted_by}' WHERE shifting_id =${shiftingId}`;

    return dbpool.execute(SQLQuery);
}

const deleteShiftEmployesByShifthingId = async (shiftingId) => {
    const query = `DELETE FROM shift_employes WHERE shifting_id = ?`;
    const [result] = await dbpool.query(query, [shiftingId]);
    return result;
};


module.exports={
    getAllShifting,
    getShiftDetail,
    createNewShift,
    updateShifting,
    deleteShift,
    createNewShiftEmployes,
    getTypeShiftWithEmployes,
    deleteShiftEmployesByShifthingId
}