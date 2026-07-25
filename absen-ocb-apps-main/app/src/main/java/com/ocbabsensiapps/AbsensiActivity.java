package com.ocbabsensiapps;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.google.android.material.button.MaterialButton;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Layar attempt absen — sekarang SESSION-AWARE (arah masuk/keluar dari sesi),
// cross-date (SUBUH masuk kemarin → keluar hari ini), + mode LEMBUR (gantikan
// toko lain). Port logika web AbsenKaryawan.jsx. Home & History tak disentuh.
public class AbsensiActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private AbsenAdapter absenAdapter;
    private final List<AbsenItem> absenList = new ArrayList<>();       // ditampilkan
    private Spinner spinnerKategoriAbsen;
    private EditText searchBoxAbsen;
    private TextView textInfoArah;
    private MaterialButton buttonMulaiLembur, buttonBatalLembur;
    private Spinner spinnerLemburRetail;

    // Data mentah dari BE.
    private List<HistoryItem> history = new ArrayList<>();
    private final List<AbsenItem> rawShiftTypes = new ArrayList<>();
    private final List<AbsenItem> rawLemburTypes = new ArrayList<>();
    private final List<RetailOption> lemburRetails = new ArrayList<>();
    private boolean usesJadwalHarian = false;

    // Hasil arah-aware (regular) — tipe yang boleh di-attempt sekarang.
    private final List<AbsenItem> directionFiltered = new ArrayList<>();

    // Mode lembur.
    private boolean lemburMode = false;
    private RetailOption selectedLemburRetail = null;

    private String token, userId;

    // Retail OC option (untuk spinner lembur).
    static class RetailOption {
        String retail_id, name, latitude, longitude, radius;
        RetailOption(String id, String n, String lat, String lng, String r) {
            retail_id = id; name = n; latitude = lat; longitude = lng; radius = r;
        }
        @Override public String toString() { return name; }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_absensi);

        recyclerView = findViewById(R.id.recyclerViewAbsensi);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        absenAdapter = new AbsenAdapter(this, absenList);
        recyclerView.setAdapter(absenAdapter);

        spinnerKategoriAbsen = findViewById(R.id.spinnerKategoriAbsen);
        ArrayAdapter<CharSequence> kategoriAdapter = new ArrayAdapter<>(this,
                R.layout.spinner_dropdown_item,
                getResources().getStringArray(R.array.kategori_absen_array));
        kategoriAdapter.setDropDownViewResource(R.layout.spinner_dropdown_item);
        spinnerKategoriAbsen.setAdapter(kategoriAdapter);

        searchBoxAbsen = findViewById(R.id.searchBoxAbsen);
        textInfoArah = findViewById(R.id.textInfoArah);
        buttonMulaiLembur = findViewById(R.id.buttonMulaiLembur);
        buttonBatalLembur = findViewById(R.id.buttonBatalLembur);
        spinnerLemburRetail = findViewById(R.id.spinnerLemburRetail);

        spinnerKategoriAbsen.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> p, View v, int pos, long id) { applyDisplayFilter(); }
            @Override public void onNothingSelected(AdapterView<?> p) { }
        });
        searchBoxAbsen.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int a, int b, int c) { }
            @Override public void onTextChanged(CharSequence s, int a, int b, int c) { applyDisplayFilter(); }
            @Override public void afterTextChanged(Editable s) { }
        });

        buttonMulaiLembur.setOnClickListener(v -> enterLemburMode());
        buttonBatalLembur.setOnClickListener(v -> exitLemburMode());

        spinnerLemburRetail.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> p, View v, int pos, long id) {
                if (pos >= 0 && pos < lemburRetails.size()) selectedLemburRetail = lemburRetails.get(pos);
            }
            @Override public void onNothingSelected(AdapterView<?> p) { }
        });

        SharedPreferences sp = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        token = sp.getString("authToken", "");
        userId = sp.getString("userId", "");

        loadAll();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Refresh saat balik dari AbsenActivity (arah bisa berubah setelah absen).
        loadAll();
    }

    private RequestQueue queue() { return Volley.newRequestQueue(this); }

    private Map<String, String> authHeaders() {
        Map<String, String> h = new HashMap<>();
        h.put("Authorization", "Bearer " + token);
        h.put("Content-Type", "application/json");
        return h;
    }

    // Rangkaian fetch: history → shift-types → lembur-types + retail. Setelah
    // semua tiba, hitung arah + tampilkan.
    private void loadAll() {
        fetchHistory();
    }

    private void fetchHistory() {
        String url = Constant.API + "absensi/history-user/" + userId;
        JsonObjectRequest req = new JsonObjectRequest(Request.Method.POST, url, new JSONObject(),
                response -> {
                    history = new ArrayList<>();
                    try {
                        JSONArray arr = response.optJSONArray("data");
                        if (arr != null) {
                            for (int i = 0; i < arr.length(); i++) {
                                history.add(HistoryItem.fromJson(arr.getJSONObject(i)));
                            }
                        }
                    } catch (JSONException e) {
                        Log.e("Absensi", "history parse", e);
                    }
                    fetchShiftTypes();
                },
                error -> { handleError(error); fetchShiftTypes(); }) {
            @Override public Map<String, String> getHeaders() { return authHeaders(); }
        };
        queue().add(req);
    }

    private void fetchShiftTypes() {
        String url = Constant.API + "absen-management/shift-user/" + userId;
        JsonObjectRequest req = new JsonObjectRequest(Request.Method.POST, url, null,
                response -> {
                    rawShiftTypes.clear();
                    usesJadwalHarian = response.optBoolean("uses_jadwal_harian", false);
                    try {
                        JSONArray arr = response.optJSONArray("data");
                        if (arr != null) {
                            for (int i = 0; i < arr.length(); i++) {
                                rawShiftTypes.add(parseType(arr.getJSONObject(i), 0));
                            }
                        }
                    } catch (JSONException e) {
                        Log.e("Absensi", "shift parse", e);
                    }
                    fetchLemburTypes();
                },
                error -> { handleError(error); fetchLemburTypes(); }) {
            @Override public Map<String, String> getHeaders() { return authHeaders(); }
        };
        queue().add(req);
    }

    private void fetchLemburTypes() {
        String url = Constant.API + "absen-management/lembur-types/" + userId;
        JsonObjectRequest req = new JsonObjectRequest(Request.Method.GET, url, null,
                response -> {
                    rawLemburTypes.clear();
                    try {
                        JSONArray arr = response.optJSONArray("data");
                        if (arr != null) {
                            for (int i = 0; i < arr.length(); i++) {
                                rawLemburTypes.add(parseType(arr.getJSONObject(i), 1));
                            }
                        }
                    } catch (JSONException e) {
                        Log.e("Absensi", "lembur parse", e);
                    }
                    fetchRetails();
                },
                error -> { fetchRetails(); }) {
            @Override public Map<String, String> getHeaders() { return authHeaders(); }
        };
        queue().add(req);
    }

    private void fetchRetails() {
        String url = Constant.API + "retail";
        JsonObjectRequest req = new JsonObjectRequest(Request.Method.GET, url, null,
                response -> {
                    lemburRetails.clear();
                    try {
                        JSONArray arr = response.optJSONArray("data");
                        Pattern oc = Pattern.compile("^OC\\s*0*(\\d{1,2})$", Pattern.CASE_INSENSITIVE);
                        List<RetailOption> tmp = new ArrayList<>();
                        if (arr != null) {
                            for (int i = 0; i < arr.length(); i++) {
                                JSONObject o = arr.getJSONObject(i);
                                String name = o.optString("name", "");
                                Matcher m = oc.matcher(name.trim());
                                if (!m.matches()) continue;
                                int n = Integer.parseInt(m.group(1));
                                if (n < 1 || n > 40) continue;
                                tmp.add(new RetailOption(
                                        o.optString("retail_id", ""),
                                        name,
                                        o.optString("latitude", ""),
                                        o.optString("longitude", ""),
                                        o.optString("radius", "")));
                            }
                        }
                        Collections.sort(tmp, new Comparator<RetailOption>() {
                            @Override public int compare(RetailOption a, RetailOption b) {
                                return Integer.compare(ocNum(a.name), ocNum(b.name));
                            }
                        });
                        lemburRetails.addAll(tmp);
                    } catch (Exception e) {
                        Log.e("Absensi", "retail parse", e);
                    }
                    recompute();
                },
                error -> { recompute(); }) {
            @Override public Map<String, String> getHeaders() { return authHeaders(); }
        };
        queue().add(req);
    }

    private static int ocNum(String name) {
        Matcher m = Pattern.compile("^OC\\s*0*(\\d{1,2})$", Pattern.CASE_INSENSITIVE).matcher(name.trim());
        return m.matches() ? Integer.parseInt(m.group(1)) : 999;
    }

    private AbsenItem parseType(JSONObject o, int isLembur) {
        AbsenItem it = new AbsenItem(
                o.optString("absen_id", ""),
                o.optString("name", ""),
                o.optString("description", ""),
                o.optString("retail_id", ""),
                o.optString("latitude", ""),
                o.optString("longitude", ""),
                o.optString("radius", ""),
                o.optString("start_time", ""),
                o.optString("end_time", ""),
                o.optString("retail_name", ""),
                o.optString("is_absen_today", "0"),
                o.optString("kategori_absen", ""));
        it.setIs_cross_date(o.optInt("is_cross_date", 0));
        it.setKeluar_start_time(o.isNull("keluar_start_time") ? null : o.optString("keluar_start_time", null));
        it.setIs_lembur(isLembur);
        return it;
    }

    // ── Inti: hitung arah regular + filter tipe (port web fetchAbsenTypes) ──
    private void recompute() {
        directionFiltered.clear();

        AbsenLogic.DirStatus todayStatus = AbsenLogic.buildTodayAttendanceStatus(history);
        boolean hasCompletedRegular = AbsenLogic.hasCompletedRegular(todayStatus);
        String nextRegularDirection = AbsenLogic.nextRegularDirection(history);
        String masukKategori = AbsenLogic.masukRegularKategori(history);

        for (AbsenItem type : rawShiftTypes) {
            String dir = AbsenLogic.directionOf(type);
            if (dir.isEmpty()) continue;
            if (AbsenLogic.hasTodayForTimeCategory(history, type)) continue;
            // Regular: hanya arah berikutnya. (Bila regular komplit, tak ada
            // tipe regular berikutnya — user lanjut ke lembur.)
            String expected = hasCompletedRegular ? "" : nextRegularDirection;
            if (!dir.equals(expected)) continue;
            // Keluar terkunci ke kategori masuk.
            if (!hasCompletedRegular && dir.equals("keluar") && !masukKategori.isEmpty()) {
                String tk = type.getKategori_absen() == null ? "" : type.getKategori_absen().trim();
                if (!tk.equalsIgnoreCase(masukKategori)) continue;
            }
            directionFiltered.add(type);
        }

        updateLemburUi(hasCompletedRegular);
        applyDisplayFilter();
    }

    private void updateLemburUi(boolean hasCompletedRegular) {
        boolean regularInProgress = AbsenLogic.regularInProgress(history);
        String mode = AbsenLogic.attendanceMode(history);
        boolean hasLemburTypes = !rawLemburTypes.isEmpty();

        boolean canStart = hasLemburTypes && !lemburMode
                && (usesJadwalHarian ? !regularInProgress : hasCompletedRegular)
                && !"lembur".equals(mode);

        if (lemburMode) {
            buttonMulaiLembur.setVisibility(View.GONE);
            buttonBatalLembur.setVisibility(View.VISIBLE);
            setupLemburRetailSpinner();
        } else {
            buttonBatalLembur.setVisibility(View.GONE);
            spinnerLemburRetail.setVisibility(View.GONE);
            buttonMulaiLembur.setVisibility(canStart ? View.VISIBLE : View.GONE);
        }
    }

    private void setupLemburRetailSpinner() {
        List<String> names = new ArrayList<>();
        for (RetailOption r : lemburRetails) names.add(r.name);
        ArrayAdapter<String> ad = new ArrayAdapter<>(this, R.layout.spinner_dropdown_item, names);
        ad.setDropDownViewResource(R.layout.spinner_dropdown_item);
        spinnerLemburRetail.setAdapter(ad);
        spinnerLemburRetail.setVisibility(View.VISIBLE);
        if (!lemburRetails.isEmpty() && selectedLemburRetail == null) {
            selectedLemburRetail = lemburRetails.get(0);
        }
    }

    private void enterLemburMode() {
        if (lemburRetails.isEmpty()) {
            Toast.makeText(this, "Belum ada OC tersedia untuk lembur.", Toast.LENGTH_SHORT).show();
            return;
        }
        lemburMode = true;
        recompute();
    }

    private void exitLemburMode() {
        lemburMode = false;
        selectedLemburRetail = null;
        recompute();
    }

    // Lembur: arah berikutnya (masuk→keluar) berdasar sesi lembur di history.
    private String lemburNextDirection() {
        boolean masukDone = false, keluarDone = false;
        boolean hasOpen = false, hasClosed = false, hasSesi = false;
        for (HistoryItem h : history) {
            if (h.is_lembur != 1) continue;
            if (!AbsenLogic.isSameLocalDate(h.absen_time)) continue;
            if (AbsenLogic.isRejectedAttendance(h)) continue;
            if (h.sesi_id != null) {
                hasSesi = true;
                if ("open".equals(h.sesi_status)) hasOpen = true;
                if ("closed".equals(h.sesi_status)) hasClosed = true;
            }
            String d = AbsenLogic.directionOf(h);
            if ("masuk".equals(d)) masukDone = true;
            if ("keluar".equals(d)) keluarDone = true;
        }
        if (hasSesi) {
            if (hasOpen) return "keluar";
            if (hasClosed) return "";
            return "masuk";
        }
        if (!masukDone) return "masuk";
        if (!keluarDone) return "keluar";
        return "";
    }

    // Anchor kategori lembur masuk (untuk lock keluar).
    private String lemburMasukKategori() {
        for (HistoryItem h : history) {
            if (h.is_lembur == 1 && "masuk".equals(AbsenLogic.directionOf(h))
                    && AbsenLogic.isSameLocalDate(h.absen_time) && !AbsenLogic.isRejectedAttendance(h)) {
                return h.kategori_absen == null ? "" : h.kategori_absen.trim();
            }
        }
        return "";
    }

    // Terapkan spinner kategori + search di atas hasil arah-aware / lembur.
    private void applyDisplayFilter() {
        absenList.clear();

        List<AbsenItem> base = new ArrayList<>();
        String info;
        if (lemburMode) {
            String dir = lemburNextDirection();
            String masukKat = lemburMasukKategori();
            for (AbsenItem t : rawLemburTypes) {
                if (!AbsenLogic.directionOf(t).equals(dir)) continue;
                if (dir.equals("keluar") && !masukKat.isEmpty()) {
                    // Lembur keluar: cocokkan nama dgn masuk (pola web).
                    // fallback kategori bila nama tak tersedia.
                    String tk = t.getKategori_absen() == null ? "" : t.getKategori_absen().trim();
                    if (!tk.equalsIgnoreCase(masukKat)) continue;
                }
                base.add(t);
            }
            info = dir.isEmpty()
                    ? "Lembur hari ini sudah lengkap."
                    : ("Mode Lembur — silakan absen " + (dir.equals("keluar") ? "keluar" : "masuk")
                       + (selectedLemburRetail != null ? " di " + selectedLemburRetail.name : ""));
        } else {
            base.addAll(directionFiltered);
            String next = AbsenLogic.nextRegularDirection(history);
            if (base.isEmpty()) {
                info = "Tidak ada absen yang bisa dilakukan saat ini.";
            } else if ("keluar".equals(next)) {
                info = "Silakan absen keluar.";
            } else if ("masuk".equals(next)) {
                info = "Silakan absen masuk.";
            } else {
                info = "";
            }
        }

        // Filter kategori spinner + search (di atas base).
        String kategori = spinnerKategoriAbsen.getSelectedItem() != null
                ? spinnerKategoriAbsen.getSelectedItem().toString() : "Semua";
        String search = searchBoxAbsen.getText().toString().toLowerCase(Locale.US).trim();

        for (AbsenItem it : base) {
            boolean kMatch = kategori.equals("Semua")
                    || (it.getKategori_absen() != null && it.getKategori_absen().equalsIgnoreCase(kategori));
            boolean sMatch = search.isEmpty()
                    || safe(it.getDescription()).contains(search)
                    || safe(it.getRetail_name()).contains(search)
                    || safe(it.getName()).contains(search);
            if (kMatch && sMatch) absenList.add(it);
        }
        absenAdapter.setLemburContext(lemburMode, selectedLemburRetail);
        absenAdapter.notifyDataSetChanged();

        if (info.isEmpty()) {
            textInfoArah.setVisibility(View.GONE);
        } else {
            textInfoArah.setText(info);
            textInfoArah.setVisibility(View.VISIBLE);
        }
    }

    private static String safe(String s) { return s == null ? "" : s.toLowerCase(Locale.US); }

    private void handleError(VolleyError error) {
        if (error.networkResponse != null && error.networkResponse.statusCode == 401) {
            try {
                String body = new String(error.networkResponse.data, "utf-8");
                String message = new JSONObject(body).optString("message", "Sesi habis");
                SharedPreferences sp = getSharedPreferences("AppPrefs", MODE_PRIVATE);
                sp.edit().remove("authToken").apply();
                Intent i = new Intent(AbsensiActivity.this, LoginActivity.class);
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(i);
                Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            Toast.makeText(this, "Gagal memuat data absen.", Toast.LENGTH_SHORT).show();
        }
    }
}
