package com.ocbabsensiapps;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.bumptech.glide.Glide;
import com.google.android.material.button.MaterialButton;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
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
import java.util.Objects;
import java.util.TimeZone;

import android.content.SharedPreferences;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends AppCompatActivity {
    RecyclerView recyclerView;
    RiwayatAbsenAdapter adapter;
    List<RiwayatAbsen> riwayatList = new ArrayList<>();
    String authToken, userId, id_category;
    TextView dayToday, textLihatSemua, textAbsenTepat, textAbsenTerlambat;
    MenuAdapter menuAdapter;
    List<MenuItem> menuList = new ArrayList<>();
    private boolean backPressedOnce = false;
    private Handler handler = new Handler();
    ImageView imageLogout;
    private FrameLayout modalLogoutContainer;
    private MaterialButton btnCancel, btnConfirmLogout;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        recyclerView = findViewById(R.id.recyclerViewRiwayatAbsen);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        String today = new SimpleDateFormat("MMMM-YYYY", Locale.getDefault()).format(new Date());
        textLihatSemua = findViewById(R.id.textLihatSemua);
        textAbsenTepat = findViewById(R.id.textAbsenTepat);
        textAbsenTerlambat = findViewById(R.id.textAbsenTerlambat);
        modalLogoutContainer = findViewById(R.id.modalLogoutContainer);
        btnCancel = findViewById(R.id.btnCancel);
        btnConfirmLogout = findViewById(R.id.btnConfirmLogout);
        imageLogout = findViewById(R.id.imageLogout);
        dayToday = findViewById(R.id.dayToday);
        dayToday.setText(today);
        adapter = new RiwayatAbsenAdapter(this, riwayatList, this::onItemClicked);
        recyclerView.setAdapter(adapter);
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        authToken =sharedPreferences.getString("authToken", null);
        userId =sharedPreferences.getString("userId", null);

        RecyclerView recyclerView = findViewById(R.id.recyclerView);

        GridLayoutManager gridLayoutManager = new GridLayoutManager(this, 4);
        recyclerView.setLayoutManager(gridLayoutManager);

        fetchProfile();
        fetchRiwayatAbsen();
        // Data menu
        menuList.add(new MenuItem("Absen", R.drawable.ic_clock));
        menuList.add(new MenuItem("Profile", R.drawable.ic_contacts));
        menuList.add(new MenuItem("Aprroval", R.drawable.ic_approval2));
        menuList.add(new MenuItem("Staff", R.drawable.ic_check));
        // Adapter dengan listener klik
         menuAdapter = new MenuAdapter(this, menuList, position -> {
            switch (position) {
                case 0:
                    startActivity(new Intent(MainActivity.this, AbsensiActivity.class));
                    break;
                case 1:
                    startActivity(new Intent(MainActivity.this, ProfileActivity.class));
                    break;
                case 2:
                    startActivity(new Intent(MainActivity.this, ApprovalActivity.class));
                    break;
                case 3:
                    startActivity(new Intent(MainActivity.this, ListKaryawanActivity.class));
                    break;
                default:
                    Toast.makeText(MainActivity.this, "Unknown menu clicked", Toast.LENGTH_SHORT).show();
            }
        });

        recyclerView.setAdapter(menuAdapter);
//        textLihatSemua.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                startActivity(new Intent(MainActivity.this, HistoryAbsenActivity.class));
//            }
//        });
        textLihatSemua.setOnClickListener(v -> startActivity(new Intent(MainActivity.this, HistoryAbsenActivity.class)));
        imageLogout.setOnClickListener(v -> showLogoutModal());
        btnCancel.setOnClickListener(v -> closeModal());
        btnConfirmLogout.setOnClickListener(v -> {
            closeModal();
            logOut();
        });
    }
    private void fetchProfile() {
        String url = Constant.API + "users/profile/" + userId;

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, url, null,
                response -> {
                    Log.d("ProfileResponse", response.toString());
                    try {
                        // Parsing data profil dari respons API
                        JSONArray dataArray = response.getJSONArray("data");

                        // Pastikan array tidak kosong
                        if (dataArray.length() > 0) {
                            JSONObject data = dataArray.getJSONObject(0); // Ambil elemen pertama

                            // Ambil detail user
                            String name = data.getString("name");
                            String role = data.getString("role");
                            id_category = data.getString("role_id");
                            String photoUrl = data.getString("photo_url");
                            if (photoUrl != null) {
                                photoUrl = photoUrl.trim().replaceAll("\\s+", ""); // Membersihkan URL
                                Log.d("CleanedPhotoURL", "Cleaned URL: " + photoUrl);
                            }
                            TextView nameTextView = findViewById(R.id.nameTextView);
                            TextView jobTitleTextView = findViewById(R.id.jobTitleTextView);
                            TextView greeting = findViewById(R.id.mainGreeting);
                            ImageView profileImageView = findViewById(R.id.profileImageView);

                            Log.d("id_category", id_category);

                            menuAdapter.notifyDataSetChanged();
                            greeting.setText("Halo, " + name );
                            nameTextView.setText(name);
                            jobTitleTextView.setText(role);
                            Glide.with(this)
                                    .load(Constant.IMAGE+ photoUrl)
                                    .override(48, 48)
                                    .error(R.drawable.ic_warning)
                                    .into(profileImageView);
                            // Update UI dengan data profile
//                            Toast.makeText(this, "Profile: " + name + " (" + role + ")", Toast.LENGTH_SHORT).show();
                        }

                        // Update UI (Header)

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                },
                error -> {
                    handleError(error);
                }) {
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<>();
                headers.put("Authorization", "Bearer " + authToken); // Tambahkan token di header
                return headers;
            }
        };

        Volley.newRequestQueue(this).add(request);
    }

    private void fetchRiwayatAbsen() {
        String url = Constant.API + "absensi/history-user/" + userId;

        // Membuat request ke API
        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, url, null,
                response -> {
                    Log.d("LoginResponse", response.toString()); // Log respons dari server

                    try {
                        String ontime = response.getString("total_ontime");
                        String late = response.getString("total_late");

                        textAbsenTepat.setText(ontime);
                        textAbsenTerlambat.setText(late);
                        // Konfigurasi format tanggal dan waktu
//                        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
//                        isoFormat.setTimeZone(TimeZone.getDefault());
//
//                        SimpleDateFormat wibFormat = new SimpleDateFormat("HH:mm:ss", Locale.getDefault());
//                        wibFormat.setTimeZone(TimeZone.getDefault());
//
//                        SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMM yyyy", Locale.getDefault());
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
                            String statusApproval = item.getString("status_approval");

                            String formattedDate = "";
                            String formattedTime = "";

                            // Parsing tanggal dan waktu dari format ISO 8601
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
//                    handleError(error);
                }) {
            @Override
            public Map<String, String> getHeaders() {
                // Menambahkan header Authorization
                Map<String, String> headers = new HashMap<>();
                headers.put("Authorization", "Bearer " + authToken);
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
                Intent intent = new Intent(MainActivity.this, LoginActivity.class);
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
    private void logOut() {
        String url = Constant.API + "users/logout";

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, url, null,
                response -> {
                    Log.d("ProfileResponse", response.toString());
                    String message = response.optString("message", "Login berhasil!");

                    // Cek status
                    String status = response.optString("status");
                    if ("success".equals(status)) {
                        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
                        SharedPreferences.Editor editor = sharedPreferences.edit();
                        editor.remove("authToken");
                        editor.apply();

                        // Redirect to LoginActivity
                        Intent intent = new Intent(MainActivity.this, LoginActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
                    } else {
                        // Tampilkan pesan gagal dari API
                        Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show();
                    }

                },
                error -> {
                    handleError(error);
                }) {
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<>();
                headers.put("Authorization", "Bearer " + authToken); // Tambahkan token di header
                return headers;
            }
        };

        Volley.newRequestQueue(this).add(request);
    }
    @Override
    public void onBackPressed() {
        if (backPressedOnce) {
            super.onBackPressed(); // Keluar dari aplikasi
            return;
        }

        this.backPressedOnce = true;
        Toast.makeText(this, "Tekan kembali sekali lagi untuk keluar", Toast.LENGTH_SHORT).show();

        // Reset status backPressedOnce setelah 2 detik
        handler.postDelayed(() -> backPressedOnce = false, 2000);
    }
    public void showLogoutModal() {
        modalLogoutContainer.setVisibility(View.VISIBLE);
    }

    // Fungsi untuk menutup modal
    private void closeModal() {
        modalLogoutContainer.setVisibility(View.GONE);
    }
    private void onItemClicked(RiwayatAbsen item) {
//        Intent intent = new Intent(this, ApprovalDetailActivity.class);
//        intent.putExtra("absen_id", item.getId());
//        startActivity(intent);
    }
}
