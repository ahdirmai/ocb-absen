package com.ocbabsensiapps;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.animation.AlphaAnimation;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class StatusAbsenActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_status_absen);

        // Ambil tanggal dan waktu saat ini
        String currentDate = new SimpleDateFormat("dd MMMM yyyy", Locale.getDefault()).format(new Date());
        String currentTime = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());

        // Bind views
        ImageView statusIcon = findViewById(R.id.statusIcon);
        TextView statusMessage = findViewById(R.id.statusMessage);
        TextView dateText = findViewById(R.id.dateText);
        TextView timeText = findViewById(R.id.timeText);

        String infoStatus = getIntent().getStringExtra("infoStatus");
        // Set data
        if(infoStatus.equals("absen")){
            statusMessage.setText("Absen Berhasil Terkirim!");

        } else if (infoStatus.equals("approval")) {
            statusMessage.setText("Approval Berhasil Terkirim!");
        } else if (infoStatus.equals("validasi")) {
            statusMessage.setText("Validasi Berhasil Diupdate!");
        }else{
            statusMessage.setText("Perubahan Berhasil Terkirim!");
        }
        dateText.setText(currentDate);
        timeText.setText(currentTime + " WIB");

        // Animasi pada icon
        AlphaAnimation fadeIn = new AlphaAnimation(0.0f, 1.0f);
        fadeIn.setDuration(1000);
        fadeIn.setRepeatCount(AlphaAnimation.INFINITE);
        fadeIn.setRepeatMode(AlphaAnimation.REVERSE);
        statusIcon.startAnimation(fadeIn);

        // Kembali ke menu utama setelah 3 detik
        new Handler().postDelayed(() -> {
            if(infoStatus.equals("approval")){
                Intent intent = new Intent(StatusAbsenActivity.this, ApprovalActivity.class);
                startActivity(intent);
            }else{
                Intent intent = new Intent(StatusAbsenActivity.this, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            }
            finish();
        }, 3000);
    }
}
