const logRequest=(req, res, next)=>{
    console.log('Request ke PATH', req.path);
    next();
}

module.exports=logRequest;