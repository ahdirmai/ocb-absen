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
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AbsensiActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private AbsenAdapter absenAdapter;
    private List<AbsenItem> absenList = new ArrayList<>();
    private List<AbsenItem> allAbsenList = new ArrayList<>(); // Simpan semua data absen
    private Spinner spinnerKategoriAbsen;
    private ArrayAdapter<CharSequence> kategoriAdapter;
    private EditText searchBoxAbsen; // Tambahkan EditText searchBoxAbsen

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_absensi);

        recyclerView = findViewById(R.id.recyclerViewAbsensi);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        absenAdapter = new AbsenAdapter(this, absenList);
        recyclerView.setAdapter(absenAdapter);

        spinnerKategoriAbsen = findViewById(R.id.spinnerKategoriAbsen);
        // Buat ArrayAdapter menggunakan string array dan layout spinner default
        kategoriAdapter = new ArrayAdapter<>(this,
                R.layout.spinner_dropdown_item, // Layout custom untuk dropdown item
                getResources().getStringArray(R.array.kategori_absen_array));
        kategoriAdapter.setDropDownViewResource(R.layout.spinner_dropdown_item); // Set juga untuk dropdown view
        spinnerKategoriAbsen.setAdapter(kategoriAdapter);

        searchBoxAbsen = findViewById(R.id.searchBoxAbsen); // Inisialisasi searchBoxAbsen

        spinnerKategoriAbsen.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                String selectedKategori = parent.getItemAtPosition(position).toString();
                filterAbsenList(selectedKategori, searchBoxAbsen.getText().toString()); // Panggil filter dengan kategori dan teks search
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                // Tidak ada yang dipilih
            }
        });

        searchBoxAbsen.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                // Tidak perlu implementasi
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterAbsenList(spinnerKategoriAbsen.getSelectedItem().toString(), s.toString()); // Panggil filter saat teks berubah
            }

            @Override
            public void afterTextChanged(Editable s) {
                // Tidak perlu implementasi
            }
        });

        loadAbsenData();
    }

    private void loadAbsenData() {
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String token = sharedPreferences.getString("authToken", "");
        String userId = sharedPreferences.getString("userId", "");
        String url = Constant.API + "absen-management/shift-user/" + userId;

        JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(Request.Method.POST, url, null,
                response -> {
                    try {
                        Log.d("APIResponse", response.toString());
                        JSONArray absenArray = response.getJSONArray("data");
                        allAbsenList.clear(); // Bersihkan list semua data
                        absenList.clear(); // Bersihkan list yang ditampilkan

                        for (int i = 0; i < absenArray.length(); i++) {
                            JSONObject absenObject = absenArray.getJSONObject(i);
                            String absen_id = absenObject.getString("absen_id");
                            String name = absenObject.getString("name");
                            String description = absenObject.getString("description");
                            String retail_id = absenObject.getString("retail_id");
                            String latitude = absenObject.getString("latitude");
                            String longitude = absenObject.getString("longitude");
                            String radius = absenObject.getString("radius");
                            String start_time = absenObject.getString("start_time");
                            String end_time = absenObject.getString("end_time");
                            String retail_name = absenObject.getString("retail_name");
                            String is_absen_today = absenObject.getString("is_absen_today");
                            String kategori_absen = absenObject.getString("kategori_absen"); // Ambil kategori absen

                            // Tambahkan item absen ke list semua data
                            allAbsenList.add(new AbsenItem(
                                    absen_id,
                                    name,
                                    description,
                                    retail_id,
                                    latitude,
                                    longitude,
                                    radius,
                                    start_time,
                                    end_time,
                                    retail_name,
                                    is_absen_today,
                                    kategori_absen // Tambahkan kategori absen ke AbsenItem
                            ));
                        }

                        // Setelah data diload, filter berdasarkan kategori awal ("Semua") dan teks search awal (kosong)
                        filterAbsenList(spinnerKategoriAbsen.getSelectedItem().toString(), searchBoxAbsen.getText().toString());

                    } catch (JSONException e) {
                        e.printStackTrace();
                        Toast.makeText(this, "Gagal memproses data!", Toast.LENGTH_SHORT).show();
                    }
                },
                error -> {
                    handleError(error);
                    Log.e("APIError", error.toString());
                }) {
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<>();
                headers.put("Authorization", "Bearer " + token);
                headers.put("Content-Type", "application/json");
                return headers;
            }
        };

        Volley.newRequestQueue(this).add(jsonObjectRequest);
    }

    // Modifikasi fungsi filterAbsenList untuk menerima kategori dan searchText
    private void filterAbsenList(String kategori, String searchText) {
        absenList.clear(); // Bersihkan list yang akan ditampilkan
        String lowerSearchText = searchText.toLowerCase().trim(); // Normalize search text

        for (AbsenItem item : allAbsenList) {
            boolean kategoriMatch = true; // Default match kategori
            if (!kategori.equals("Semua")) {
                kategoriMatch = item.getKategori_absen().equalsIgnoreCase(kategori); // Cek kategori jika bukan "Semua"
            }

            boolean searchMatch = true; // Default match search
            if (!lowerSearchText.isEmpty()) {
                searchMatch = false; // Default tidak match jika ada searchText
                // Lakukan pencarian case-insensitive di beberapa field (sesuaikan field yang ingin dicari)
                if (item.getDescription().toLowerCase().contains(lowerSearchText) ||
                        item.getRetail_name().toLowerCase().contains(lowerSearchText) ||
                        item.getName().toLowerCase().contains(lowerSearchText)) {
                    searchMatch = true; // Match jika salah satu field mengandung searchText
                }
            }

            if (kategoriMatch && searchMatch) {
                absenList.add(item); // Tambahkan item jika lolos filter kategori DAN search
            }
        }
        absenAdapter.notifyDataSetChanged(); // Refresh adapter setelah filter
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
                Intent intent = new Intent(AbsensiActivity.this, LoginActivity.class);
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
}