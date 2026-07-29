const dbpool = require('../config/database');


const getMenuCategoryUser = (idCategory) =>{
    const SQLQuery =`
    SELECT 
    nl.id,
    nl.name,
    nl.path,
    nl.icon,
    nl.submenu_id,
    nl.parent_id
FROM 
    navigation_links nl
JOIN 
    navigation_access na ON nl.id = na.menu_id
JOIN 
    user_category uc ON na.category_id = uc.id_category
WHERE 
    uc.id_category = '${idCategory}' AND nl.is_active = 1
    AND na.is_deleted=0
ORDER BY 
    nl.parent_id, nl.id`;

    return dbpool.execute(SQLQuery);
}


const getAllMenucategory = async () =>{
    const SQLQuery =`SELECT na.id, na.category_id as id_category, uc.category_user, na.menu_id, nl.name as menu_name, n.name as parent_name
                    FROM navigation_access na 
                    JOIN navigation_links nl ON nl.id = na.menu_id
                    jOIN user_category uc ON uc.id_category = na.category_id
                    LEFT join navigation_links n ON n.id = nl.parent_id
                    WHERE nl.is_active=1 and na.is_deleted=0 ORDER BY na.id desc`;
    return dbpool.execute(SQLQuery);
}
    
const getAllMenu = async () =>{
    const SQLQuery =`SELECT id as menu_id, name, path, icon , submenu_id, parent_id, is_active
                    FROM navigation_links 
                    WHERE is_active=1 ORDER BY id asc`;
    return dbpool.execute(SQLQuery);
}

const createMenuConfig = async(body)=>{

    const [result] = await dbpool.query(
        'INSERT INTO navigation_access (category_id, menu_id, created_at, created_by )VALUES (?,?,?,?)',
        [body.id_category, body.menu_id, body.created_at, body.created_by]
    );
    return result;

}

// Batch insert beberapa menu ke 1 kategori sekaligus (multi-select FE).
// Lewati menu yang sudah ter-assign (aktif) ke kategori itu — cegah duplikat.
const createMenuConfigBulk = async(body)=>{
    const menuIds = Array.isArray(body.menu_ids) ? body.menu_ids : [];
    const categoryId = body.id_category;
    if (!categoryId || menuIds.length === 0) {
        return { inserted: 0, skipped: 0 };
    }

    const [existing] = await dbpool.query(
        'SELECT menu_id FROM navigation_access WHERE category_id = ? AND is_deleted = 0',
        [categoryId]
    );
    const existingSet = new Set(existing.map((r) => Number(r.menu_id)));

    const toInsert = menuIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && !existingSet.has(id));

    if (toInsert.length === 0) {
        return { inserted: 0, skipped: menuIds.length };
    }

    const values = toInsert.map((menuId) => [
        categoryId,
        menuId,
        body.created_at,
        body.created_by,
    ]);
    const [result] = await dbpool.query(
        'INSERT INTO navigation_access (category_id, menu_id, created_at, created_by) VALUES ?',
        [values]
    );
    return {
        inserted: result.affectedRows || toInsert.length,
        skipped: menuIds.length - toInsert.length,
        firstInsertId: result.insertId,
    };
}

const updateMenuConfig = (body, idMenuConfig) =>{
    const SQLQuery = `UPDATE navigation_access 
                        SET category_id ='${body.id_category}',menu_id = '${body.menu_id}', updated_at ='${body.updated_at}',updated_by = '${body.updated_by}' 
                        WHERE id =${idMenuConfig}`;

    return dbpool.execute(SQLQuery);
}

const deleteMenuConfig =(body, idMenuConfig)=>{
    const SQLQuery = `UPDATE navigation_access set is_deleted =1, deleted_at ='${body.deleted_at}',deleted_by = '${body.deleted_by}' WHERE id =${idMenuConfig}`;

    return dbpool.execute(SQLQuery);
}





module.exports ={
    getMenuCategoryUser,
    getAllMenucategory,
    getAllMenu,
    createMenuConfig,
    createMenuConfigBulk,
    updateMenuConfig,
    deleteMenuConfig
}