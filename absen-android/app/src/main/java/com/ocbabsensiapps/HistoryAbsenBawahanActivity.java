package com.ocbabsensiapps;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.android.volley.Request;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

public class HistoryAbsenBawahanActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    RiwayatAbsenAdapter adapter;
    List<RiwayatAbsen> riwayatList = new ArrayList<>();
    String karyawan_id;
    TextView thisMonth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_history_absen);

        karyawan_id = getIntent().getStringExtra("karyawan_id");
        recyclerView = findViewById(R.id.recyclerViewHistoryAbsen);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        String monthYear = new SimpleDateFormat("MMMM-YYYY", Locale.getDefault()).format(new Date());
        thisMonth = findViewById(R.id.thisMonth);
        thisMonth.setText(monthYear);
        adapter = new RiwayatAbsenAdapter(this, riwayatList, this::onItemClicked);
        recyclerView.setAdapter(adapter);
        fetchRiwayatAbsen();
    }
    private void fetchRiwayatAbsen() {
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String authToken = sharedPreferences.getString("authToken", "");
        String url = Constant.API + "absensi/history-user/" + karyawan_id;

        JSONObject payload = new JSONObject();
        // Membuat request ke API
        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, url, null,
                response -> {
                    Log.d("LoginResponse", response.toString()); // Log respons dari server

                    try {
//                        int ontime = response.getInt("ontime");
//                        int late = response.getInt("late");
//
//                        ontimeTextView.setText(String.valueOf(ontime));
//                        lateTextView.setText(String.valueOf(late));
                        // Konfigurasi format tanggal dan waktu
                        DateTimeFormatter isoFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSX")
                                .withZone(ZoneId.of("UTC"));

                        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");
                        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");

                        ZoneId deviceZone = ZoneId.systemDefault();

                        // Mendapatkan data array dari respons
                        JSONArray jsonArray = response.getJSONArray("data");
                        for (int i = 0; i < jsonArray.length(); i++) {
                            JSONObject item = jsonArray.getJSONObject(i);

                            // Ambil informasi dari setiap item
                            String id = item.getString("absensi_id");
                            String status = item.getString("description");
                            String jam = item.getString("absen_time");
                            String category = item.getString("status");
                            String photoUrl = item.getString("photo_url");
                            String nama = item.getString("nama_karyawan");
                            String statusApproval = item.getString("is_valid");

                            String formattedDate = "";
                            String formattedTime = "";

                            ZonedDateTime dateTime = ZonedDateTime.parse(jam, isoFormatter);

                            // Konversi ke zona waktu perangkat
                            formattedTime = dateTime.withZoneSameInstant(deviceZone).format(timeFormatter);
                            formattedDate = dateTime.withZoneSameInstant(deviceZone).format(dateFormatter);

                            // Menambahkan item ke daftar riwayat
                            riwayatList.add(new RiwayatAbsen(id, status, formattedDate, formattedTime, category, photoUrl, nama, statusApproval));
                        }

                        // Beri tahu adapter bahwa data telah berubah
                        adapter.notifyDataSetChanged();

                    } catch (JSONException e) {
                        Log.e("JSONError", "Kesalahan parsing JSON: " + e.getMessage());
                        e.printStackTrace();
                    }
                },
                error -> {
                    // Tangani error dari request
                    handleError(error);
                }) {
            @Override
            public Map<String, String> getHeaders() {
                // Menambahkan header Authorization
                Map<String, String> headers = new HashMap<>();
                headers.put("Authorization", "Bearer " + authToken);
                headers.put("Content-Type", "application/json");
                return headers;
            }
        };

        // Menambahkan request ke antrean Volley
        Volley.newRequestQueue(this).add(request);
    }

    private void handleError(VolleyError error) {
        if (error.networkResponse != null && error.networkResponse.statusCode == 401) {
            try {
                // Parsing response error JSON
                String responseBody = new String(error.networkResponse.data, "utf-8");
                JSONObject data = new JSONObject(responseBody);
                String message = data.getString("message");

                // Clear saved token
                SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
                SharedPreferences.Editor editor = sharedPreferences.edit();
                editor.remove("authToken");
                editor.apply();

                // Redirect to LoginActivity
                Intent intent = new Intent(this, LoginActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);

                // Show toast
                Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            // Handle other errors
            Toast.makeText(this, "Error: " + error.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void onItemClicked(RiwayatAbsen item) {
        Intent intent = new Intent(this, ValidationActivity.class);
        intent.putExtra("absen_id", item.getId());
        intent.putExtra("nama", item.getNama());
        intent.putExtra("tanggal", item.getTanggal());
        intent.putExtra("status", item.getStatus());
        intent.putExtra("jam", item.getJam());
        intent.putExtra("kategori", item.getCategory());
        intent.putExtra("photo", item.getPhotoUrl());
        startActivity(intent);
    }
}
