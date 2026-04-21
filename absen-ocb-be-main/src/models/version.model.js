const dbpool = require('../config/database');


const getLatestVersion = async () =>{
    const SQLQuery =`SELECT latest_version, force_update, update_url FROM app_version ORDER BY id DESC LIMIT 1;`;
    return dbpool.execute(SQLQuery);
}

module.exports ={
    getLatestVersion
}