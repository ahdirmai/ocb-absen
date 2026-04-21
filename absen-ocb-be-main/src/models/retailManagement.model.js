const dbpool = require('../config/database');

const getAllRetail = () =>{
    const SQLQuery ='SELECT * FROM retail where is_deleted = 0 order by retail_id desc';
    return dbpool.execute(SQLQuery);
}


const getRetail = async(retailId) =>{
    const SQLQuery =`SELECT * FROM retail where retail_id =${retailId}`;
    return dbpool.execute(SQLQuery);

}

const updateRetail = async(body, retailId) =>{
    const SQLQuery = `UPDATE retail 
                        SET name ='${body.name}',latitude = '${body.latitude}',longitude = '${body.longitude}',radius = '${body.radius}', is_active = '${body.is_active}', updated_at ='${body.updated_at}',updated_by = '${body.updated_by}' 
                        WHERE retail_id =${retailId}`;

    return dbpool.execute(SQLQuery);
}


const createNewRetail = async(body)=>{

    const [result] = await dbpool.query(
        'INSERT INTO retail (name, latitude, longitude, radius, is_active, created_at, created_by )VALUES (?,?,?,?,?,?,?)',
        [body.name, body.latitude, body.longitude, body.radius, body.is_active, body.created_at, body.created_by]
    );
    return result;

}

const deleteRetail =(body, retailId)=>{
    const SQLQuery = `UPDATE retail set is_deleted=1, is_active=0, deleted_at='${body.deleted_at}', deleted_by='${body.deleted_by}' WHERE retail_id =${retailId}`;

    return dbpool.execute(SQLQuery);
}





module.exports={
    getAllRetail,
    getRetail,
    updateRetail,
    createNewRetail,
    deleteRetail
}