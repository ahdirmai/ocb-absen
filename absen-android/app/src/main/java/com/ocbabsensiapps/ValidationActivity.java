package com.ocbabsensiapps;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.NetworkResponse;
import com.android.volley.Request;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.bumptech.glide.Glide;
import com.bumptech.glide.request.RequestOptions;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class ValidationActivity extends AppCompatActivity {

    private TextView nameTextView, dateTextView, statusTextView, categoryTextView, jamTextView;
    private Button approveButton, rejectButton;
    private ProgressBar progressBar;
    private ImageView absenImage;

    private String nama_karyawan,
            formattedDate,
            category,
            status,
            jam,
            absenId,
    photo;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_validation);

        nameTextView = findViewById(R.id.nameTextView);
        dateTextView = findViewById(R.id.dateTextView);
        statusTextView = findViewById(R.id.statusTextView);
        categoryTextView = findViewById(R.id.categoryTextView);
        jamTextView = findViewById(R.id.jamTextView);
        approveButton = findViewById(R.id.approveButton);
        rejectButton = findViewById(R.id.rejectButton);
        progressBar = findViewById(R.id.progressBar);
        absenImage = findViewById(R.id.absenImage);

        absenId = getIntent().getStringExtra("absen_id");
        nama_karyawan = getIntent().getStringExtra("nama");
        formattedDate = getIntent().getStringExtra("tanggal");
        category = getIntent().getStringExtra("kategori");
        status = getIntent().getStringExtra("status");
        photo = getIntent().getStringExtra("photo");
        jam = getIntent().getStringExtra("jam");

        nameTextView.setText(nama_karyawan);
        dateTextView.setText(formattedDate);
        statusTextView.setText(status);
        categoryTextView.setText(category);
        jamTextView.setText(jam);
        Glide.with(this)
                .load(Constant.IMAGE+ photo)
                .error(R.drawable.ic_warning)
                .into(absenImage);

        approveButton.setOnClickListener(v -> updateStatus("valid"));
        rejectButton.setOnClickListener(v -> updateStatus("invalid"));
    }


    private void updateStatus(String newStatus) {
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String token = sharedPreferences.getString("authToken", "");
        progressBar.setVisibility(View.VISIBLE);

        String apiUrl = Constant.API + "absensi/validasi/" + absenId;
        String isValid = newStatus.equals("valid") ? "1" : "0";

        JSONObject payload = new JSONObject();
        try {
            payload.put("is_valid", isValid);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, apiUrl, payload,
                response -> {
                    progressBar.setVisibility(View.GONE);
                    Log.d("Approval Response", response.toString()); // Log response

                    // Cek status respons
                    String message = response.optString("message");
                    String status = response.optString("status");

                    if ("success".equals(status)) {
                        // Pindah ke halaman utama
                        Intent intent = new Intent(this, StatusAbsenActivity.class);
                        intent.putExtra("infoStatus", "validasi");
                        startActivity(intent);
                        finish();
                    } else {
                        // Tampilkan pesan error dari respons API
                        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
                    }
                },
                error -> {
                    progressBar.setVisibility(View.GONE);

                    // Tangani error respons server
                    NetworkResponse networkResponse = error.networkResponse;
                    if (networkResponse != null && networkResponse.data != null) {
                        try {
                            String errorMessage = new String(networkResponse.data);
                            JSONObject errorObj = new JSONObject(errorMessage);
                            String message = errorObj.optString("message", "Unknown error");
                            Toast.makeText(this, "Error: " + message, Toast.LENGTH_LONG).show();
                        } catch (JSONException e) {
                            e.printStackTrace();
                            Toast.makeText(this, "Error parsing server response", Toast.LENGTH_SHORT).show();
                        }
                    } else {
                        // Tangani error jaringan
                        Toast.makeText(this, "Network Error", Toast.LENGTH_SHORT).show();
                    }
                }) {
            @Override
            public Map<String, String> getHeaders() {
                Map<String, String> headers = new HashMap<>();
                headers.put("Authorization", "Bearer " + token);
                headers.put("Content-Type", "application/json");
                return headers;
            }
        };

        Volley.newRequestQueue(this).add(request);
    }


}
