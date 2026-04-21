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
    updateMenuConfig,
    deleteMenuConfig
}