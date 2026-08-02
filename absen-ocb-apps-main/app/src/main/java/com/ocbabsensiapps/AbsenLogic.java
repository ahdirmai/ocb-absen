package com.ocbabsensiapps;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.text.SimpleDateFormat;

// Port helper keputusan absen dari web (AbsenKaryawan.jsx) ke Java.
// Deterministik, tanpa side-effect. Semua waktu pakai zona perangkat (local),
// konsisten dgn web yang pakai new Date() local components.
public class AbsenLogic {

    public static final int EARLY_MASUK_WINDOW_MINUTES = 60;
    public static final int CROSS_DATE_KELUAR_GRACE_HOURS = 3;

    // ── Parsing waktu toleran (ISO 8601 / "yyyy-MM-dd HH:mm:ss") ──
    private static final String[] DATE_PATTERNS = {
            "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss'Z'",
            "yyyy-MM-dd'T'HH:mm:ssXXX",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd"
    };

    public static Date parseDate(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        for (String p : DATE_PATTERNS) {
            try {
                SimpleDateFormat f = new SimpleDateFormat(p, Locale.US);
                // Pola tanpa offset diparse sbg local; ISO 'Z'/offset dihormati.
                return f.parse(value);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    // ── getAbsenDirection: dari description ──
    public static String getAbsenDirection(String description) {
        String d = description == null ? "" : description.toLowerCase(Locale.US);
        if (d.contains("keluar") || d.contains("pulang")) return "keluar";
        if (d.contains("masuk")) return "masuk";
        return "";
    }

    public static String directionOf(HistoryItem h) {
        return getAbsenDirection(h == null ? "" : h.description);
    }

    public static String directionOf(AbsenItem t) {
        return getAbsenDirection(t == null ? "" : t.getDescription());
    }

    // ── isSameLocalDate(dateValue) vs sekarang ──
    public static boolean isSameLocalDate(String dateValue) {
        return isSameLocalDate(dateValue, new Date());
    }

    public static boolean isSameLocalDate(String dateValue, Date compare) {
        Date d = parseDate(dateValue);
        if (d == null) return false;
        Calendar a = Calendar.getInstance();
        a.setTime(d);
        Calendar b = Calendar.getInstance();
        b.setTime(compare);
        return a.get(Calendar.YEAR) == b.get(Calendar.YEAR)
                && a.get(Calendar.MONTH) == b.get(Calendar.MONTH)
                && a.get(Calendar.DAY_OF_MONTH) == b.get(Calendar.DAY_OF_MONTH);
    }

    // ── isRejectedAttendance ──
    public static boolean isRejectedAttendance(HistoryItem h) {
        if (h == null) return false;
        String s = h.status_approval == null ? "" : h.status_approval.toLowerCase(Locale.US);
        return "3".equals(s) || s.contains("tolak") || s.contains("reject");
    }

    // ── getCrossDateKeluarDeadline: masuk +1 hari @ keluar_start_time + grace ──
    // Return epoch ms, atau -1 bila data tak cukup (tak ada deadline → jangan blokir).
    public static long getCrossDateKeluarDeadline(HistoryItem masuk) {
        Date masukTime = parseDate(masuk == null ? null : masuk.absen_time);
        String keluar = masuk == null ? null : masuk.keluar_start_time;
        if (masukTime == null || keluar == null || keluar.trim().isEmpty()) return -1;
        String[] parts = keluar.split(":");
        if (parts.length < 2) return -1;
        int h, m;
        try {
            h = Integer.parseInt(parts[0].trim());
            m = Integer.parseInt(parts[1].trim());
        } catch (NumberFormatException e) {
            return -1;
        }
        Calendar c = Calendar.getInstance();
        c.setTime(masukTime);
        c.add(Calendar.DAY_OF_MONTH, 1);
        c.set(Calendar.HOUR_OF_DAY, h);
        c.set(Calendar.MINUTE, m);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        return c.getTimeInMillis() + CROSS_DATE_KELUAR_GRACE_HOURS * 60L * 60L * 1000L;
    }

    // ── isCrossDateSesiActive ──
    public static boolean isCrossDateSesiActive(HistoryItem h) {
        if (h == null || h.is_cross_date != 1) return false;
        if (!"open".equals(h.sesi_status)) return false;
        long deadline = getCrossDateKeluarDeadline(h);
        return deadline < 0 || System.currentTimeMillis() <= deadline;
    }

    // Baris dihitung "hari ini" bila bertanggal hari ini ATAU masuk cross-date
    // yang sesinya masih open (mis. lembur SUBUH masuk 23:42 kemarin).
    public static boolean isTodayOrCrossActive(HistoryItem h) {
        if (h == null) return false;
        return isSameLocalDate(h.absen_time) || isCrossDateSesiActive(h);
    }

    // ── findOpenRegularMasuk: sesi cross-date open wajib-keluar, dalam window ──
    public static HistoryItem findOpenRegularMasuk(List<HistoryItem> rows) {
        List<HistoryItem> open = new ArrayList<>();
        for (HistoryItem h : rows) {
            if (h == null) continue;
            if (!"open".equals(h.sesi_status)) continue;
            if (!"masuk".equals(h.sesi_direction)) continue;
            if (h.is_lembur == 1) continue;
            if (h.is_cross_date != 1) continue;
            if (isRejectedAttendance(h)) continue;
            long deadline = getCrossDateKeluarDeadline(h);
            if (!(deadline < 0 || System.currentTimeMillis() <= deadline)) continue;
            open.add(h);
        }
        if (open.isEmpty()) return null;
        Collections.sort(open, new Comparator<HistoryItem>() {
            @Override
            public int compare(HistoryItem a, HistoryItem b) {
                long ta = timeOf(a), tb = timeOf(b);
                return Long.compare(tb, ta); // DESC
            }
        });
        return open.get(0);
    }

    private static long timeOf(HistoryItem h) {
        Date d = parseDate(h == null ? null : h.absen_time);
        return d == null ? 0 : d.getTime();
    }

    // ── buildTodayAttendanceStatus: status regular {masuk,keluar} ──
    public static class DirStatus {
        public HistoryItem masuk;
        public HistoryItem keluar;
    }

    public static DirStatus buildTodayAttendanceStatus(List<HistoryItem> rows) {
        DirStatus st = new DirStatus();
        for (HistoryItem h : rows) {
            if (h == null) continue;
            String dir = directionOf(h);
            if (dir.isEmpty()) continue;
            if (h.is_lembur == 1) continue;
            if (h.is_cross_date == 1 && "closed".equals(h.sesi_status)) continue; // shift kemarin
            if (!isSameLocalDate(h.absen_time) && !isCrossDateSesiActive(h)) continue;
            HistoryItem cur = "masuk".equals(dir) ? st.masuk : st.keluar;
            if (cur == null || timeOf(h) > timeOf(cur)) {
                if ("masuk".equals(dir)) st.masuk = h;
                else st.keluar = h;
            }
        }
        return st;
    }

    public static boolean hasCompletedRegular(DirStatus s) {
        return s.masuk != null && s.keluar != null
                && !isRejectedAttendance(s.masuk) && !isRejectedAttendance(s.keluar);
    }

    // ── regularInProgress: ada sesi regular open (mid-shift) ──
    public static boolean regularInProgress(List<HistoryItem> rows) {
        for (HistoryItem h : rows) {
            if (h == null) continue;
            if ("open".equals(h.sesi_status) && "masuk".equals(h.sesi_direction)
                    && h.is_lembur != 1 && !isRejectedAttendance(h)) {
                return true;
            }
        }
        return false;
    }

    // ── attendanceMode: null|"regular"|"lembur"|"mixed" ──
    public static String attendanceMode(List<HistoryItem> rows) {
        boolean hasLembur = false, hasRegular = false;
        for (HistoryItem h : rows) {
            if (h == null) continue;
            if (!isTodayOrCrossActive(h)) continue;
            if (isRejectedAttendance(h)) continue;
            if (h.is_cross_date == 1 && "closed".equals(h.sesi_status)) continue;
            if (h.is_lembur == 1) hasLembur = true;
            else hasRegular = true;
        }
        if (hasLembur && !hasRegular) return "lembur";
        if (hasRegular && !hasLembur) return "regular";
        if (hasRegular && hasLembur) return "mixed";
        return null;
    }

    // ── Sesi lembur hari ini (port todayLemburSesi web) ──
    public static class LemburSesi {
        public final List<HistoryItem> rows = new ArrayList<>();
        public boolean hasSesiData, hasOpen, hasClosed;
        public HistoryItem masukRow;
    }

    public static LemburSesi todayLemburSesi(List<HistoryItem> rows) {
        LemburSesi s = new LemburSesi();
        for (HistoryItem h : rows) {
            if (h == null) continue;
            if (h.is_lembur != 1) continue;
            if (isRejectedAttendance(h)) continue;
            // Penutup lembur cross-date (sesi closed) bertanggal hari ini = milik
            // shift lembur KEMARIN (masuk kemarin, keluar dini hari ini), bukan
            // lembur hari ini. Selaras guard regular (buildTodayAttendanceStatus /
            // attendanceMode) — else hasClosed salah true → lemburDirection kosong
            // → tipe lembur kosong → user tak bisa lembur baru hari ini.
            if (h.is_cross_date == 1 && "closed".equals(h.sesi_status)) continue;
            if (!isTodayOrCrossActive(h)) continue;
            s.rows.add(h);
            if (h.sesi_id != null) {
                s.hasSesiData = true;
                if ("open".equals(h.sesi_status)) s.hasOpen = true;
                if ("closed".equals(h.sesi_status)) s.hasClosed = true;
            }
            if (s.masukRow == null && "masuk".equals(directionOf(h))) s.masukRow = h;
        }
        return s;
    }

    // Lembur selesai. Prefer sesi ('closed'); fallback pra-sesi scan description.
    public static boolean lemburComplete(String mode, LemburSesi s) {
        if (!"lembur".equals(mode) && !"mixed".equals(mode)) return false;
        if (s.hasSesiData) return s.hasClosed;
        boolean masukDone = false, keluarDone = false;
        for (HistoryItem h : s.rows) {
            String d = directionOf(h);
            if ("masuk".equals(d)) masukDone = true;
            if ("keluar".equals(d)) keluarDone = true;
        }
        return masukDone && keluarDone;
    }

    // Mode lembur efektif: sesi lembur berjalan (otomatis), ATAU user menekan
    // "Mulai Lembur" dan tidak sedang mid-shift regular.
    public static boolean effectiveLemburMode(String mode, boolean complete,
                                              boolean manual, boolean regularInProgress) {
        return ("lembur".equals(mode) && !complete) || (manual && !regularInProgress);
    }

    // Arah attempt lembur berikutnya. Prefer sesi; fallback scan description.
    public static String lemburDirection(boolean effective, LemburSesi s) {
        if (!effective) return "";
        if (s.hasSesiData) {
            if (s.hasOpen) return "keluar";
            if (s.hasClosed) return "";
            return "masuk";
        }
        boolean masukDone = false, keluarDone = false;
        for (HistoryItem h : s.rows) {
            String d = directionOf(h);
            if ("masuk".equals(d)) masukDone = true;
            if ("keluar".equals(d)) keluarDone = true;
        }
        if (!masukDone) return "masuk";
        if (!keluarDone) return "keluar";
        return "";
    }

    // Tipe lembur untuk arah berjalan. Keluar dikunci ke NAMA tipe masuk (pola
    // web + pasangan BE tk.name = tm.name), bukan kategori (bisa NULL).
    public static List<AbsenItem> filterLemburTypes(List<AbsenItem> types, String dir, LemburSesi s) {
        List<AbsenItem> out = new ArrayList<>();
        if (dir == null || dir.isEmpty()) return out;
        String masukName = s.masukRow == null || s.masukRow.category_absen == null
                ? "" : s.masukRow.category_absen.trim();
        for (AbsenItem t : types) {
            if (!directionOf(t).equals(dir)) continue;
            if ("keluar".equals(dir) && !masukName.isEmpty()) {
                String tn = t.getName() == null ? "" : t.getName().trim();
                if (!tn.equals(masukName)) continue;
            }
            out.add(t);
        }
        return out;
    }

    // ── nextRegularDirection ──
    // openRegularMasuk != null → "keluar"; else masuk belum → "masuk";
    // keluar belum → "keluar"; else "".
    public static String nextRegularDirection(List<HistoryItem> rows) {
        DirStatus st = buildTodayAttendanceStatus(rows);
        Set<String> done = new HashSet<>();
        if (st.masuk != null && !isRejectedAttendance(st.masuk)) done.add("masuk");
        if (st.keluar != null && !isRejectedAttendance(st.keluar)) done.add("keluar");

        HistoryItem openMasuk = findOpenRegularMasuk(rows);
        if (openMasuk != null) return "keluar";
        if (!done.contains("masuk")) return "masuk";
        if (!done.contains("keluar")) return "keluar";
        return "";
    }

    // Kategori masuk regular (untuk lock keluar). Prefer cross-date open, fallback today.
    public static String masukRegularKategori(List<HistoryItem> rows) {
        HistoryItem openMasuk = findOpenRegularMasuk(rows);
        if (openMasuk != null && openMasuk.kategori_absen != null) {
            return openMasuk.kategori_absen.trim();
        }
        DirStatus st = buildTodayAttendanceStatus(rows);
        if (st.masuk != null && st.masuk.kategori_absen != null) {
            return st.masuk.kategori_absen.trim();
        }
        return "";
    }

    // ── time-category key (dedup) ──
    public static String timeCategoryKey(String kategori, String start, String end, String typeId) {
        String k = kategori == null ? "" : kategori.trim();
        if (!k.isEmpty()) return "kategori:" + k.toLowerCase(Locale.US);
        String s = start == null ? "" : start.trim();
        String e = end == null ? "" : end.trim();
        if (!s.isEmpty() || !e.isEmpty()) return "time:" + s + "-" + e;
        return "type:" + (typeId == null ? "" : typeId);
    }

    public static String timeCategoryKeyOf(HistoryItem h) {
        return timeCategoryKey(h.kategori_absen, null, null, h.absen_type_id);
    }

    public static String timeCategoryKeyOf(AbsenItem t) {
        return timeCategoryKey(t.getKategori_absen(), t.getStart_time(), t.getEnd_time(), t.getAbsen_id());
    }

    // ── hasTodayAttendanceForTimeCategory: dedup vs history ──
    public static boolean hasTodayForTimeCategory(List<HistoryItem> rows, AbsenItem type) {
        for (HistoryItem h : rows) {
            if (h == null) continue;
            if (!isSameLocalDate(h.absen_time) || isRejectedAttendance(h)) continue;
            if (h.absen_type_id != null && h.absen_type_id.equals(type.getAbsen_id())) return true;
            if (directionOf(h).equals(directionOf(type))
                    && timeCategoryKeyOf(h).equals(timeCategoryKeyOf(type))) {
                return true;
            }
        }
        return false;
    }

    // ── checkEarlyMasuk: blocked bila >60mnt sebelum start (wrap tengah malam) ──
    public static class EarlyCheck {
        public boolean blocked;
        public String openAt;
        public String startAt;
    }

    public static EarlyCheck checkEarlyMasuk(AbsenItem type) {
        EarlyCheck r = new EarlyCheck();
        if (!"masuk".equals(directionOf(type))) return r;
        String start = type.getStart_time();
        if (start == null || start.trim().isEmpty()) return r;
        String[] p = start.split(":");
        int sh, sm;
        try {
            sh = Integer.parseInt(p[0].trim());
            sm = Integer.parseInt(p[1].trim());
        } catch (Exception e) {
            return r;
        }
        Calendar now = Calendar.getInstance();
        int nowMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
        int startMin = sh * 60 + sm;
        int minutesUntilStart = startMin - nowMin;
        if (minutesUntilStart > 720) minutesUntilStart -= 1440;
        if (minutesUntilStart < -720) minutesUntilStart += 1440;

        int openMin = ((startMin - EARLY_MASUK_WINDOW_MINUTES) % 1440 + 1440) % 1440;
        r.openAt = String.format(Locale.US, "%02d:%02d", openMin / 60, openMin % 60);
        r.startAt = String.format(Locale.US, "%02d:%02d", sh, sm);
        r.blocked = minutesUntilStart > EARLY_MASUK_WINDOW_MINUTES;
        return r;
    }

    // ── Haversine (meter) ──
    public static double hitungJarak(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
