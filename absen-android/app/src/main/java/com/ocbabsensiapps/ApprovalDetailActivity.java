package com.ocbabsensiapps;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.MediaController;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.VideoView;

import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.NetworkResponse;
import com.android.volley.Request;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.bumptech.glide.Glide;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class ApprovalDetailActivity extends AppCompatActivity {

    private TextView nameTextView, dateTextView, statusTextView, reasonTextView, retailTextView, descriptionTextView;
    private Button approveButton, rejectButton;
    private ProgressBar progressBar;
    private ImageView imageViewMediaApproval; // ImageView untuk gambar
    private VideoView videoViewMediaApproval; // VideoView untuk video

    private String nama_karyawan,
            formattedDate,
            description,
            status_approval,
            retail_name,
            reason,
            absenId,
            photoUrl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_approval_detail);

        nameTextView = findViewById(R.id.nameTextView);
        dateTextView = findViewById(R.id.dateTextView);
        statusTextView = findViewById(R.id.statusTextView);
        reasonTextView = findViewById(R.id.reasonTextView);
        retailTextView = findViewById(R.id.retailTextView);
        descriptionTextView = findViewById(R.id.descriptionTextView);
        approveButton = findViewById(R.id.approveButton);
        rejectButton = findViewById(R.id.rejectButton);
        progressBar = findViewById(R.id.progressBar);
        imageViewMediaApproval = findViewById(R.id.imageViewMediaApproval); // Inisialisasi ImageView
        videoViewMediaApproval = findViewById(R.id.videoViewMediaApproval); // Inisialisasi VideoView

        absenId = getIntent().getStringExtra("absen_id");
        nama_karyawan = getIntent().getStringExtra("nama_karyawan");
        formattedDate = getIntent().getStringExtra("formattedDate");
        description = getIntent().getStringExtra("description");
        status_approval = getIntent().getStringExtra("status_approval");
        retail_name = getIntent().getStringExtra("retail_name");
        reason = getIntent().getStringExtra("reason");
        photoUrl = getIntent().getStringExtra("photoUrl");

        nameTextView.setText(nama_karyawan);
        dateTextView.setText(formattedDate);
        statusTextView.setText(status_approval);
        reasonTextView.setText(reason);
        retailTextView.setText(retail_name);
        descriptionTextView.setText(description);

        approveButton.setOnClickListener(v -> updateStatus("approved"));
        rejectButton.setOnClickListener(v -> updateStatus("rejected"));

        showMedia(photoUrl); // Tampilkan media setelah data lain di set
    }


    private void updateStatus(String newStatus) {
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String token = sharedPreferences.getString("authToken", "");
        progressBar.setVisibility(View.VISIBLE);
        String apiUrl = "";
        if (newStatus.equals("approved")) {
            apiUrl = "absensi/approve-absensi/";
        } else {
            apiUrl = "absensi/reject-absensi/";
        }
        apiUrl = Constant.API + apiUrl + absenId;

        JSONObject payload = new JSONObject();
        try {
            payload.put("status", newStatus);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, apiUrl, null,
                response -> {
                    progressBar.setVisibility(View.GONE);
                    Log.d("Approval Response", response.toString()); // Log response
                    // Cek status
                    String message = response.optString("message");
                    String status = response.optString("status");
                    if ("success".equals(status)) {
                        // Pindah ke halaman utama
                        Intent intent = new Intent(ApprovalDetailActivity.this, StatusAbsenActivity.class);

                        intent.putExtra("infoStatus", "approval");

                        startActivity(intent);
                        finish();
                    } else {
                        // Tampilkan pesan gagal dari API
                        Toast.makeText(ApprovalDetailActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                },
                error -> {
                    progressBar.setVisibility(View.GONE);
                    NetworkResponse networkResponse = error.networkResponse;
                    if (networkResponse != null && networkResponse.data != null) {
                        String errorMessage = new String(networkResponse.data);
                        Log.e("Server Error", errorMessage);
                        Toast.makeText(this, "Server Error: " + errorMessage, Toast.LENGTH_LONG).show();
                    } else {
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

    @Override
    public void onBackPressed() {
        super.onBackPressed();
        Intent intent = new Intent(this, ApprovalActivity.class);
        startActivity(intent);
        finish();
    }

    // Fungsi untuk menampilkan media (gambar atau video)
    private void showMedia(String mediaUrl) {
        if (mediaUrl != null && !mediaUrl.isEmpty()) {
            if (isImageFile(mediaUrl)) {
                showImage(mediaUrl);
            } else if (isVideoFile(mediaUrl)) {
                showVideo(mediaUrl);
            } else {
                Toast.makeText(this, "Format file tidak didukung.", Toast.LENGTH_SHORT).show();
                hideMediaViews(); // Sembunyikan kedua view jika format tidak didukung
            }
        } else {
            Toast.makeText(this, "Tidak ada foto/video terlampir.", Toast.LENGTH_SHORT).show();
            hideMediaViews(); // Sembunyikan kedua view jika URL kosong
        }
    }

    // Fungsi untuk menentukan apakah URL adalah file gambar (berdasarkan ekstensi)
    private boolean isImageFile(String url) {
        String lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png") || lowerUrl.endsWith(".gif") || lowerUrl.endsWith(".bmp");
    }

    // Fungsi untuk menentukan apakah URL adalah file video (berdasarkan ekstensi)
    private boolean isVideoFile(String url) {
        String lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".avi") || lowerUrl.endsWith(".mov") || lowerUrl.endsWith(".mkv");
    }

    // Fungsi untuk menampilkan gambar
    private void showImage(String imageUrl) {
        imageViewMediaApproval.setVisibility(View.VISIBLE);
        videoViewMediaApproval.setVisibility(View.GONE);
        Glide.with(this)
                .load(Constant.IMAGE + imageUrl)
                .into(imageViewMediaApproval);
    }

    // Fungsi untuk menampilkan video
    private void showVideo(String videoUrl) {
        imageViewMediaApproval.setVisibility(View.GONE);
        videoViewMediaApproval.setVisibility(View.VISIBLE);
        videoViewMediaApproval.setVideoURI(Uri.parse(Constant.IMAGE + videoUrl));
        MediaController mediaController = new MediaController(this);
        videoViewMediaApproval.setMediaController(mediaController);
        mediaController.setAnchorView(videoViewMediaApproval);
        videoViewMediaApproval.start();
    }

    // Fungsi untuk menyembunyikan ImageView dan VideoView
    private void hideMediaViews() {
        imageViewMediaApproval.setVisibility(View.GONE);
        videoViewMediaApproval.setVisibility(View.GONE);
    }
}