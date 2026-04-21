const dbpool = require("../config/database");


const getAllFiles = async () => {
  const SQLQuery = `SELECT f.*, u.name as upload_by, u2.name as Edit_by  from file_laporan f
    LEFT JOIN user u on u.user_id = f.created_by
    LEFT JOIN user u2 on u2.user_id = f.updated_by where f.deleted_at is null ORDER BY f.created_at desc`;
  return dbpool.execute(SQLQuery);
};

const UploadFile = async (body, fileUrl) => {
  const query =
    "INSERT INTO file_laporan (name_file, description, file_url, created_at, created_by) VALUES (?, ?, ?, ?, ?)";
  const values = [
    body.name_file,
    body.description,
    fileUrl,
    body.created_at,
    body.created_by,
  ];

  const [result] = await dbpool.query(query, values);

  // Log Query ke Tabel log_activity
  const logQuery = `
        INSERT INTO log_activity (table_name, action, dataquery, user_id)
        VALUES (?, ?, ?, ?)
    `;
  const logValues = [
    "file_laporan",
    "INSERT",
    dbpool.escape(query.replace(/\?/g, () => dbpool.escape(values.shift()))), // Replace ? dengan value
    body.created_by,
  ];

  await dbpool.query(logQuery, logValues);

  return result;
};

const findFile = async (idFile) => {
  const [file] = await dbpool.query("SELECT * FROM file_laporan WHERE id = ?", [
    idFile,
  ]);
  return file[0];
};

const updateFile = async (body, idFile, fileUrl) => {
  const SQLQuery = `
      UPDATE file_laporan 
      SET 
        name_file = ?,
        description = ?,
        file_url = ?,
        updated_at = ?,
        updated_by = ?
      WHERE id = ?`;

  // Jalankan query update
  await dbpool.execute(SQLQuery, [
    body.name_file || null,
    body.description || null,
    fileUrl,
    body.updated_at || null,
    body.updated_by || null,
    idFile,
  ]);

  // Simpan query update sebagai log
  const logQuery = `
      INSERT INTO log_activity (table_name, action, dataquery, user_id)
      VALUES (?, ?, ?, ?)`;

  const updateStatement = `UPDATE file_laporan SET name_file = '${body.name_file}',description = '${body.description}',file_url = '${fileUrl}',updated_at = '${body.updated_at}',updated_by = '${body.updated_by}' WHERE id = ${idFile}`;

  await dbpool.execute(logQuery, [
    "file_laporan",
    "UPDATE",
    updateStatement,
    body.updated_by || null,
  ]);
};

const deleteFile = async (body, idFile) => {
  const SQLQuery = `UPDATE file_laporan 
                      SET deleted_at = ?, deleted_by = ? 
                      WHERE id = ?`;

  const logQuery = `INSERT INTO log_activity (table_name, action, dataquery, user_id) 
                      VALUES (?, ?, ?, ?)`;
  const deleteStatement = SQLQuery.replace(/\?/g, () =>
    dbpool.escape([body.deleted_at, body.deleted_by, idFile].shift())
  );
  await dbpool.execute(SQLQuery, [body.deleted_at, body.deleted_by, idFile]);
  return dbpool.execute(logQuery, [
    "file_laporan",
    "DELETE",
    deleteStatement,
    body.deleted_by,
  ]);
};

module.exports = {
  getAllFiles,
  UploadFile,
  findFile,
  updateFile,
  deleteFile,
};
