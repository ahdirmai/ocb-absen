const rawAbsensiModel = require('../models/rawAbsensi.model');
const moment = require('moment-timezone');

const timezone = 'Asia/Makassar';

/**
 * GET /api/raw-absensi
 *
 * Query params:
 *   - period  : 'daily' (default) | 'weekly' | 'monthly'
 *   - date    : YYYY-MM-DD  (opsional, default hari ini – untuk daily)
 *   - week    : YYYY-Www    (opsional, misal 2025-W18 – untuk weekly)
 *   - month   : YYYY-MM     (opsional, default bulan ini – untuk monthly)
 */
const getRawAbsensi = async (req, res) => {
    try {
        const { period = 'daily', date, week, month } = req.query;

        let startDate, endDate, label;
        const now = moment().tz(timezone);

        if (period === 'weekly') {
            // Gunakan parameter week (format YYYY-Www) atau hitung dari tanggal sekarang
            let refWeek;
            if (week) {
                refWeek = moment(week, 'GGGG-[W]WW', true).tz(timezone);
                if (!refWeek.isValid()) {
                    return res.status(400).json({
                        message: "Format parameter 'week' tidak valid. Gunakan format YYYY-Www (contoh: 2025-W18).",
                        status: 'failed',
                        status_code: '400',
                    });
                }
            } else {
                refWeek = now.clone();
            }
            startDate = refWeek.clone().startOf('isoWeek').format('YYYY-MM-DD');
            endDate   = refWeek.clone().endOf('isoWeek').format('YYYY-MM-DD');
            label     = `Minggu ${refWeek.isoWeek()} – ${refWeek.isoWeekYear()} (${startDate} s/d ${endDate})`;

        } else if (period === 'monthly') {
            // Gunakan parameter month (format YYYY-MM) atau bulan sekarang
            let refMonth;
            if (month) {
                refMonth = moment(month, 'YYYY-MM', true).tz(timezone);
                if (!refMonth.isValid()) {
                    return res.status(400).json({
                        message: "Format parameter 'month' tidak valid. Gunakan format YYYY-MM (contoh: 2025-04).",
                        status: 'failed',
                        status_code: '400',
                    });
                }
            } else {
                refMonth = now.clone();
            }
            startDate = refMonth.clone().startOf('month').format('YYYY-MM-DD');
            endDate   = refMonth.clone().endOf('month').format('YYYY-MM-DD');
            label     = `Bulan ${refMonth.format('MMMM YYYY')} (${startDate} s/d ${endDate})`;

        } else {
            // daily (default)
            let refDate;
            if (date) {
                refDate = moment(date, 'YYYY-MM-DD', true).tz(timezone);
                if (!refDate.isValid()) {
                    return res.status(400).json({
                        message: "Format parameter 'date' tidak valid. Gunakan format YYYY-MM-DD (contoh: 2025-04-28).",
                        status: 'failed',
                        status_code: '400',
                    });
                }
            } else {
                refDate = now.clone();
            }
            const dateStr = refDate.format('YYYY-MM-DD');
            label = `Harian – ${dateStr}`;

            // Khusus daily, gunakan query yang lebih efisien (satu tanggal)
            const [data] = await rawAbsensiModel.getRawAbsensiHarian(dateStr);

            return res.json({
                message: 'Get Raw Absensi Successfully!',
                status: 'success',
                status_code: '200',
                period,
                label,
                total_data: data.length,
                summary: buildSummary(data),
                data,
            });
        }

        const [data] = await rawAbsensiModel.getRawAbsensi(startDate, endDate);

        return res.json({
            message: 'Get Raw Absensi Successfully!',
            status: 'success',
            status_code: '200',
            period,
            label,
            total_data: data.length,
            summary: buildSummary(data),
            data,
        });

    } catch (error) {
        console.error('Error getRawAbsensi:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            status: 'failed',
            status_code: '500',
            serverMessage: error.message,
        });
    }
};

/**
 * Hitung ringkasan jumlah Ontime / Telat / Belum Absen dari baris hasil query.
 */
const buildSummary = (rows) => {
    const summary = { ontime: 0, telat: 0, belum_absen: 0 };
    for (const row of rows) {
        if (row.status_kehadiran === 'Ontime')       summary.ontime++;
        else if (row.status_kehadiran === 'Telat')   summary.telat++;
        else if (row.status_kehadiran === 'Belum Absen') summary.belum_absen++;
    }
    return summary;
};

module.exports = { getRawAbsensi };
