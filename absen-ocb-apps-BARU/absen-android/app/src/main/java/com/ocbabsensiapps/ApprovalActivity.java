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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class ApprovalActivity extends AppCompatActivity {

    private RecyclerView approvalRecyclerView;
    private ProgressBar progressBar;
    private ApprovalAdapter approvalAdapter;
    private List<ApprovalItem> approvalList = new ArrayList<>();
    private List<ApprovalItem> allApprovalList = new ArrayList<>(); // List untuk menyimpan semua data approval
    private EditText searchEditText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_approval);

        approvalRecyclerView = findViewById(R.id.approvalRecyclerView);
        progressBar = findViewById(R.id.progressBar);
        searchEditText = findViewById(R.id.searchEditText); // Inisialisasi EditText search

        approvalAdapter = new ApprovalAdapter(this, approvalList, this::onItemClicked);

        approvalRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        approvalRecyclerView.setAdapter(approvalAdapter);

        fetchApprovalList();

        // TextWatcher untuk fitur pencarian
        searchEditText.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                filterApprovalList(charSequence.toString());
            }

            @Override
            public void afterTextChanged(Editable editable) {
            }
        });
    }

    private void fetchApprovalList() {
        progressBar.setVisibility(View.VISIBLE);
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String token = sharedPreferences.getString("authToken", "");
        String userId = sharedPreferences.getString("userId", "");
        String apiUrl = Constant.API + "absensi/approval/" +userId;

        JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(Request.Method.POST, apiUrl, null,
                response -> {
                    progressBar.setVisibility(View.GONE);
                    try {
                        Log.d("APIResponse", response.toString());
                        JSONArray absenArray = ApiResponseParser.getArray(response, "data");
                        allApprovalList.clear(); // Bersihkan list semua approval sebelum menambahkan data baru
                        approvalList.clear(); // Bersihkan list yang ditampilkan

                        for (int i = 0; i < absenArray.length(); i++) {
                            JSONObject absenObject = absenArray.getJSONObject(i);
                            String absensi_id = ApiResponseParser.optString(absenObject, "absensi_id", "absen_id", "id");
                            String nama_karyawan = ApiResponseParser.optString(absenObject, "nama_karyawan", "name", "username");
                            String absen_time = ApiResponseParser.optString(absenObject, "absen_time", "created_at");
                            String description = ApiResponseParser.optString(absenObject, "description", "category_absen", "status");
                            String status_approval = ApiResponseParser.optString(absenObject, "status_approval", "approval_status", "is_valid");
                            String retail_name = ApiResponseParser.optString(absenObject, "retail_name", "location_name", "retail");
                            String reason = ApiResponseParser.optString(absenObject, "reason", "notes");
                            String photoUrl = ApiResponseParser.optString(absenObject, "photo_url", "foto_url", "image");

                            String formattedDate = ApiResponseParser.formatDateTime(absen_time, "dd MMM yyyy HH:mm:ss");

                            // Tambahkan item approval ke list semua data dan list tampilan awal
                            ApprovalItem approvalItem = new ApprovalItem(
                                    absensi_id,
                                    nama_karyawan,
                                    formattedDate,
                                    description,
                                    status_approval,
                                    retail_name,
                                    reason,
                                    photoUrl
                            );
                            allApprovalList.add(approvalItem);
                            approvalList.add(approvalItem);
                        }

                        approvalAdapter.notifyDataSetChanged();
                    } catch (JSONException e) {
                        e.printStackTrace();
                        Toast.makeText(this, "Gagal memproses data!", Toast.LENGTH_SHORT).show();
                    }
                },
                error -> {
                    progressBar.setVisibility(View.GONE);
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

    private void filterApprovalList(String text) {
        approvalList.clear(); // Clear the displayed list
        if (text.isEmpty()) {
            approvalList.addAll(allApprovalList); // Jika input kosong, tampilkan semua data awal
        } else {
            String searchText = text.toLowerCase(Locale.getDefault());
            for (ApprovalItem approval : allApprovalList) {
                if (approval.getNama_karyawan() != null && approval.getNama_karyawan().toLowerCase(Locale.getDefault()).contains(searchText)) {
                    approvalList.add(approval); // Tambahkan approval yang nama karyawannya sesuai dengan teks pencarian
                }
            }
        }
        approvalAdapter.notifyDataSetChanged(); // Refresh adapter setelah filter
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
                Intent intent = new Intent(ApprovalActivity.this, LoginActivity.class);
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

    private void onItemClicked(ApprovalItem item) {
        Intent intent = new Intent(this, ApprovalDetailActivity.class);
        intent.putExtra("absen_id", item.getAbsensi_id());
        intent.putExtra("nama_karyawan", item.getNama_karyawan());
        intent.putExtra("formattedDate", item.getAbsen_time());
        intent.putExtra("description", item.getDescription());
        intent.putExtra("status_approval", item.getStatus_approval());
        intent.putExtra("retail_name", item.getRetail_name());
        intent.putExtra("reason", item.getReason());
        intent.putExtra("photoUrl", item.getPhotoUrll());
        startActivity(intent);
        finish();
    }
}
