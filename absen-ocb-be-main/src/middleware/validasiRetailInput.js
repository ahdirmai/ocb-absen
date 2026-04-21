const validateRetailInput = (req, res, next) => {
    const { name } = req.body;

    // Validasi field wajib
    if (!name) {
        return res.status(400).json({
            message: 'Bad Request.',
            status : 'failed',
            status_code : '400',
        });
    }

    // Validasi panjang field
    if (name.length < 2) {
        return res.status(400).json({
            message: 'Retail Name must be at least 2 characters long.',
            status : 'failed',
            status_code : '400',
        });
    }

    // Jika semua validasi lolos, lanjutkan ke controller
    next();
};

module.exports = validateRetailInput;
