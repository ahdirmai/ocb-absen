package com.ocbabsensiapps;

import org.json.JSONObject;

// Model 1 baris history absensi — hanya field yang dipakai untuk keputusan
// arah/sesi/lembur (port dari web AbsenKaryawan.jsx). Field bisa null bila BE
// tak kirim (data lama); parsing pakai optString/opt untuk toleransi.
public class HistoryItem {
    public String absensi_id;
    public String absen_type_id;
    public String absen_time;      // ISO / "yyyy-MM-dd HH:mm:ss"
    public String description;
    public String kategori_absen;
    public String category_absen;  // nama tipe absen (BE: ta.name AS category_absen)
    public String retail_id;
    public int is_lembur;          // 0/1
    public int is_cross_date;      // 0/1
    public String sesi_status;     // "open" | "closed" | null
    public String sesi_direction;  // "masuk" | "keluar" | null
    public String sesi_id;         // nullable
    public String keluar_start_time; // "HH:mm[:ss]" | null
    public String status_approval; // 0/1/2/3 atau teks
    public int is_valid;           // 0/1
    public String reason;

    public static HistoryItem fromJson(JSONObject o) {
        HistoryItem h = new HistoryItem();
        h.absensi_id = o.optString("absensi_id", null);
        h.absen_type_id = o.optString("absen_type_id", null);
        h.absen_time = o.optString("absen_time", null);
        h.description = o.optString("description", "");
        h.kategori_absen = o.isNull("kategori_absen") ? "" : o.optString("kategori_absen", "");
        h.category_absen = o.isNull("category_absen") ? "" : o.optString("category_absen", "");
        h.retail_id = o.isNull("retail_id") ? null : o.optString("retail_id", null);
        h.is_lembur = o.optInt("is_lembur", 0);
        h.is_cross_date = o.optInt("is_cross_date", 0);
        h.sesi_status = o.isNull("sesi_status") ? null : o.optString("sesi_status", null);
        h.sesi_direction = o.isNull("sesi_direction") ? null : o.optString("sesi_direction", null);
        h.sesi_id = o.isNull("sesi_id") ? null : o.optString("sesi_id", null);
        h.keluar_start_time = o.isNull("keluar_start_time") ? null : o.optString("keluar_start_time", null);
        // status_approval bisa number atau string di BE.
        h.status_approval = o.isNull("status_approval") ? null : o.optString("status_approval", null);
        h.is_valid = o.optInt("is_valid", 1);
        h.reason = o.optString("reason", "");
        return h;
    }
}
