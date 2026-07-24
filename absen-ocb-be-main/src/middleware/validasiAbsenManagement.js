const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const validateAbsenManagementInput = (req, res, next) => {
    const { name, description, fee, start_time, end_time, group_details } = req.body;

    // Validasi field wajib
    if (!name || !description || fee === undefined || fee === null || fee === '') {
        return res.status(400).json({
            message: 'Bad Request. Nama, deskripsi, dan fee wajib diisi.',
        });
    }

    // Validasi panjang field
    if (name.length < 2) {
        return res.status(400).json({
            message: 'Absen Name must be at least 2 characters long.',
        });
    }

    if (Number.isNaN(Number(fee)) || Number(fee) < 0) {
        return res.status(400).json({
            message: 'Fee harus berupa angka >= 0.',
        });
    }

    if (start_time && !TIME_REGEX.test(String(start_time))) {
        return res.status(400).json({
            message: 'Format start_time tidak valid (HH:mm atau HH:mm:ss).',
        });
    }

    if (end_time && !TIME_REGEX.test(String(end_time))) {
        return res.status(400).json({
            message: 'Format end_time tidak valid (HH:mm atau HH:mm:ss).',
        });
    }

    if (group_details !== undefined && !Array.isArray(group_details)) {
        return res.status(400).json({
            message: 'group_details harus berupa array.',
        });
    }

    if (Array.isArray(group_details)) {
        const invalidGroup = group_details.some(
            (g) => g === null || g.id_category === undefined || g.id_category === null
        );
        if (invalidGroup) {
            return res.status(400).json({
                message: 'Setiap group_details wajib punya id_category.',
            });
        }
    }

    // Jika semua validasi lolos, lanjutkan ke controller
    next();
};

module.exports = validateAbsenManagementInput;
