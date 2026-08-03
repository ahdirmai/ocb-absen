const absensiModel = require("../models/absensi.model");
const absenManagementModel = require("../models/absenManagement.model");
const sesiModel = require("../models/absensiSesi.model");
const dbpool = require("../config/database");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

const timezone = "Asia/Makassar";

// Ambil tipe absen yang benar-benar di-assign ke user hari ini (regular + lembur).
// Dipakai untuk otorisasi server-side + penentuan is_lembur dari sumber terpercaya.
const getAllowedAbsenTypeSets = async (userId) => {
  const [regularRows] = await absenManagementModel.getTypeAbsenPerShift(userId);
  const [lemburRows] = await absenManagementModel.getLemburTypes(userId);

  const regular = new Set(
    (Array.isArray(regularRows) ? regularRows : []).map((r) => String(r.absen_id))
  );
  const lembur = new Set(
    (Array.isArray(lemburRows) ? lemburRows : []).map((r) => String(r.absen_id))
  );

  return { regular, lembur };
};

const getUploadedImagePath = (filename) =>
  path.resolve(__dirname, "../../public/images", filename);

const removeUploadedImage = (filename) => {
  if (!filename) {
    return;
  }

  const imagePath = getUploadedImagePath(filename);

  fs.unlink(imagePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to delete file:", err);
    }
  });
};

const createAbsensi = async (req, res) => {
  const { body, file } = req;

  if (!file) {
    return res.status(400).json({
      message: "Foto selfie wajib diunggah.",
      status: "failed",
      status_code: "400",
    });
  }

  try {
    const imageUrl = `/assets/${file.filename}`;
    let status_absen = 0;
    let status_approval = 0;
    let potongan = 0;
    const idPotongan = 1;

    const timeAbsenMoment = moment().tz(timezone);
    const timeAbsenFull = timeAbsenMoment.format("YYYY-MM-DD HH:mm:ss");

    const getTimeDB = await absensiModel.getTimeDB(body.absen_type_id);
    const getUpline = await absensiModel.getUpline(body.user_id);
    const getPotonganLate = await absensiModel.getPotonganLate(idPotongan);
    const upline = getUpline?.upline || null;

    if (!getTimeDB) {
      removeUploadedImage(file.filename);

      return res.status(404).json({
        message: "Invalid attendance time configuration in the database!!",
        status: "failed",
        status_code: "404",
      });
    }

    // Otorisasi server-side: tipe absen harus benar di-assign ke user hari ini.
    // is_lembur ditentukan dari sumber terpercaya (masuk set lembur), bukan teks reason.
    const allowedTypes = await getAllowedAbsenTypeSets(body.user_id);
    const submittedTypeId = String(body.absen_type_id);
    const isRegularType = allowedTypes.regular.has(submittedTypeId);
    const isLemburType = allowedTypes.lembur.has(submittedTypeId);

    if (!isRegularType && !isLemburType) {
      removeUploadedImage(file.filename);

      return res.status(403).json({
        message: "Tipe absen ini tidak tersedia untuk Anda hari ini.",
        status: "failed",
        status_code: "403",
      });
    }

    // Regular menang: tipe hanya dihitung lembur bila eksklusif di set lembur.
    body.is_lembur = isLemburType && !isRegularType ? 1 : 0;

    const selectedDesc = String(getTimeDB.description || "").toLowerCase();
    const isKeluar =
      selectedDesc.includes("keluar") || selectedDesc.includes("pulang");
    const isMasuk = selectedDesc.includes("masuk");

    // Keluar dini hari (< 12:00) = shift/lembur cross-midnight (SORE 9 JAM,
    // SUBUH). Masuk-nya tercatat kemarin, jadi cek masuk hari ini ATAU kemarin.
    const isEarlyMorningKeluar =
      timeAbsenMoment.format("HH:mm:ss") < "12:00:00";

    // KELUAR: is_lembur harus ikut sesi masuk yang ditutup, BUKAN hasil derive
    // type-set hari ini. Tipe keluar cross-date bisa anggota set regular DAN
    // lembur sekaligus (mis. SUBUH keluar id53: dipakai jadwal_harian regular +
    // muncul via getOpenLemburKeluarTypes utk sesi lembur open) → aturan "regular
    // menang" (baris atas) flip is_lembur ke 0 → guard keluar cari sesi is_lembur=0,
    // sesi lembur open tak ketemu → error palsu "tidak ada absen masuk yang belum
    // diselesaikan". Adopsi is_lembur dari sesi open yang cocok agar pairing benar.
    if (isKeluar) {
      const keluarKategori =
        getTimeDB.kategori_absen ||
        (getTimeDB.name
          ? await absensiModel.getKeluarKategoriByName(getTimeDB.name)
          : null) ||
        null;
      const openSesiForLembur = await sesiModel.findOpenSesiAnyLembur({
        user_id: body.user_id,
        kategori_absen: keluarKategori,
        includeYesterday: isEarlyMorningKeluar,
      });
      if (openSesiForLembur) {
        body.is_lembur = openSesiForLembur.is_lembur ? 1 : 0;
      }
    }

    // Hard-guard lembur. Dua jalur precondition:
    // - Jadwal-harian: user gantikan karyawan toko lain di shift beda (komplemen).
    //   Boleh lembur sebelum/sesudah shift regular hari itu — TAPI tidak saat
    //   sedang menjalani shift regular (sesi regular OPEN = mid-shift, tak bisa
    //   di dua tempat). includeYesterday menangkap subuh cross-date semalam.
    // - Non-jadwal: perilaku lama — regular hari ini wajib komplit (masuk+keluar).
    // Lembur-keluar wajib didahului lembur-masuk (semua jalur, di bawah).
    if (body.is_lembur === 1) {
      const isJadwalHarianUser =
        await absenManagementModel.userUsesJadwalHarian(body.user_id);

      // Precondition MULAI lembur (hanya MASUK). KELUAR lembur menutup sesi yang
      // sudah berjalan — jangan kena syarat ini, cukup guard lembur-masuk-exists
      // di bawah. Tanpa penjagaan isMasuk: keluar lembur SUBUH cross-date (regular
      // hari ini belum ada) salah terblokir "Lembur hanya bisa setelah regular
      // selesai", atau jadwal-harian dgn sesi regular open salah terblokir.
      if (isMasuk) {
        if (isJadwalHarianUser) {
          const regularSesi = await sesiModel.getTodaySesiSummary(
            body.user_id,
            false,
            true
          );
          if (regularSesi.hasOpen) {
            removeUploadedImage(file.filename);

            return res.status(400).json({
              message:
                "Selesaikan shift regular Anda dulu (absen keluar) sebelum lembur.",
              status: "failed",
              status_code: "400",
            });
          }
        } else {
          const regularSesi = await sesiModel.getTodaySesiSummary(
            body.user_id,
            false
          );
          // Regular komplit = ada sesi regular closed, ATAU (fallback pra-sesi) count masuk+keluar.
          let regularComplete = regularSesi.hasClosed;
          if (!regularComplete && regularSesi.closedCount === 0 && regularSesi.openCount === 0) {
            const regularToday = await absensiModel.getTodayDirectionSummaryByLembur(
              body.user_id,
              false
            );
            regularComplete = regularToday.masuk >= 1 && regularToday.keluar >= 1;
          }

          if (!regularComplete) {
            removeUploadedImage(file.filename);

            return res.status(400).json({
              message:
                "Lembur hanya bisa dilakukan setelah absen masuk dan keluar regular hari ini selesai.",
              status: "failed",
              status_code: "400",
            });
          }
        }
      }

      if (isKeluar) {
        // Lembur subuh cross-date: masuk lembur tercatat kemarin malam.
        // includeYesterday saat keluar dini hari agar masuk kemarin terdeteksi.
        const lemburSesi = await sesiModel.getTodaySesiSummary(
          body.user_id,
          true,
          isEarlyMorningKeluar
        );
        // Lembur masuk ada = sesi lembur open/closed, ATAU (fallback) count masuk lembur.
        let lemburMasukExists = lemburSesi.hasOpen || lemburSesi.hasClosed;
        if (!lemburMasukExists) {
          const lemburToday = await absensiModel.getTodayDirectionSummaryByLembur(
            body.user_id,
            true,
            isEarlyMorningKeluar
          );
          lemburMasukExists = lemburToday.masuk >= 1;
        }

        if (!lemburMasukExists) {
          removeUploadedImage(file.filename);

          return res.status(400).json({
            message: "Tidak bisa absen keluar lembur sebelum absen masuk lembur.",
            status: "failed",
            status_code: "400",
          });
        }
      }
    }
    const SHIFT_SCHEDULED_CATEGORIES = [18, 21];
    const isSalesToko = SHIFT_SCHEDULED_CATEGORIES.includes(
      Number(getUpline?.category_user)
    );

    if (isKeluar) {
      const masukCount = isEarlyMorningKeluar
        ? (await absensiModel.getMasukCountIncludingYesterday(body.user_id))
            .masuk
        : (await absensiModel.getTodayAttendanceDirectionSummary(body.user_id))
            .masuk;

      if (masukCount < 1) {
        removeUploadedImage(file.filename);

        return res.status(400).json({
          message: "Tidak bisa absen keluar sebelum absen masuk.",
          status: "failed",
          status_code: "400",
        });
      }

      // Sales Toko / Trainee: absen keluar diblokir bila absen masuk masih
      // menunggu approval (belum disetujui atasan).
      if (isSalesToko) {
        const approvedMasuk = await absensiModel.getApprovedMasukCount(
          body.user_id,
          isEarlyMorningKeluar
        );

        if (approvedMasuk < 1) {
          removeUploadedImage(file.filename);

          return res.status(400).json({
            message:
              "Absen masuk Anda masih menunggu approval atasan. Absen keluar belum bisa dilakukan.",
            status: "failed",
            status_code: "400",
          });
        }
      }

      // Guard tipe keluar harus cocok dgn sesi masuk yang sedang open.
      // Cegah user pilih tipe keluar beda kategori/jadwal → sesi pecah
      // (masuk menggantung open + keluar jadi incomplete terpisah).
      const openSesiAktif = await sesiModel.findAnyOpenSesi({
        user_id: body.user_id,
        is_lembur: body.is_lembur,
        includeYesterday: isEarlyMorningKeluar,
      });

      // Keluar wajib punya sesi masuk OPEN belum-dipasangkan. findAnyOpenSesi +
      // includeYesterday menangkap cross-date sah (masuk kemarin, keluar dini
      // hari) → SUBUH/SORE 9 JAM tetap boleh keluar. Tanpa sesi open = orphan
      // (mis. shift sudah closed tadi lalu keluar lagi dari APK) → tolak. Guard
      // COUNT di atas dobel proteksi tapi lemah (hitung masuk closed juga).
      if (!openSesiAktif) {
        removeUploadedImage(file.filename);

        return res.status(400).json({
          message:
            "Tidak bisa absen keluar: tidak ada absen masuk yang belum diselesaikan.",
          status: "failed",
          status_code: "400",
        });
      }

      let cocok = true;
      if (openSesiAktif.jadwal_id != null) {
        // Jalur jadwal harian: tipe keluar harus == absen_keluar_id jadwalnya.
        const jadwalKeluarId = await sesiModel.getJadwalKeluarId(
          openSesiAktif.jadwal_id
        );
        cocok =
          jadwalKeluarId != null &&
          String(jadwalKeluarId) === String(body.absen_type_id);
      } else {
        // Jalur non-jadwal / lembur: kategori keluar harus == kategori sesi open.
        // Case-insensitive: kategori tipe bisa beda casing (mis. 'sore'/'Sore').
        cocok =
          String(getTimeDB.kategori_absen || "").trim().toLowerCase() ===
          String(openSesiAktif.kategori_absen || "").trim().toLowerCase();
      }

      if (!cocok) {
        removeUploadedImage(file.filename);

        return res.status(400).json({
          message: `Tipe absen keluar tidak cocok dengan absen masuk Anda (shift ${
            openSesiAktif.kategori_absen || "-"
          }). Pilih tipe keluar yang sesuai.`,
          status: "failed",
          status_code: "400",
        });
      }
    }

    const startTimeDBMoment = moment
      .tz(getTimeDB.start_time, "HH:mm:ss", timezone)
      .format("HH:mm:ss");
    const endTimeDBMoment = moment
      .tz(getTimeDB.end_time, "HH:mm:ss", timezone)
      .format("HH:mm:ss");
    const timeAbsenMomentFormatted = timeAbsenMoment.format("HH:mm:ss");
    const potonganLate = Number(getPotonganLate?.value || 0);

    // Guard window absen MASUK — berlaku untuk SEMUA jalur (jadwal-harian,
    // lembur, non-jadwal retail biasa). Keluar & tipe non-masuk tak kena.
    //   BATAS BAWAH: hanya boleh mulai 1 jam sebelum start_time (ex 15:00 → 14:00).
    //   BATAS ATAS : tak boleh masuk bila sudah lewat JAM PULANG shift
    //                (start_time tipe KELUAR pasangan). Percuma masuk kalau shift
    //                sudah usai. Cross-date (keluar besok) TAK kena batas atas.
    if (isMasuk && !isKeluar) {
      const EARLY_MASUK_WINDOW_MINUTES = 60;
      const toMinutes = (hhmmss) => {
        const [h, m] = String(hhmmss).split(":").map((n) => parseInt(n, 10));
        return h * 60 + m;
      };
      const nowMin = toMinutes(timeAbsenMomentFormatted);
      const startMin = toMinutes(startTimeDBMoment);
      // Selisih menit menuju start (positif = belum sampai jam masuk). Tangani
      // wrap tengah malam: pilih jarak terpendek pada siklus 24 jam.
      let minutesUntilStart = startMin - nowMin;
      if (minutesUntilStart > 720) minutesUntilStart -= 1440;
      if (minutesUntilStart < -720) minutesUntilStart += 1440;

      // Batas bawah: terlalu awal (>1 jam sebelum start).
      if (minutesUntilStart > EARLY_MASUK_WINDOW_MINUTES) {
        removeUploadedImage(file.filename);
        return res.status(400).json({
          message: `Absen masuk baru dibuka 1 jam sebelum jam masuk (${startTimeDBMoment.slice(
            0,
            5
          )}). Silakan absen mulai pukul ${moment(startTimeDBMoment, "HH:mm:ss")
            .subtract(EARLY_MASUK_WINDOW_MINUTES, "minutes")
            .format("HH:mm")}.`,
          status: "failed",
          status_code: "400",
        });
      }

      // Batas atas: sudah lewat jam pulang shift. Skip untuk cross-date
      // (keluar jatuh besok, jadi hari masuk tak mungkin "lewat pulang").
      if (Number(getTimeDB.is_cross_date) !== 1) {
        const keluarStart = await absensiModel.getKeluarStartTimeByName(
          getTimeDB.name
        );
        if (keluarStart) {
          const keluarStartFmt = moment
            .tz(keluarStart, "HH:mm:ss", timezone)
            .format("HH:mm:ss");
          const keluarMin = toMinutes(keluarStartFmt);
          // Sudah lewat jam pulang bila now >= jam pulang (same-day shift).
          if (nowMin >= keluarMin) {
            removeUploadedImage(file.filename);
            return res.status(400).json({
              message: `Shift ini sudah berakhir (jam pulang ${keluarStartFmt.slice(
                0,
                5
              )}). Absen masuk tidak bisa dilakukan.`,
              status: "failed",
              status_code: "400",
            });
          }
        }
      }
    }

    if (timeAbsenMomentFormatted < startTimeDBMoment) {
      status_absen = 1;
    } else if (
      timeAbsenMomentFormatted >= startTimeDBMoment &&
      timeAbsenMomentFormatted < endTimeDBMoment
    ) {
      status_absen = 1;
    } else {
      status_absen = 2;

      const diffMinutes = moment(timeAbsenMomentFormatted, "HH:mm:ss").diff(
        moment(endTimeDBMoment, "HH:mm:ss"),
        "minutes"
      );

      if (diffMinutes > 15) {
        potongan = potonganLate;
      }

      // Absen telat => butuh approval atasan (sama seperti absen di luar radius).
      // Hanya untuk Sales Toko (18) & Trainee Sales Toko (21).
      const SHIFT_SCHEDULED_CATEGORIES = [18, 21];
      if (SHIFT_SCHEDULED_CATEGORIES.includes(Number(getUpline?.category_user))) {
        body.is_approval = 1;
        const lateReason = "Anda absen telat, menunggu approval atasan";
        body.reason = String(body.reason || "").trim()
          ? `${body.reason}; ${lateReason}`
          : lateReason;
      }
    }

    status_approval = body.is_approval == 1 ? 1 : 2;
    const is_valid = body.is_approval == 1 ? 0 : 1;

    // Insert absensi + open/close absensi_sesi dalam 1 transaksi (atomic).
    // Bila sesi gagal → absensi rollback, hindari event tanpa sesi (orphan).
    const tanggalMasuk = timeAbsenMoment.format("YYYY-MM-DD");
    // Kategori sesi. Fallback ke kategori tipe KELUAR pasangan (by name) bila tipe
    // ini kategori_absen NULL — jaga masuk & keluar pakai kategori sama agar
    // findOpenSesi bisa memasangkan (cegah sesi cross-date pecah bila kategori
    // tipe masuk ter-null saat edit tipe absen).
    let kategoriAbsen = getTimeDB.kategori_absen || null;
    if (!kategoriAbsen && getTimeDB.name) {
      kategoriAbsen =
        (await absensiModel.getKeluarKategoriByName(getTimeDB.name)) || null;
    }

    const conn = await dbpool.getConnection();
    let result;
    try {
      await conn.beginTransaction();

      result = await absensiModel.createAbsensi(
        body,
        imageUrl,
        status_absen,
        status_approval,
        upline,
        timeAbsenFull,
        potongan,
        is_valid,
        conn
      );

      if (!result) {
        throw new Error("Insert absensi gagal (no result).");
      }

      const newAbsensiId = result.insertId;

      if (isKeluar) {
        // Absen keluar → tutup sesi open yang cocok. Bila tak ada → incomplete.
        const openSesi = await sesiModel.findOpenSesi(conn, {
          user_id: body.user_id,
          is_lembur: body.is_lembur,
          kategori_absen: kategoriAbsen,
          jadwal_id: null,
          includeYesterday: isEarlyMorningKeluar,
        });

        if (openSesi) {
          await sesiModel.closeSesi(conn, openSesi.sesi_id, newAbsensiId, timeAbsenFull);
        } else {
          await sesiModel.createIncompleteSesi(conn, {
            user_id: body.user_id,
            tanggal: tanggalMasuk,
            retail_id: body.retail_id,
            jadwal_id: null,
            kategori_absen: kategoriAbsen,
            keluar_absensi_id: newAbsensiId,
            is_lembur: body.is_lembur,
            created_at: timeAbsenFull,
          });
        }
      } else {
        // Auto-close sesi BASI (lupa keluar) sebelum buka sesi baru: tandai
        // 'incomplete' sesi open tanggal lampau yang tipe masuknya same-day
        // (is_cross_date=0). Sesi cross-date sah (SUBUH/SORE 9 JAM) tak disentuh.
        // Cegah user terblokir + jaga akurasi lembur-guard.
        await sesiModel.markStaleOpenSesiIncomplete(
          conn,
          body.user_id,
          body.is_lembur
        );

        // Absen masuk → buka sesi baru. Resolve jadwal_id (regular Sales Toko/Trainee).
        const jadwalId = body.is_lembur
          ? null
          : await sesiModel.resolveJadwalId(
              body.user_id,
              body.absen_type_id,
              tanggalMasuk,
              conn
            );

        await sesiModel.openSesi(conn, {
          user_id: body.user_id,
          tanggal: tanggalMasuk,
          retail_id: body.retail_id,
          jadwal_id: jadwalId,
          kategori_absen: kategoriAbsen,
          masuk_absensi_id: newAbsensiId,
          is_lembur: body.is_lembur,
          created_at: timeAbsenFull,
        });
      }

      await conn.commit();
    } catch (txError) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }

    res.json({
      message: "Absen successfully!",
      status: "success",
      status_code: "200",
      data: {
        ...body,
        photo_url: imageUrl,
        absen_time: timeAbsenFull,
        status_absen,
        status_approval,
        potongan,
        is_overtime: body.is_lembur ? 1 : 0,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    removeUploadedImage(file?.filename);

    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

const approveAbsen = async (req, res) => {
  const { absenId } = req.params;

  try {
    const timeApproveMoment = moment().tz(timezone);
    const timeApprove = timeApproveMoment.format("YYYY-MM-DD HH:mm:ss");
    await absensiModel.approveAbsen(timeApprove, absenId);

    res.json({
      message: "An attendance has been approved",
      status: "success",
      status_code: "200",
      data: {
        asben_id: absenId,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
    console.log(error);
  }
};

const validasiAbsen = async (req, res) => {
  const { absenId } = req.params;
  const { body } = req;

  try {
    await absensiModel.validasiAbsen(body, absenId);

    res.json({
      message: "Absensi Berhasil di validasi",
      status: "success",
      status_code: "200",
      data: {
        absensi_id: absenId,
        ...body,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
    console.log(error);
  }
};

const rejectAbsen = async (req, res) => {
  const { absenId } = req.params;

  try {
    const timeApproveMoment = moment().tz(timezone);
    const timeApprove = timeApproveMoment.format("YYYY-MM-DD HH:mm:ss");
    await absensiModel.rejectAbsen(timeApprove, absenId);

    res.json({
      message: "An attendance has been rejected",
      status: "success",
      status_code: "200",
      data: {
        asben_id: absenId,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
    console.log(error);
  }
};

const historyAbsensiPerUser = async (req, res) => {
  const { userId } = req.params;
  const body = req.body;

  try {
    const [data] = await absensiModel.historyAbsensiPerUser(userId, body);
    const [total] = await absensiModel.totalAbsenPerMonth(userId, body);

    const defaultTotal = { total_absensi: 0, total_ontime: 0, total_late: 0 };
    const totalData = total.length > 0 ? total[0] : defaultTotal;

    res.json({
      message: "Get History Absensi Successfully!",
      status: "success",
      status_code: "200",
      total_absensi: totalData.total_absensi,
      total_late: totalData.total_late,
      total_ontime: totalData.total_ontime,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

const listAbsensiApproval = async (req, res) => {
  const { approvalId } = req.params;

  try {
    const [data] = await absensiModel.listAbsensiApproval(approvalId);
    res.json({
      message: "Get List Absensi Successfully!",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const totalAbsenPerMonth = async (req, res) => {
  const { userId } = req.params;

  try {
    const [data] = await absensiModel.totalAbsenPerMonth(userId);
    res.json({
      message: "Get Total Absensi Success",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const cekFeePeruser = async (req, res) => {
  const { userId } = req.params;

  try {
    const [data] = await absensiModel.cekFeePeruser(userId);
    res.json({
      message: "Cek Fee Successfully!",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const historyAbsensiAllUser = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const now = new Date();
    const firstDayOfMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01 00:00:00`;

    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastDayOfMonth = `${lastDay.getFullYear()}-${String(
      lastDay.getMonth() + 1
    ).padStart(2, "0")}-${String(lastDay.getDate()).padStart(
      2,
      "0"
    )} 23:59:59`;

    const finalStartDate = start_date || firstDayOfMonth;
    const finalEndDate = end_date || lastDayOfMonth;

    const [data] = await absensiModel.historyAbsensiAllUser(
      finalStartDate,
      finalEndDate
    );

    res.json({
      message: "Get History Absensi Successfully!",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    console.error("Error fetching history all user:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

const rekapKalender = async (req, res) => {
  try {
    const { month, retail_id } = req.query;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const targetMonth = month || currentMonth;

    const [year, mon] = targetMonth.split("-").map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();

    const users = await absensiModel.getRekapKalenderUsers(targetMonth, retail_id || null);
    const absensiRows = await absensiModel.getRekapKalenderAbsensi(targetMonth, retail_id || null);
    const offdayRows = await absensiModel.getRekapKalenderOffday(targetMonth, retail_id || null);
    const sesiCompleteRows = await absensiModel.getRekapKalenderSesiComplete(targetMonth, retail_id || null);
    const lemburRows = await absensiModel.getRekapKalenderLembur(targetMonth, retail_id || null);

    const toDateStr = (val) => {
      if (!val) return null;
      if (val instanceof Date) return moment(val).tz(timezone).format("YYYY-MM-DD");
      return String(val).slice(0, 10);
    };

    // Map absensi: key = "userId_YYYY-MM-DD" → { status_absen, absen_time }
    const absensiMap = {};
    for (const row of absensiRows) {
      const dateStr = toDateStr(row.tanggal);
      if (!dateStr) continue;
      const key = `${row.user_id}_${dateStr}`;
      if (!absensiMap[key]) {
        absensiMap[key] = {
          status: row.status_absen,
          time: row.absen_time
            ? moment(row.absen_time).tz(timezone).format("DD/MM/YYYY HH:mm")
            : null,
        };
      }
    }

    // Map offday: key = "userId_YYYY-MM-DD" → true
    const offdayMap = {};
    for (const row of offdayRows) {
      const dateStr = toDateStr(row.tanggal);
      if (!dateStr) continue;
      offdayMap[`${row.user_id}_${dateStr}`] = true;
    }

    // Map sesi lengkap (strict) + lembur: key = "userId_YYYY-MM-DD" → true.
    const completeMap = {};
    for (const row of sesiCompleteRows) {
      const dateStr = toDateStr(row.tanggal);
      if (!dateStr) continue;
      completeMap[`${row.user_id}_${dateStr}`] = true;
    }
    const lemburMap = {};
    for (const row of lemburRows) {
      const dateStr = toDateStr(row.tanggal);
      if (!dateStr) continue;
      lemburMap[`${row.user_id}_${dateStr}`] = true;
    }

    // Group users by retail
    const retailMap = {};
    for (const user of users) {
      if (!retailMap[user.retail_id]) {
        retailMap[user.retail_id] = {
          retail_id: user.retail_id,
          retail_name: user.retail_name,
          users: [],
        };
      }

      const attendance = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const key = `${user.user_id}_${dateStr}`;
        if (offdayMap[key]) {
          attendance[d] = { status: "libur", time: null };
        } else if (absensiMap[key]?.status === 1) {
          attendance[d] = {
            status: "hadir",
            time: absensiMap[key].time,
            complete: Boolean(completeMap[key]),
            lembur: Boolean(lemburMap[key]),
          };
        } else if (absensiMap[key]?.status === 2) {
          attendance[d] = {
            status: "terlambat",
            time: absensiMap[key].time,
            complete: Boolean(completeMap[key]),
            lembur: Boolean(lemburMap[key]),
          };
        } else {
          const cellDate = moment.tz(dateStr, timezone).startOf("day");
          const today = moment().tz(timezone).startOf("day");
          attendance[d] = {
            status: cellDate.isAfter(today) ? "belum" : "alpha",
            time: null,
          };
        }
      }

      retailMap[user.retail_id].users.push({
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        id_category: user.id_category,
        category_name: user.category_name,
        attendance,
      });
    }

    res.json({
      message: "Rekap Kalender Absensi",
      status: "success",
      status_code: "200",
      month: targetMonth,
      days_in_month: daysInMonth,
      data: Object.values(retailMap),
    });
  } catch (error) {
    console.error("Error rekapKalender:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

// Arah absen dari description tipe (selaras getAbsenDirection FE).
const absenDirectionOf = (desc) => {
  const d = String(desc || "").toLowerCase();
  if (d.includes("keluar") || d.includes("pulang")) return "keluar";
  if (d.includes("masuk")) return "masuk";
  return "";
};

// Koreksi absen (admin). Ubah jam/status/catatan/tipe 1 baris; recompute
// status_absen + potongan dari waktu baru + window tipe (baru bila diganti);
// sinkron absensi_sesi (tanggal + kategori); audit ke log_activity. Semua dalam
// 1 transaksi. Tipe absen boleh diubah (arah masuk/keluar wajib sama). Retail tetap.
const koreksiAbsen = async (req, res) => {
  const { absenId } = req.params;
  const adminId = req.user?.id;
  const { absen_time, status_absen: statusInput, reason, absen_type_id: typeInput } =
    req.body;

  if (!absen_time) {
    return res.status(400).json({
      message: "Waktu absen (absen_time) wajib diisi.",
      status: "failed",
      status_code: "400",
    });
  }

  try {
    const oldRow = await absensiModel.getAbsensiById(absenId);
    if (!oldRow) {
      return res.status(404).json({
        message: "Data absensi tidak ditemukan.",
        status: "failed",
        status_code: "404",
      });
    }

    // Tipe absen: pakai tipe baru bila dikirim & beda, else tipe lama.
    const oldType = await absensiModel.getTimeDB(oldRow.absen_type_id);
    const newTypeId =
      typeInput !== undefined && typeInput !== null && String(typeInput) !== ""
        ? Number(typeInput)
        : Number(oldRow.absen_type_id);
    const typeChanged = newTypeId !== Number(oldRow.absen_type_id);

    const getTimeDB = await absensiModel.getTimeDB(newTypeId);
    if (!getTimeDB) {
      return res.status(404).json({
        message: "Tipe absen tidak ditemukan.",
        status: "failed",
        status_code: "404",
      });
    }

    // Guard arah: tipe baru harus searah tipe lama (masuk↔masuk / keluar↔keluar).
    // Cegah ubah masuk jadi keluar (pecahkan pairing sesi + ubah semantik).
    if (typeChanged) {
      const oldDir = absenDirectionOf(oldType?.description);
      const newDir = absenDirectionOf(getTimeDB.description);
      if (oldDir && newDir && oldDir !== newDir) {
        return res.status(400).json({
          message: `Tipe absen baru arahnya (${newDir}) beda dgn absen ini (${oldDir}). Pilih tipe yang searah.`,
          status: "failed",
          status_code: "400",
        });
      }
    }

    const getPotonganLate = await absensiModel.getPotonganLate(1);
    const potonganLate = Number(getPotonganLate?.value || 0);

    const newMoment = moment.tz(absen_time, "YYYY-MM-DD HH:mm:ss", timezone);
    if (!newMoment.isValid()) {
      return res.status(400).json({
        message: "Format waktu absen tidak valid (YYYY-MM-DD HH:mm:ss).",
        status: "failed",
        status_code: "400",
      });
    }
    const timeAbsenFull = newMoment.format("YYYY-MM-DD HH:mm:ss");

    // Recompute status_absen + potongan dari waktu baru vs window tipe.
    // Bila admin kirim status_absen eksplisit → pakai; else derive dari end_time.
    const endTimeDB = moment
      .tz(getTimeDB.end_time, "HH:mm:ss", timezone)
      .format("HH:mm:ss");
    const newTimeHHmmss = newMoment.format("HH:mm:ss");

    let status_absen;
    if (statusInput === 1 || statusInput === 2 || statusInput === "1" || statusInput === "2") {
      status_absen = Number(statusInput);
    } else {
      status_absen = newTimeHHmmss < endTimeDB ? 1 : 2;
    }

    let potongan = 0;
    if (status_absen === 2) {
      const diffMinutes = moment(newTimeHHmmss, "HH:mm:ss").diff(
        moment(endTimeDB, "HH:mm:ss"),
        "minutes"
      );
      if (diffMinutes > 15) {
        potongan = potonganLate;
      }
    }

    const updatedAt = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
    const newReason = reason !== undefined ? reason : oldRow.reason;

    const conn = await dbpool.getConnection();
    try {
      await conn.beginTransaction();

      await absensiModel.koreksiAbsen(
        conn,
        absenId,
        {
          absen_time: timeAbsenFull,
          status_absen,
          potongan,
          reason: newReason,
          absen_type_id: newTypeId,
          updated_at: updatedAt,
        },
        adminId,
        oldRow
      );

      // Sinkron sesi.
      const sesi = await sesiModel.findSesiByAbsensiId(conn, absenId);
      if (sesi) {
        // Tanggal: hanya baris masuk yang meng-anchor tanggal sesi.
        if (String(sesi.masuk_absensi_id) === String(absenId)) {
          const newTanggal = newMoment.format("YYYY-MM-DD");
          const oldTanggal = moment(sesi.tanggal).format("YYYY-MM-DD");
          if (newTanggal !== oldTanggal) {
            await sesiModel.updateSesiTanggal(conn, sesi.sesi_id, newTanggal, updatedAt);
          }
        }
        // Kategori: bila tipe berganti, selaraskan kategori sesi dgn tipe baru
        // (fallback ke kategori tipe keluar pasangan bila tipe kategori NULL) —
        // jaga findOpenSesi tetap bisa memasangkan (cegah sesi pecah).
        if (typeChanged) {
          const newKategori =
            getTimeDB.kategori_absen ||
            (await absensiModel.getKeluarKategoriByName(getTimeDB.name)) ||
            null;
          if (String(newKategori || "") !== String(sesi.kategori_absen || "")) {
            await sesiModel.updateSesiKategori(conn, sesi.sesi_id, newKategori, updatedAt);
          }
        }
      }

      await conn.commit();
    } catch (txError) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }

    return res.json({
      message: "Koreksi absen berhasil.",
      status: "success",
      status_code: "200",
      data: {
        absensi_id: Number(absenId),
        absen_time: timeAbsenFull,
        status_absen,
        potongan,
        reason: newReason,
        absen_type_id: newTypeId,
        category_absen: getTimeDB.name,
        description: getTimeDB.description,
        updated_by: adminId,
        updated_at: updatedAt,
      },
    });
  } catch (error) {
    console.error("Error koreksiAbsen:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

// POST /api/absensi/sesi/:sesiId/lembur — konversi sesi Regular <-> Lembur (admin).
// Set is_lembur target (0/1) pada sesi + KEDUA row absensi (masuk & keluar) agar
// sinkron (guard matchSesi/findOpenSesi filter is_lembur). Opsional ganti tipe
// absen masuk/keluar ke shift lain → fee ikut tipe baru (tipe_absen.fee via
// absen_type_id), status_absen + potongan di-recompute (pola koreksiAbsen).
// Arah tipe tak boleh berubah (masuk tetap masuk, keluar tetap keluar). Atomic.
const konversiLemburSesi = async (req, res) => {
  const { sesiId } = req.params;
  const adminId = req.user?.id;
  const { is_lembur, masuk_absen_type_id, keluar_absen_type_id } = req.body;

  if (is_lembur === undefined || is_lembur === null) {
    return res.status(400).json({
      message: "Field is_lembur (0/1) wajib diisi.",
      status: "failed",
      status_code: "400",
    });
  }
  const targetLembur = Number(is_lembur) === 1 ? 1 : 0;

  try {
    const sesi = await sesiModel.getSesiById(sesiId);
    if (!sesi) {
      return res.status(404).json({
        message: "Sesi tidak ditemukan.",
        status: "failed",
        status_code: "404",
      });
    }

    // Slot yang akan dikonversi: (row absensi, arah, tipe baru bila diminta).
    const slots = [];
    if (sesi.masuk_absensi_id != null) {
      slots.push({ absensiId: sesi.masuk_absensi_id, dir: "masuk", newTypeInput: masuk_absen_type_id });
    }
    if (sesi.keluar_absensi_id != null) {
      slots.push({ absensiId: sesi.keluar_absensi_id, dir: "keluar", newTypeInput: keluar_absen_type_id });
    }
    if (slots.length === 0) {
      return res.status(400).json({
        message: "Sesi tak punya baris absensi untuk dikonversi.",
        status: "failed",
        status_code: "400",
      });
    }

    const getPotonganLate = await absensiModel.getPotonganLate(1);
    const potonganLate = Number(getPotonganLate?.value || 0);
    const updatedAt = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");

    // Pra-validasi + hitung field per slot SEBELUM transaksi (fail fast).
    let typeChangedAny = false;
    let kategoriBaruSesi = null;
    for (const slot of slots) {
      const oldRow = await absensiModel.getAbsensiById(slot.absensiId);
      if (!oldRow) {
        return res.status(404).json({
          message: `Baris absensi #${slot.absensiId} tidak ditemukan.`,
          status: "failed",
          status_code: "404",
        });
      }
      slot.oldRow = oldRow;

      const typeGiven =
        slot.newTypeInput !== undefined &&
        slot.newTypeInput !== null &&
        String(slot.newTypeInput) !== "";
      const newTypeId = typeGiven ? Number(slot.newTypeInput) : Number(oldRow.absen_type_id);
      slot.typeChanged = newTypeId !== Number(oldRow.absen_type_id);
      slot.newTypeId = newTypeId;

      if (slot.typeChanged) {
        const newType = await absensiModel.getTimeDB(newTypeId);
        if (!newType) {
          return res.status(404).json({
            message: `Tipe absen #${newTypeId} tidak ditemukan.`,
            status: "failed",
            status_code: "404",
          });
        }
        // Guard arah: tipe baru harus searah slot (masuk↔masuk / keluar↔keluar).
        const newDir = absenDirectionOf(newType.description);
        if (newDir && newDir !== slot.dir) {
          return res.status(400).json({
            message: `Tipe absen untuk slot ${slot.dir} arahnya (${newDir}) tidak sesuai. Pilih tipe ${slot.dir}.`,
            status: "failed",
            status_code: "400",
          });
        }

        // Recompute status_absen + potongan dari jam absen row vs window tipe baru.
        const endTimeDB = moment
          .tz(newType.end_time, "HH:mm:ss", timezone)
          .format("HH:mm:ss");
        const rowHHmmss = moment
          .tz(oldRow.absen_time, timezone)
          .format("HH:mm:ss");
        const statusAbsen = rowHHmmss < endTimeDB ? 1 : 2;
        let potongan = 0;
        if (statusAbsen === 2) {
          const diffMinutes = moment(rowHHmmss, "HH:mm:ss").diff(
            moment(endTimeDB, "HH:mm:ss"),
            "minutes"
          );
          if (diffMinutes > 15) potongan = potonganLate;
        }
        slot.statusAbsen = statusAbsen;
        slot.potongan = potongan;

        typeChangedAny = true;
        // Kategori sesi diselaraskan dari tipe MASUK (anchor). Fallback kategori
        // tipe keluar pasangan bila kategori tipe masuk NULL.
        if (slot.dir === "masuk") {
          kategoriBaruSesi =
            newType.kategori_absen ||
            (await absensiModel.getKeluarKategoriByName(newType.name)) ||
            null;
        }
      }
    }

    const conn = await dbpool.getConnection();
    try {
      await conn.beginTransaction();

      for (const slot of slots) {
        await absensiModel.updateAbsensiLemburType(
          conn,
          slot.absensiId,
          {
            is_lembur: targetLembur,
            absen_type_id: slot.typeChanged ? slot.newTypeId : undefined,
            status_absen: slot.typeChanged ? slot.statusAbsen : undefined,
            potongan: slot.typeChanged ? slot.potongan : undefined,
            updated_at: updatedAt,
          },
          adminId,
          slot.oldRow
        );
      }

      await sesiModel.updateSesiLembur(conn, sesiId, targetLembur, updatedAt);

      // Selaraskan kategori sesi bila tipe masuk berganti (cegah sesi pecah).
      if (kategoriBaruSesi !== null && String(kategoriBaruSesi) !== String(sesi.kategori_absen || "")) {
        await sesiModel.updateSesiKategori(conn, sesiId, kategoriBaruSesi, updatedAt);
      }

      await logSesiActivity(
        conn,
        "CONVERT_LEMBUR",
        {
          sesi_id: Number(sesiId),
          old_is_lembur: sesi.is_lembur,
          new_is_lembur: targetLembur,
          type_changed: typeChangedAny,
          slots: slots.map((s) => ({
            absensi_id: s.absensiId,
            dir: s.dir,
            old_type: s.oldRow.absen_type_id,
            new_type: s.typeChanged ? s.newTypeId : s.oldRow.absen_type_id,
          })),
        },
        adminId
      );

      await conn.commit();
    } catch (txError) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }

    return res.json({
      message: `Sesi dikonversi ke ${targetLembur === 1 ? "Lembur" : "Regular"}.`,
      status: "success",
      status_code: "200",
      data: {
        sesi_id: Number(sesiId),
        is_lembur: targetLembur,
        type_changed: typeChangedAny,
        updated_at: updatedAt,
      },
    });
  } catch (error) {
    console.error("Error konversiLemburSesi:", error);
    return res.status(500).json({
      message: "Gagal konversi sesi lembur.",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

// POST /api/absensi/delete/:absenId — hapus 1 baris absensi (admin).
// Hard delete (tabel tak punya kolom soft-delete) + snapshot ke log_activity.
// Sesi terkait disesuaikan: slot yang mereferensi baris ini di-NULL-kan & status
// jadi 'incomplete'; bila sesi jadi kosong total → sesi ikut dihapus.
// File foto TIDAK dihapus dari disk.
const deleteAbsensiRow = async (req, res) => {
  const { absenId } = req.params;
  const adminId = req.user?.id;
  const updatedAt = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");

  const oldRow = await absensiModel.getAbsensiById(absenId);
  if (!oldRow) {
    return res.status(404).json({
      message: "Data absensi tidak ditemukan.",
      status: "failed",
      status_code: "404",
    });
  }

  const conn = await dbpool.getConnection();
  try {
    await conn.beginTransaction();
    // Lepas dari sesi dulu agar snapshot efek sesi ikut tercatat di audit.
    const sesiEffect = await sesiModel.detachAbsensiFromSesi(conn, absenId, updatedAt);
    await absensiModel.deleteAbsensi(conn, absenId, adminId, {
      ...oldRow,
      sesi_effect: sesiEffect,
    });
    await conn.commit();

    return res.json({
      message: "Absensi dihapus.",
      status: "success",
      status_code: "200",
      data: { absensi_id: Number(absenId), sesi_effect: sesiEffect },
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error deleteAbsensiRow:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  } finally {
    conn.release();
  }
};

// List tipe absen per arah (masuk/keluar) untuk dropdown koreksi.
// GET /api/absensi/tipe-absen?direction=masuk|keluar
const listTipeAbsenByDirection = async (req, res) => {
  const direction = String(req.query.direction || "").toLowerCase();
  if (direction !== "masuk" && direction !== "keluar") {
    return res.status(400).json({
      message: "Query 'direction' wajib 'masuk' atau 'keluar'.",
      status: "failed",
      status_code: "400",
    });
  }
  try {
    const data = await absensiModel.getTipeAbsenByDirection(direction);
    return res.json({
      message: "Get Tipe Absen Success",
      status: "success",
      status_code: "200",
      data,
    });
  } catch (error) {
    console.error("Error listTipeAbsenByDirection:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

// ── Kelola Sesi Absensi (page manage sesi) ──────────────────────────────────

// log_activity.action = ENUM('INSERT','UPDATE','DELETE'). Map aksi sesi ke enum
// valid; simpan label aksi asli (MATCH/UNMATCH/dll) di dalam dataquery.
const SESI_ACTION_ENUM = {
  MATCH: "UPDATE",
  UNMATCH: "UPDATE",
  UPDATE_STATUS: "UPDATE",
  ADD_ABSEN: "INSERT",
  DELETE: "DELETE",
  CONVERT_LEMBUR: "UPDATE",
};
const logSesiActivity = async (conn, action, payload, adminId) => {
  const enumAction = SESI_ACTION_ENUM[action] || "UPDATE";
  await conn.query(
    `INSERT INTO log_activity (table_name, action, dataquery, user_id) VALUES (?, ?, ?, ?)`,
    ["absensi_sesi", enumAction, JSON.stringify({ action, ...payload }), adminId]
  );
};

// GET /api/absensi/sesi — list sesi paginated + filter.
const listSesiAbsensi = async (req, res) => {
  try {
    const filters = {
      status: req.query.status || null,
      userId: req.query.user_id || null,
      retailId: req.query.retail_id || null,
      kategori: req.query.kategori || null,
      startDate: req.query.start_date || null,
      endDate: req.query.end_date || null,
      search: req.query.search || null,
      page: req.query.page,
      limit: req.query.limit,
    };
    const [{ rows, page, limit }, total] = await Promise.all([
      sesiModel.listSesi(filters),
      sesiModel.countSesi(filters),
    ]);
    return res.json({
      message: "Get Sesi Absensi Success",
      status: "success",
      status_code: "200",
      data: rows,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error listSesiAbsensi:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

// GET /api/absensi/sesi/:sesiId/candidates — kandidat pasangan match.
const getSesiCandidates = async (req, res) => {
  try {
    const result = await sesiModel.findMatchCandidates(req.params.sesiId);
    if (!result.sesi) {
      return res.status(404).json({
        message: "Sesi tidak ditemukan.",
        status: "failed",
        status_code: "404",
      });
    }
    return res.json({
      message: "Get Kandidat Success",
      status: "success",
      status_code: "200",
      data: result.candidates,
      need_direction: result.needDir || null,
      sesi: result.sesi,
    });
  } catch (error) {
    console.error("Error getSesiCandidates:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

// POST /api/absensi/sesi/match — gabung masuk-sesi + keluar-sesi jadi closed.
const matchSesiAbsensi = async (req, res) => {
  const adminId = req.user?.id;
  const { masuk_sesi_id, keluar_sesi_id } = req.body;
  if (!masuk_sesi_id || !keluar_sesi_id) {
    return res.status(400).json({
      message: "masuk_sesi_id & keluar_sesi_id wajib diisi.",
      status: "failed",
      status_code: "400",
    });
  }
  const updatedAt = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
  const conn = await dbpool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await sesiModel.matchSesi(conn, masuk_sesi_id, keluar_sesi_id, updatedAt);
    await logSesiActivity(conn, "MATCH", result, adminId);
    await conn.commit();
    return res.json({
      message: "Sesi berhasil dipasangkan.",
      status: "success",
      status_code: "200",
      data: result,
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error matchSesiAbsensi:", error);
    return res.status(400).json({
      message: error.message || "Gagal match sesi.",
      status: "failed",
      status_code: "400",
    });
  } finally {
    conn.release();
  }
};

// POST /api/absensi/sesi/:sesiId/unmatch — pisah closed jadi 2 incomplete.
const unmatchSesiAbsensi = async (req, res) => {
  const adminId = req.user?.id;
  const { sesiId } = req.params;
  const updatedAt = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
  const conn = await dbpool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await sesiModel.unmatchSesi(conn, sesiId, updatedAt);
    await logSesiActivity(conn, "UNMATCH", result, adminId);
    await conn.commit();
    return res.json({
      message: "Sesi berhasil dipisah.",
      status: "success",
      status_code: "200",
      data: result,
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error unmatchSesiAbsensi:", error);
    return res.status(400).json({
      message: error.message || "Gagal unmatch sesi.",
      status: "failed",
      status_code: "400",
    });
  } finally {
    conn.release();
  }
};

// POST /api/absensi/sesi/:sesiId/status — ubah status manual.
const updateSesiAbsensi = async (req, res) => {
  const adminId = req.user?.id;
  const { sesiId } = req.params;
  const { status } = req.body;
  const updatedAt = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
  const conn = await dbpool.getConnection();
  try {
    await conn.beginTransaction();
    const before = await sesiModel.getSesiById(sesiId, conn);
    if (!before) throw new Error("Sesi tidak ditemukan.");
    await sesiModel.updateSesiStatus(conn, sesiId, status, updatedAt);
    await logSesiActivity(
      conn,
      "UPDATE_STATUS",
      { sesi_id: Number(sesiId), old: before.status, new: status },
      adminId
    );
    await conn.commit();
    return res.json({
      message: "Status sesi diperbarui.",
      status: "success",
      status_code: "200",
      data: { sesi_id: Number(sesiId), status },
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error updateSesiAbsensi:", error);
    return res.status(400).json({
      message: error.message || "Gagal ubah status.",
      status: "failed",
      status_code: "400",
    });
  } finally {
    conn.release();
  }
};

// POST /api/absensi/sesi/:sesiId/delete — hapus 1 sesi.
const deleteSesiAbsensi = async (req, res) => {
  const adminId = req.user?.id;
  const { sesiId } = req.params;
  const conn = await dbpool.getConnection();
  try {
    await conn.beginTransaction();
    const before = await sesiModel.getSesiById(sesiId, conn);
    if (!before) throw new Error("Sesi tidak ditemukan.");
    await logSesiActivity(conn, "DELETE", { sesi_id: Number(sesiId), snapshot: before }, adminId);
    await sesiModel.deleteSesi(conn, sesiId);
    await conn.commit();
    return res.json({
      message: "Sesi dihapus.",
      status: "success",
      status_code: "200",
      data: { sesi_id: Number(sesiId) },
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error deleteSesiAbsensi:", error);
    return res.status(400).json({
      message: error.message || "Gagal hapus sesi.",
      status: "failed",
      status_code: "400",
    });
  } finally {
    conn.release();
  }
};

// POST /api/absensi/sesi/:sesiId/add-absen — tambah absen bagian yang hilang
// pada sesi incomplete (mis. keluar hilang → admin isi). Insert absensi manual
// (placeholder foto/GPS), recompute status dari jam+tipe, isi slot sesi + close.
// Body: { absen_time, status_absen? (override 1/2), reason?, absen_type_id? }.
const addAbsenToSesi = async (req, res) => {
  const adminId = req.user?.id;
  const { sesiId } = req.params;
  const { absen_time, status_absen: statusInput, reason, absen_type_id: typeInput } = req.body;

  if (!absen_time) {
    return res.status(400).json({
      message: "Waktu absen (absen_time) wajib diisi.",
      status: "failed",
      status_code: "400",
    });
  }

  try {
    const sesi = await sesiModel.getSesiById(sesiId);
    if (!sesi) {
      return res.status(404).json({
        message: "Sesi tidak ditemukan.",
        status: "failed",
        status_code: "404",
      });
    }
    // Sesi 'open' (masuk terisi, keluar kosong — mis. hasil buat sesi baru) &
    // 'incomplete' (salah satu slot kosong) boleh ditambah absen. 'closed' tidak.
    if (sesi.status !== "incomplete" && sesi.status !== "open") {
      return res.status(400).json({
        message: "Hanya sesi open/incomplete yang bisa ditambah absen.",
        status: "failed",
        status_code: "400",
      });
    }

    // Arah slot yang hilang.
    const missingDir = sesi.masuk_absensi_id == null ? "masuk" : "keluar";
    if (missingDir === "masuk" && sesi.masuk_absensi_id != null) {
      return res.status(400).json({ message: "Slot masuk sudah terisi.", status: "failed", status_code: "400" });
    }
    if (missingDir === "keluar" && sesi.keluar_absensi_id != null) {
      return res.status(400).json({ message: "Slot keluar sudah terisi.", status: "failed", status_code: "400" });
    }

    // Resolve tipe absen: pakai typeInput bila dikirim, else tipe lawan-arah by
    // shift name sesi. Guard: tipe harus searah slot hilang.
    const shiftName = sesi.masuk_shift || sesi.keluar_shift;
    let tipe;
    if (typeInput) {
      tipe = await absensiModel.getTimeDB(Number(typeInput));
      if (!tipe) {
        return res.status(404).json({ message: "Tipe absen tidak ditemukan.", status: "failed", status_code: "404" });
      }
      const dir = String(tipe.description || "").toLowerCase();
      const tipeDir = dir.includes("keluar") || dir.includes("pulang") ? "keluar" : dir.includes("masuk") ? "masuk" : "";
      if (tipeDir && tipeDir !== missingDir) {
        return res.status(400).json({
          message: `Tipe absen harus arah "${missingDir}".`,
          status: "failed",
          status_code: "400",
        });
      }
    } else {
      tipe = await absensiModel.getTipeByNameDirection(shiftName, missingDir);
      if (!tipe) {
        return res.status(400).json({
          message: `Tipe absen "${missingDir}" untuk shift ${shiftName || "-"} tidak ditemukan. Pilih tipe manual.`,
          status: "failed",
          status_code: "400",
        });
      }
    }

    const newMoment = moment.tz(absen_time, "YYYY-MM-DD HH:mm:ss", timezone);
    if (!newMoment.isValid()) {
      return res.status(400).json({
        message: "Format waktu absen tidak valid (YYYY-MM-DD HH:mm:ss).",
        status: "failed",
        status_code: "400",
      });
    }
    const timeAbsenFull = newMoment.format("YYYY-MM-DD HH:mm:ss");

    // Recompute status_absen + potongan dari jam vs end_time tipe (override boleh).
    const getPotonganLate = await absensiModel.getPotonganLate(1);
    const potonganLate = Number(getPotonganLate?.value || 0);
    const endTimeDB = moment.tz(tipe.end_time, "HH:mm:ss", timezone).format("HH:mm:ss");
    const newTimeHHmmss = newMoment.format("HH:mm:ss");
    let status_absen;
    if (statusInput === 1 || statusInput === 2 || statusInput === "1" || statusInput === "2") {
      status_absen = Number(statusInput);
    } else {
      status_absen = newTimeHHmmss < endTimeDB ? 1 : 2;
    }
    let potongan = 0;
    if (status_absen === 2) {
      const diffMinutes = moment(newTimeHHmmss, "HH:mm:ss").diff(moment(endTimeDB, "HH:mm:ss"), "minutes");
      if (diffMinutes > 15) potongan = potonganLate;
    }

    const manualReason = String(reason || "").trim()
      ? `${reason} [input manual admin]`
      : "[input manual admin]";

    const conn = await dbpool.getConnection();
    try {
      await conn.beginTransaction();

      // Insert absensi manual: placeholder foto/GPS, valid langsung (admin input).
      const insertBody = {
        user_id: sesi.user_id,
        retail_id: sesi.retail_id,
        absen_type_id: tipe.absen_id,
        latitude: 0,
        longitude: 0,
        reason: manualReason,
        is_approval: 0,
        is_lembur: sesi.is_lembur,
      };
      // Foto opsional (upload.single('photo_url')); kosong bila tak diunggah. Lokasi none.
      // Format path samakan dgn absen normal: "/assets/<filename>" (FE render
      // `${VITE_API_IMAGE}${photo_url}`, static mount di /assets).
      const imageUrl = req.file?.filename ? `/assets/${req.file.filename}` : "";
      const result = await absensiModel.createAbsensi(
        insertBody,
        imageUrl,
        status_absen,
        2,                      // status_approval = approved
        adminId,                // upline/approval_by = admin
        timeAbsenFull,
        potongan,
        1,                      // is_valid
        conn
      );
      const newAbsensiId = result.insertId;

      // Isi slot sesi + close.
      await sesiModel.fillSesiSlot(conn, sesiId, missingDir, newAbsensiId, timeAbsenFull);

      await logSesiActivity(
        conn,
        "ADD_ABSEN",
        { sesi_id: Number(sesiId), direction: missingDir, absensi_id: newAbsensiId, absen_type_id: tipe.absen_id },
        adminId
      );

      await conn.commit();
      return res.json({
        message: `Absen ${missingDir} ditambahkan, sesi ditutup.`,
        status: "success",
        status_code: "200",
        data: { sesi_id: Number(sesiId), direction: missingDir, absensi_id: newAbsensiId, status_absen, potongan },
      });
    } catch (txError) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error addAbsenToSesi:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

// POST /api/absensi/sesi/create — buat sesi absen baru (absen MASUK) dari nol.
// Sesi 'open' (keluar diisi kemudian via add-absen). Pilih shift (absen_type_id
// tipe masuk) → insert absensi masuk manual (placeholder foto/GPS) + openSesi.
// Body: { user_id, retail_id, absen_type_id, absen_time, status_absen?, reason? }.
const createNewSesi = async (req, res) => {
  const adminId = req.user?.id;
  const { user_id, retail_id, absen_type_id, absen_time, status_absen: statusInput, reason, is_lembur } = req.body;

  if (!user_id || !retail_id || !absen_type_id || !absen_time) {
    return res.status(400).json({
      message: "user_id, retail_id, absen_type_id, absen_time wajib diisi.",
      status: "failed",
      status_code: "400",
    });
  }

  try {
    const tipe = await absensiModel.getTimeDB(Number(absen_type_id));
    if (!tipe) {
      return res.status(404).json({ message: "Tipe absen tidak ditemukan.", status: "failed", status_code: "404" });
    }
    // Tipe harus arah MASUK (sesi dibuka dari absen masuk).
    const dir = String(tipe.description || "").toLowerCase();
    const isMasuk = dir.includes("masuk");
    if (!isMasuk) {
      return res.status(400).json({
        message: "Tipe absen harus arah MASUK untuk membuka sesi baru.",
        status: "failed",
        status_code: "400",
      });
    }

    const newMoment = moment.tz(absen_time, "YYYY-MM-DD HH:mm:ss", timezone);
    if (!newMoment.isValid()) {
      return res.status(400).json({
        message: "Format waktu absen tidak valid (YYYY-MM-DD HH:mm:ss).",
        status: "failed",
        status_code: "400",
      });
    }
    const timeAbsenFull = newMoment.format("YYYY-MM-DD HH:mm:ss");
    const tanggalMasuk = newMoment.format("YYYY-MM-DD");

    // Recompute status_absen + potongan dari jam vs end_time tipe (override boleh).
    const getPotonganLate = await absensiModel.getPotonganLate(1);
    const potonganLate = Number(getPotonganLate?.value || 0);
    const endTimeDB = moment.tz(tipe.end_time, "HH:mm:ss", timezone).format("HH:mm:ss");
    const newTimeHHmmss = newMoment.format("HH:mm:ss");
    let status_absen;
    if (statusInput === 1 || statusInput === 2 || statusInput === "1" || statusInput === "2") {
      status_absen = Number(statusInput);
    } else {
      status_absen = newTimeHHmmss < endTimeDB ? 1 : 2;
    }
    let potongan = 0;
    if (status_absen === 2) {
      const diffMinutes = moment(newTimeHHmmss, "HH:mm:ss").diff(moment(endTimeDB, "HH:mm:ss"), "minutes");
      if (diffMinutes > 15) potongan = potonganLate;
    }

    // Kategori sesi = kategori tipe (fallback kategori keluar pasangan bila NULL).
    let kategoriAbsen = tipe.kategori_absen || null;
    if (!kategoriAbsen && tipe.name) {
      kategoriAbsen = (await absensiModel.getKeluarKategoriByName(tipe.name)) || null;
    }
    const lembur = is_lembur === 1 || is_lembur === "1" ? 1 : 0;

    const manualReason = String(reason || "").trim()
      ? `${reason} [input manual admin]`
      : "[input manual admin]";

    const conn = await dbpool.getConnection();
    try {
      await conn.beginTransaction();

      const insertBody = {
        user_id: Number(user_id),
        retail_id: Number(retail_id),
        absen_type_id: tipe.absen_id,
        latitude: 0,
        longitude: 0,
        reason: manualReason,
        is_approval: 0,
        is_lembur: lembur,
      };
      // Foto opsional; kosong bila tak diunggah. Lokasi none.
      // Format path samakan dgn absen normal: "/assets/<filename>".
      const imageUrl = req.file?.filename ? `/assets/${req.file.filename}` : "";
      const result = await absensiModel.createAbsensi(
        insertBody, imageUrl, status_absen, 2, adminId, timeAbsenFull, potongan, 1, conn
      );
      const newAbsensiId = result.insertId;

      const jadwalId = lembur
        ? null
        : await sesiModel.resolveJadwalId(Number(user_id), tipe.absen_id, tanggalMasuk, conn);

      const newSesiId = await sesiModel.openSesi(conn, {
        user_id: Number(user_id),
        tanggal: tanggalMasuk,
        retail_id: Number(retail_id),
        jadwal_id: jadwalId,
        kategori_absen: kategoriAbsen,
        masuk_absensi_id: newAbsensiId,
        is_lembur: lembur,
        created_at: timeAbsenFull,
      });

      await logSesiActivity(
        conn,
        "ADD_ABSEN",
        { sesi_id: newSesiId, direction: "masuk", absensi_id: newAbsensiId, absen_type_id: tipe.absen_id, created: true },
        adminId
      );

      await conn.commit();
      return res.json({
        message: "Sesi baru dibuat (absen masuk). Isi absen keluar via tambah absen.",
        status: "success",
        status_code: "200",
        data: { sesi_id: newSesiId, masuk_absensi_id: newAbsensiId, status_absen, potongan },
      });
    } catch (txError) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error createNewSesi:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

module.exports = {
  createAbsensi,
  approveAbsen,
  validasiAbsen,
  rejectAbsen,
  historyAbsensiPerUser,
  listAbsensiApproval,
  totalAbsenPerMonth,
  cekFeePeruser,
  historyAbsensiAllUser,
  koreksiAbsen,
  konversiLemburSesi,
  deleteAbsensiRow,
  listTipeAbsenByDirection,
  listSesiAbsensi,
  getSesiCandidates,
  matchSesiAbsensi,
  unmatchSesiAbsensi,
  updateSesiAbsensi,
  deleteSesiAbsensi,
  addAbsenToSesi,
  createNewSesi,
  rekapKalender,
};
