const validateAbsenManagementInput = (req, res, next) => {
    const { name, description, fee } = req.body;

    // Validasi field wajib
    if (!name || !description || !fee) {
        return res.status(400).json({
            message: 'Bad Request.',
        });
    }

    // Validasi panjang field
    if (name.length < 2) {
        return res.status(400).json({
            message: 'Absen Name must be at least 2 characters long.',
        });
    }

    // Jika semua validasi lolos, lanjutkan ke controller
    next();
};

module.exports = validateAbsenManagementInput;
