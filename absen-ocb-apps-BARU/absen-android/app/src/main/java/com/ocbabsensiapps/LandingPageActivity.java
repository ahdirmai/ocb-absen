package com.ocbabsensiapps;


import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class LandingPageActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_landing_page);

        Button btnMasuk = findViewById(R.id.btnMasuk);
        Button btnRequestAkun = findViewById(R.id.btnRequestAkun);
        btnMasuk.setOnClickListener(v -> {
            // Pindah ke halaman login
            Intent intent = new Intent(LandingPageActivity.this, LoginActivity.class);
            finish();
            startActivity(intent);
        });

        btnRequestAkun.setOnClickListener(v -> {
            // Handle request akun (misalnya ke halaman pendaftaran)
            Toast.makeText(LandingPageActivity.this, "Silahkan hubungi admin/HR untuk request akun", Toast.LENGTH_SHORT).show();
        });
    }
}