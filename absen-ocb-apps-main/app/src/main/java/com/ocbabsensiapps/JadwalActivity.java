package com.ocbabsensiapps;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.GridLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.Request;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

// Jadwal bulanan karyawan (self, sesi /absen). Port web JadwalKaryawan.jsx.
// Kalender grid 7 kolom; fetch GET /jadwal-harian/user/:userId?month=YYYY-MM.
public class JadwalActivity extends AppCompatActivity {

    private static final String[] HARI = {"Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"};
    private static final String[] BULAN = {
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"};

    private GridLayout grid;
    private LinearLayout rowHari;
    private TextView textMonthLabel, textUserName, textEmpty;
    private ProgressBar progress;

    private String token, userId;
    private int year, month; // month 1..12
    // tanggal(YYYY-MM-DD) -> data shift.
    private final Map<String, JSONObject> jadwalMap = new HashMap<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_jadwal);

        grid = findViewById(R.id.gridKalender);
        rowHari = findViewById(R.id.rowHari);
        textMonthLabel = findViewById(R.id.textMonthLabel);
        textUserName = findViewById(R.id.textUserName);
        textEmpty = findViewById(R.id.textEmpty);
        progress = findViewById(R.id.progressJadwal);

        ImageView back = findViewById(R.id.buttonBack);
        Button prev = findViewById(R.id.buttonPrevMonth);
        Button next = findViewById(R.id.buttonNextMonth);
        back.setOnClickListener(v -> finish());
        prev.setOnClickListener(v -> shiftMonth(-1));
        next.setOnClickListener(v -> shiftMonth(1));

        SharedPreferences sp = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        token = sp.getString("authToken", "");
        userId = sp.getString("userId", "");

        Calendar c = Calendar.getInstance();
        year = c.get(Calendar.YEAR);
        month = c.get(Calendar.MONTH) + 1;

        showUserName();
        buildHariHeader();
        fetchJadwal();
    }

    private void showUserName() {
        SharedPreferences sp = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String name = sp.getString("userName", "");
        if (name != null && !name.trim().isEmpty()) {
            textUserName.setText(name);
            textUserName.setVisibility(View.VISIBLE);
        }
    }

    private void buildHariHeader() {
        rowHari.removeAllViews();
        for (int i = 0; i < 7; i++) {
            TextView t = new TextView(this);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            t.setLayoutParams(lp);
            t.setGravity(Gravity.CENTER);
            t.setText(HARI[i]);
            t.setTextSize(11);
            t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
            t.setTextColor(i == 0 ? Color.parseColor("#E53935") : Color.parseColor("#78909C"));
            rowHari.addView(t);
        }
    }

    private void shiftMonth(int delta) {
        month += delta;
        if (month < 1) { month = 12; year--; }
        else if (month > 12) { month = 1; year++; }
        fetchJadwal();
    }

    private String monthParam() {
        return String.format(Locale.US, "%04d-%02d", year, month);
    }

    private void fetchJadwal() {
        textMonthLabel.setText(BULAN[month - 1] + " " + year);
        jadwalMap.clear();
        grid.removeAllViews();
        textEmpty.setVisibility(View.GONE);
        progress.setVisibility(View.VISIBLE);

        String url = Constant.API + "jadwal-harian/user/" + userId + "?month=" + monthParam();
        JsonObjectRequest req = new JsonObjectRequest(Request.Method.GET, url, null,
                response -> {
                    progress.setVisibility(View.GONE);
                    boolean usesJadwal = response.optBoolean("uses_jadwal_harian", true);
                    JSONArray arr = response.optJSONArray("jadwal");
                    if (arr != null) {
                        for (int i = 0; i < arr.length(); i++) {
                            JSONObject o = arr.optJSONObject(i);
                            if (o == null) continue;
                            String tgl = o.optString("tanggal", "");
                            if (!tgl.isEmpty()) jadwalMap.put(tgl, o);
                        }
                    }
                    if (!usesJadwal) {
                        showEmpty("Anda tidak menggunakan jadwal harian.");
                        return;
                    }
                    buildCalendar();
                },
                this::handleError) {
            @Override public Map<String, String> getHeaders() {
                Map<String, String> h = new HashMap<>();
                h.put("Authorization", "Bearer " + token);
                return h;
            }
        };
        Volley.newRequestQueue(this).add(req);
    }

    private void showEmpty(String msg) {
        grid.removeAllViews();
        textEmpty.setText(msg);
        textEmpty.setVisibility(View.VISIBLE);
    }

    private void buildCalendar() {
        grid.removeAllViews();

        Calendar c = Calendar.getInstance();
        c.set(year, month - 1, 1);
        int firstDayOffset = c.get(Calendar.DAY_OF_WEEK) - 1; // 0=Min
        int daysInMonth = c.getActualMaximum(Calendar.DAY_OF_MONTH);

        Calendar today = Calendar.getInstance();
        String todayStr = String.format(Locale.US, "%04d-%02d-%02d",
                today.get(Calendar.YEAR), today.get(Calendar.MONTH) + 1, today.get(Calendar.DAY_OF_MONTH));

        int totalCells = firstDayOffset + daysInMonth;
        int scheduled = 0;
        for (int idx = 0; idx < totalCells; idx++) {
            if (idx < firstDayOffset) {
                grid.addView(emptyCell());
                continue;
            }
            int day = idx - firstDayOffset + 1;
            String dateStr = String.format(Locale.US, "%04d-%02d-%02d", year, month, day);
            JSONObject j = jadwalMap.get(dateStr);
            if (j != null) scheduled++;
            grid.addView(dayCell(day, dateStr.equals(todayStr), j));
        }

        if (scheduled == 0) {
            showEmpty("Belum ada jadwal untuk " + BULAN[month - 1] + " " + year + ".");
        } else {
            textEmpty.setVisibility(View.GONE);
        }
    }

    // Warna badge per kategori shift (port KAT_COLOR web).
    private int[] katColor(String kategori) {
        String k = kategori == null ? "" : kategori.toLowerCase(Locale.US);
        if (k.contains("pagi")) return new int[]{Color.parseColor("#E8F5E9"), Color.parseColor("#2E7D32")};
        if (k.contains("sore")) return new int[]{Color.parseColor("#FFF3E0"), Color.parseColor("#E65100")};
        if (k.contains("malam") || k.contains("subuh"))
            return new int[]{Color.parseColor("#E3F2FD"), Color.parseColor("#1565C0")};
        return new int[]{Color.parseColor("#ECEFF1"), Color.parseColor("#455A64")};
    }

    private int cellWidth() {
        int screen = getResources().getDisplayMetrics().widthPixels;
        int pad = (int) (12 * getResources().getDisplayMetrics().density); // grid padding 6dp *2
        return (screen - pad) / 7;
    }

    private View emptyCell() {
        View v = new View(this);
        GridLayout.LayoutParams lp = new GridLayout.LayoutParams();
        lp.width = cellWidth();
        lp.height = (int) (62 * getResources().getDisplayMetrics().density);
        lp.setMargins(2, 2, 2, 2);
        v.setLayoutParams(lp);
        return v;
    }

    private String hhmm(String t) {
        if (t == null || t.length() < 5) return t == null ? "" : t;
        return t.substring(0, 5);
    }

    private View dayCell(int day, boolean isToday, JSONObject j) {
        LinearLayout cell = new LinearLayout(this);
        cell.setOrientation(LinearLayout.VERTICAL);
        GridLayout.LayoutParams lp = new GridLayout.LayoutParams();
        lp.width = cellWidth();
        lp.height = (int) (62 * getResources().getDisplayMetrics().density);
        lp.setMargins(2, 2, 2, 2);
        cell.setLayoutParams(lp);
        cell.setPadding(6, 6, 6, 6);

        int[] col = j != null ? katColor(j.optString("kategori_absen", "")) : null;
        int bg = j != null ? col[0] : Color.parseColor("#FAFAFA");
        cell.setBackgroundColor(bg);
        if (isToday) {
            android.graphics.drawable.GradientDrawable border = new android.graphics.drawable.GradientDrawable();
            border.setColor(bg);
            border.setStroke((int) (2 * getResources().getDisplayMetrics().density), Color.parseColor("#E74C3C"));
            border.setCornerRadius(8);
            cell.setBackground(border);
        }

        TextView num = new TextView(this);
        num.setText(String.valueOf(day));
        num.setTextSize(11);
        num.setTypeface(num.getTypeface(), android.graphics.Typeface.BOLD);
        num.setTextColor(isToday ? Color.parseColor("#E74C3C") : Color.parseColor("#607D8B"));
        cell.addView(num);

        if (j != null) {
            String kategori = j.optString("kategori_absen", "");
            String shiftName = j.optString("shift_name", "");
            TextView kat = new TextView(this);
            kat.setText(!kategori.isEmpty() ? kategori.toUpperCase(Locale.US) : shiftName);
            kat.setTextSize(8);
            kat.setTypeface(kat.getTypeface(), android.graphics.Typeface.BOLD);
            kat.setTextColor(col[1]);
            kat.setMaxLines(1);
            cell.addView(kat);

            String masuk = hhmm(j.optString("masuk_time", ""));
            String keluar = hhmm(j.optString("keluar_time", ""));
            if (!masuk.isEmpty() || !keluar.isEmpty()) {
                TextView jam = new TextView(this);
                jam.setText(masuk + "–" + keluar);
                jam.setTextSize(8);
                jam.setTextColor(col[1]);
                jam.setMaxLines(1);
                cell.addView(jam);
            }
        }
        return cell;
    }

    private void handleError(VolleyError error) {
        progress.setVisibility(View.GONE);
        if (error.networkResponse != null && error.networkResponse.statusCode == 401) {
            try {
                String body = new String(error.networkResponse.data, "utf-8");
                String message = new JSONObject(body).optString("message", "Sesi habis");
                SharedPreferences sp = getSharedPreferences("AppPrefs", MODE_PRIVATE);
                sp.edit().remove("authToken").apply();
                Intent i = new Intent(this, LoginActivity.class);
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(i);
                Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Log.e("Jadwal", "401 parse", e);
            }
        } else {
            showEmpty("Gagal memuat jadwal. Coba lagi.");
        }
    }
}
