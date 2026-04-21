const absensiModel = require('../models/absensi.model');
const dbpool = require('../config/database');
// Fungsi hitung jarak (Haversine formula)
function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius bumi dalam meter
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Jarak dalam meter
}
const checkAbsensi = async (req, res, next) => {
    const { absen_type_id, user_id, retail_id, latitude, longitude } = req.body;
    console.log("Cek Absen untuk User:", user_id, "Tipe Absen:", absen_type_id);
    // Cek apakah sudah absen hari ini
    const cekAbsenToday = await absensiModel.cekAbesensiToday(user_id, absen_type_id);
    console.log("Hasil Pengecekan:", cekAbsenToday);
    if (cekAbsenToday) {
        console.log("Ini sudah absen");
        return res.status(400).json({
            message: 'Mohon Maaf Anda sudah Absen hari ini untuk tipe Absen ini',
            status: 'failed',
            status_code: '400',
        });
    }
    // Validasi lokasi GPS wajib ada
    if (!latitude || !longitude) {
        return res.status(400).json({
            message: 'Lokasi GPS wajib diaktifkan untuk absen!',
            status: 'failed',
            status_code: '400',
        });
    }
    // Cek radius lokasi dengan retail
    try {
        const [retailers] = await dbpool.query(
            'SELECT retail_id, name, latitude, longitude, radius FROM retail WHERE retail_id = ?',
            [retail_id]
        );
        if (retailers.length > 0) {
            const retail = retailers[0];
            // Jika retail punya koordinat, cek radius
            if (retail.latitude && retail.longitude && retail.radius) {
                const jarak = hitungJarak(
                    parseFloat(latitude),
                    parseFloat(longitude),
                    parseFloat(retail.latitude),
                    parseFloat(retail.longitude)
                );
                console.log(`Jarak ke ${retail.name}: ${jarak.toFixed(2)} meter, Radius: ${retail.radius} meter`);
                if (jarak > retail.radius) {
                    return res.status(400).json({
                        message: `Anda berada di luar radius toko ${retail.name}. Jarak Anda: ${jarak.toFixed(0)} meter, Radius maksimal: ${retail.radius} meter`,
                        status: 'failed',
                        status_code: '400',
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error cek radius:", error);
        // Lanjutkan tanpa validasi radius jika error
    }
    console.log("Ini belum absen, lokasi valid");
    next();
};
module.exports = checkAbsensi;
