const validateUserInput = (req, res, next) => {
    const { username, name, role, password } = req.body;

    // Validasi field wajib
    // if (!username || !name || !role ) {
    //     return res.status(400).json({
    //         message: 'Bad Request.',
    //         status : 'failed',
    //         status_code : '400',
    //     });
    // }

    // Validasi panjang field
    if (username.length < 6) {
        return res.status(400).json({
            message: 'Username must be at least 6 characters long.',
            status : 'failed',
            status_code : '400',
        });
    }

    if (name.length < 3) {
        return res.status(400).json({
            message: 'Name must be at least 3 characters long.',
            status : 'failed',
            status_code : '400',
        });
    }

    // Validasi role
    // const allowedRoles = ['SuperAdmin','Admin', 'SPV', 'Karyawan'];
    // if (!allowedRoles.includes(role)) {
    //     return res.status(400).json({
    //         message: "Invalid role. The role must be one of the following: SuperAdmin, Admin, SPV or Karyawan.",
    //         status : 'failed',
    //         status_code : '400',
    //     });
    // }

    // Jika semua validasi lolos, lanjutkan ke controller
    next();
};

module.exports = validateUserInput;
