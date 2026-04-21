package com.ocbabsensiapps;

import android.net.Uri;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.MediaController;
import android.widget.Toast;
import android.widget.VideoView;

import androidx.appcompat.app.AppCompatActivity;

import com.bumptech.glide.Glide;

public class TampilanMediaActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_tampilan_media); // Buat layout activity_tampilan_media.xml

        String mediaUrl = getIntent().getStringExtra("mediaUrl");
        String mediaType = getIntent().getStringExtra("mediaType");

        if (mediaUrl != null && mediaType != null) {
            if (mediaType.equalsIgnoreCase("image")) {
                tampilkanGambar(mediaUrl);
            } else if (mediaType.equalsIgnoreCase("video")) {
                tampilkanVideo(mediaUrl);
            } else {
                Toast.makeText(this, "Tipe media tidak dikenali.", Toast.LENGTH_SHORT).show();
                finish();
            }
        } else {
            Toast.makeText(this, "URL media tidak valid.", Toast.LENGTH_SHORT).show();
            finish();
        }
    }

    private void tampilkanGambar(String imageUrl) {
        ImageView imageView = findViewById(R.id.imageViewMedia); // Inisialisasi ImageView dari layout
        VideoView videoView = findViewById(R.id.videoViewMedia); // Inisialisasi VideoView dari layout
        videoView.setVisibility(VideoView.GONE); // Sembunyikan VideoView

        imageView.setVisibility(ImageView.VISIBLE); // Tampilkan ImageView
        Glide.with(this)
                .load(Constant.IMAGE + imageUrl)
                .into(imageView);
    }

    private void tampilkanVideo(String videoUrl) {
        ImageView imageView = findViewById(R.id.imageViewMedia); // Inisialisasi ImageView dari layout
        VideoView videoView = findViewById(R.id.videoViewMedia); // Inisialisasi VideoView dari layout
        imageView.setVisibility(ImageView.GONE); // Sembunyikan ImageView

        videoView.setVisibility(VideoView.VISIBLE); // Tampilkan VideoView
        videoView.setVideoURI(Uri.parse(Constant.IMAGE + videoUrl));
        MediaController mediaController = new MediaController(this);
        videoView.setMediaController(mediaController);
        mediaController.setAnchorView(videoView); // Penting untuk menempelkan controller ke VideoView
        videoView.start();
    }
}