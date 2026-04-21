const validateAbsenManagementInput = (req, res, next) => {
    const {  retail_id, start_date, end_date } = req.body;

    // Validasi field wajib
    if (!retail_id || !start_date || !end_date) {
        return res.status(400).json({
            message: 'Bad Request.',
            status : 'failed',
            status_code : '400',
        });
    }


    // Jika semua validasi lolos, lanjutkan ke controller
    next();
};

module.exports = validateAbsenManagementInput;
