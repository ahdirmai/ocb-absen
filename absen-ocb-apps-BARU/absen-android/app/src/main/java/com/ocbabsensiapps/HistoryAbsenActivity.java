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

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
public class HistoryAbsenActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    RiwayatAbsenAdapter adapter;
    List<RiwayatAbsen> riwayatList = new ArrayList<>();
    TextView thisMonth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_history_absen);

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
        String userId = sharedPreferences.getString("userId", "");
        String url = Constant.API + "absensi/history-user/" + userId;

        // Membuat request ke API
        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, url, null,
                response -> {
                    Log.d("LoginResponse", response.toString()); // Log respons dari server

                    try {
                        riwayatList.clear();
                        JSONArray jsonArray = ApiResponseParser.getArray(response, "data");
                        for (int i = 0; i < jsonArray.length(); i++) {
                            JSONObject item = jsonArray.getJSONObject(i);

                            String id = ApiResponseParser.optString(item, "absensi_id", "absen_id", "id");
                            String status = ApiResponseParser.optString(item, "description", "category_absen", "status");
                            String jam = ApiResponseParser.optString(item, "absen_time", "created_at");
                            String category = ApiResponseParser.optString(item, "status", "status_absen");
                            String photoUrl = ApiResponseParser.optString(item, "photo_url", "foto_url", "image");
                            String nama = ApiResponseParser.optString(item, "nama_karyawan", "name", "username");
                            String statusApproval = ApiResponseParser.optString(item, "status_approval", "approval_status", "is_valid");

                            String formattedDate = ApiResponseParser.formatDateTime(jam, "dd MMM yyyy");
                            String formattedTime = ApiResponseParser.formatDateTime(jam, "HH:mm:ss");

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
                String message = data.optString("message", "Session telah habis");

                // Clear saved token
                SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
                SharedPreferences.Editor editor = sharedPreferences.edit();
                editor.remove("authToken");
                editor.apply();

                // Redirect to LoginActivity
                Intent intent = new Intent(HistoryAbsenActivity.this, LoginActivity.class);
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
//        Intent intent = new Intent(this, ApprovalDetailActivity.class);
//        intent.putExtra("absen_id", item.getId());
//        startActivity(intent);
    }
}
