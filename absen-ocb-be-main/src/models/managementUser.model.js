const dbpool = require('../config/database');


const getAllRoleUser = () =>{
    const SQLQuery =`SELECT * from user_role`;
    return dbpool.execute(SQLQuery);
}
const createRoles = async(body) => {
  
    const [result] = await dbpool.query(
        'INSERT INTO user_role (name_role, created_at, created_by)VALUES (?,?,?)',
        [body.name_role, body.created_at, body.created_by]
    );
    return result;
  };

  const getAllCategoryUser = () =>{
    const SQLQuery =`SELECT uc.id_category, uc.role_id, ur.name_role, uc.category_user from user_category uc join user_role ur on ur.role_id = uc.role_id`;
    return dbpool.execute(SQLQuery);
}

const createCategory = async(body) => {
  
    const [result] = await dbpool.query(
        'INSERT INTO user_category (role_id, category_user, created_at, created_by)VALUES (?,?,?,?)',
        [body.role_id, body.category_user, body.created_at, body.created_by]
    );
    return result;
  };

  const updateRoles = (body, idRole) => {

    const SQLQuery = `
      UPDATE user_role
      SET 
        name_role = ?,
        updated_at = ?,
        updated_by = ?
      WHERE role_id = ?`;
  
    return dbpool.execute(SQLQuery, [
      body.name_role || null,
      body.updated_at || null,
      body.updated_by || null,
      idRole
    ]);
  };

  const updateCategory = (body, idCategory) => {

    const SQLQuery = `
      UPDATE user_category
      SET 
        role_id = ?,
        category_user = ?,
        updated_at = ?,
        updated_by = ?
      WHERE id_category = ?`;
  
    return dbpool.execute(SQLQuery, [
      body.role_id || null,
      body.category_user || null,
      body.updated_at || null,
      body.updated_by || null,
      idCategory
    ]);
  };






module.exports ={
    getAllRoleUser,
    createRoles,
    getAllCategoryUser,
    createCategory,
    updateRoles,
    updateCategory
    
}