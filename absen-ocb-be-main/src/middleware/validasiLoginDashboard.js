const validasiLoginDashboard = (req, res, next) => {
    const { username, password} = req.body;

    // Validasi field Mandatory
    if (!username || !password ) {
        return res.status(400).json({
            message: 'Bad Request.',
            status : 'failed',
            status_code : '400',
        });
    }


    // Jika semua validasi lolos, lanjutkan ke controller
    next();
};

module.exports = validasiLoginDashboard;
