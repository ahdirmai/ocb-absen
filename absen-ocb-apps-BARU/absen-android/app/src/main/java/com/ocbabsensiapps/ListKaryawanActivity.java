package com.ocbabsensiapps;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.android.volley.Request;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class ListKaryawanActivity extends AppCompatActivity {

    private ProgressBar progressBar;
    private RecyclerView recyclerView;
    private TextView tvEmptyMessage;
    private KaryawanAdapter adapter;
    private final List<Karyawan> karyawanList = new ArrayList<>();
    private final List<Karyawan> allKaryawanList = new ArrayList<>(); // List untuk menyimpan semua data karyawan
    private EditText searchEditText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_list_karyawan);

        progressBar = findViewById(R.id.progressBar);
        recyclerView = findViewById(R.id.recyclerViewKaryawan);
        tvEmptyMessage = findViewById(R.id.tvEmptyMessage);
        searchEditText = findViewById(R.id.searchEditText); // Inisialisasi EditText search

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new KaryawanAdapter(this, karyawanList, this::onItemClicked);
        recyclerView.setAdapter(adapter);

        fetchKaryawanList();

        // TextWatcher untuk fitur pencarian
        searchEditText.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                filterKaryawan(charSequence.toString());
            }

            @Override
            public void afterTextChanged(Editable editable) {
            }
        });
    }

    private void fetchKaryawanList() {
        progressBar.setVisibility(View.VISIBLE);
        recyclerView.setVisibility(View.GONE);
        tvEmptyMessage.setVisibility(View.GONE);

        // Ambil Bearer Token
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String authToken = sharedPreferences.getString("authToken", null);
        String userId = sharedPreferences.getString("userId", "");

        if (authToken == null) {
            Toast.makeText(this, "Session telah habis, silakan login kembali", Toast.LENGTH_SHORT).show();
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        String url = Constant.API + "users/under-upline/" + userId;
        JsonObjectRequest request = new JsonObjectRequest(Request.Method.GET, url, null,
                response -> {
                    progressBar.setVisibility(View.GONE);
                    try {
                        Log.d("under-upline", response.toString());
                        String status = response.optString("status");
                        if (status.equalsIgnoreCase("success")) {
                            JSONArray dataArray = ApiResponseParser.getArray(response, "data");
                            if (dataArray.length() > 0) {
                                allKaryawanList.clear(); // Bersihkan list semua karyawan sebelum menambahkan data baru
                                karyawanList.clear(); // Bersihkan list yang ditampilkan
                                for (int i = 0; i < dataArray.length(); i++) {
                                    JSONObject obj = dataArray.getJSONObject(i);

                                    // Ambil data karyawan dari respons
                                    String id = ApiResponseParser.optString(obj, "user_id", "id_user", "id");
                                    String name = ApiResponseParser.optString(obj, "name", "nama_karyawan", "username");
                                    String jabatan = ApiResponseParser.optString(obj, "category_user", "role", "name_role");
                                    String fotoUrl = ApiResponseParser.optString(obj, "photo_url", "foto_url", "image");
                                    // Tambahkan ke list semua karyawan dan list yang ditampilkan awal
                                    Karyawan karyawan = new Karyawan(id, name, jabatan, fotoUrl);
                                    allKaryawanList.add(karyawan);
                                    karyawanList.add(karyawan);
                                }
                                recyclerView.setVisibility(View.VISIBLE);
                                adapter.notifyDataSetChanged();
                            } else {
                                tvEmptyMessage.setVisibility(View.VISIBLE);
                            }
                        } else {
                            Toast.makeText(this, "Gagal memuat data karyawan", Toast.LENGTH_SHORT).show();
                            tvEmptyMessage.setVisibility(View.VISIBLE);
                        }
                    } catch (JSONException e) {
                        e.printStackTrace();
                        Toast.makeText(this, "Terjadi kesalahan saat memuat data", Toast.LENGTH_SHORT).show();
                    }
                },
                error -> {
                    progressBar.setVisibility(View.GONE);
                    Log.e("API_ERROR", error.toString());

                    if (error.networkResponse != null && error.networkResponse.statusCode == 401) {
                        try {
                            String responseBody = new String(error.networkResponse.data, "UTF-8");
                            JSONObject errorObject = new JSONObject(responseBody);
                            String message = errorObject.optString("message", "Session telah habis");

                            // Hapus token dan kembali ke login
                            SharedPreferences.Editor editor = sharedPreferences.edit();
                            editor.remove("authToken");
                            editor.apply();
                            Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
                            startActivity(new Intent(this, LoginActivity.class));
                            finish();
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    } else {
                        Toast.makeText(this, "Gagal memuat data", Toast.LENGTH_SHORT).show();
                    }
                }) {
            @Override
            public java.util.Map<String, String> getHeaders() {
                java.util.Map<String, String> headers = new java.util.HashMap<>();
                headers.put("Authorization", "Bearer " + authToken);
                return headers;
            }
        };

        Volley.newRequestQueue(this).add(request);
    }

    private void filterKaryawan(String text) {
        karyawanList.clear(); // Clear the displayed list
        if (text.isEmpty()) {
            karyawanList.addAll(allKaryawanList); // Jika input kosong, tampilkan semua data awal
        } else {
            String searchText = text.toLowerCase(Locale.getDefault());
            for (Karyawan karyawan : allKaryawanList) {
                if (karyawan.getName().toLowerCase(Locale.getDefault()).contains(searchText)) {
                    karyawanList.add(karyawan); // Tambahkan karyawan yang namanya sesuai dengan teks pencarian
                }
            }
        }
        adapter.notifyDataSetChanged(); // Refresh adapter setelah filter
    }


    private void onItemClicked(Karyawan item) {
        Intent intent = new Intent(this, HistoryAbsenBawahanActivity.class);
        intent.putExtra("karyawan_id", item.getId());
        startActivity(intent);
    }
}
