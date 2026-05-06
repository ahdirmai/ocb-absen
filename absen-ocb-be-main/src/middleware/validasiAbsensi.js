const absensiModel = require("../models/absensi.model");
const dbpool = require("../config/database");
const fs = require("fs");
const path = require("path");

function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

const removeUploadedImage = (filename) => {
  if (!filename) {
    return;
  }

  const imagePath = path.resolve(__dirname, "../../public/images", filename);
  fs.unlink(imagePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to delete file:", err);
    }
  });
};

const rejectValidation = (req, res, message) => {
  removeUploadedImage(req.file?.filename);

  return res.status(400).json({
    message,
    status: "failed",
    status_code: "400",
  });
};

const checkAbsensi = async (req, res, next) => {
  const { absen_type_id, user_id, retail_id, latitude, longitude } = req.body;

  if (isBlank(user_id) || isBlank(absen_type_id) || isBlank(retail_id)) {
    return rejectValidation(req, res, "User, retail, dan tipe absen wajib diisi.");
  }

  if (isBlank(latitude) || isBlank(longitude)) {
    return rejectValidation(req, res, "Lokasi GPS wajib diaktifkan untuk absen!");
  }

  const latitudeNumber = Number(latitude);
  const longitudeNumber = Number(longitude);

  if (Number.isNaN(latitudeNumber) || Number.isNaN(longitudeNumber)) {
    return rejectValidation(req, res, "Format koordinat GPS tidak valid.");
  }

  try {
    const cekAbsenToday = await absensiModel.cekAbesensiToday(
      user_id,
      absen_type_id
    );

    if (cekAbsenToday) {
      return rejectValidation(
        req,
        res,
        "Mohon Maaf Anda sudah Absen hari ini untuk tipe Absen ini"
      );
    }

    const [retailers] = await dbpool.query(
      "SELECT retail_id, name, latitude, longitude, radius FROM retail WHERE retail_id = ?",
      [retail_id]
    );

    if (retailers.length === 0) {
      return rejectValidation(req, res, "Retail untuk absensi tidak ditemukan.");
    }

    const retail = retailers[0];

    if (
      !isBlank(retail.latitude) &&
      !isBlank(retail.longitude) &&
      !isBlank(retail.radius)
    ) {
      const jarak = hitungJarak(
        latitudeNumber,
        longitudeNumber,
        Number(retail.latitude),
        Number(retail.longitude)
      );

      if (jarak > Number(retail.radius)) {
        req.body.is_approval = 1;
      }
    }

    next();
  } catch (error) {
    console.error("Error validasi absensi:", error);
    return res.status(500).json({
      message: "Gagal memvalidasi absensi.",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

module.exports = checkAbsensi;
