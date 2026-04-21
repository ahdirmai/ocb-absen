package com.ocbabsensiapps;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.animation.Animation;
import android.view.animation.ScaleAnimation;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;

import com.android.volley.Request;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;

public class SplashScreenActivity extends AppCompatActivity {
    private ImageView logo, logoSecondary;
    private TextView appName, poweredBy;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash_screen);

        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String token = sharedPreferences.getString("authToken", null);
        logo = findViewById(R.id.logo);
//        loadDataFromApi();
        // Set visibility to VISIBLE before starting animation
        // Animasi untuk logo (scale in)
        ScaleAnimation scaleAnimation = new ScaleAnimation(
                0.8f, 1.0f, 0.8f, 1.0f,
                Animation.RELATIVE_TO_SELF, 0.5f,
                Animation.RELATIVE_TO_SELF, 0.5f);
        scaleAnimation.setDuration(1000);
        scaleAnimation.setFillAfter(true);
        logo.startAnimation(scaleAnimation);

        // Delay sebelum pindah ke MainActivity
        new Handler().postDelayed(() -> {
            checkForUpdate();
//            if(token != null){
//                Intent i = new Intent(SplashScreenActivity.this, MainActivity.class);
//                startActivity(i);
//                finish();
//            }else{
//                Intent i = new Intent(SplashScreenActivity.this, LandingPageActivity.class);
//                startActivity(i);
//                finish();
//            }
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        }, 3000); // Durasi splash screen selama 3 detik
    }
    private void checkForUpdate() {
        String apiUrl = Constant.API + "version";

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.GET, apiUrl, null,
                response -> {
                    String latestVersion = response.optString("latest_version", null);
                    int forceUpdate = response.optInt("force_update", 0);
                    String updateUrl = response.optString("update_url", "https://play.google.com/store/apps/details?id=" + getPackageName());
                    Log.i("latestVersion", latestVersion);
                    Log.i("forceUpdate", String.valueOf(forceUpdate));
                    if (isUpdateRequired(latestVersion)) {
                        showUpdateDialog(forceUpdate, updateUrl);
                    } else {
                        continueToNextActivity();
                    }
                },
                error -> {
                    Log.e("Update Check", "Gagal memeriksa pembaruan: " + error.getMessage());
                    continueToNextActivity(); // Lanjut jika gagal cek update
                });

        Volley.newRequestQueue(this).add(request);
    }

    private boolean isUpdateRequired(String latestVersion) {
        String versionName = getVersionName(this);
        Log.i("versionName", String.valueOf(versionName));
        return !versionName.equals(latestVersion);
    }
    private void continueToNextActivity() {
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String token = sharedPreferences.getString("authToken", null);

        Intent intent;
        if (token != null) {
            intent = new Intent(SplashScreenActivity.this, MainActivity.class);
        } else {
            intent = new Intent(SplashScreenActivity.this, LandingPageActivity.class);
        }

        startActivity(intent);
        finish();
    }
    private void showUpdateDialog(int isForceUpdate, String updateUrl) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Pembaruan Diperlukan");
        builder.setMessage("Versi terbaru tersedia. Harap perbarui aplikasi Anda untuk melanjutkan.");

        builder.setPositiveButton("Perbarui Sekarang", (dialog, which) -> {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(updateUrl));
            startActivity(intent);
            if (isForceUpdate == 1) {
                finish(); // Tutup aplikasi jika update wajib
            }
        });

        if (isForceUpdate == 0) {
            builder.setNegativeButton("Nanti", (dialog, which) -> continueToNextActivity());
        }

        builder.setCancelable(false);
        builder.show();
    }
    public static String getVersionName(Context context) {
        try {
            PackageInfo packageInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            return packageInfo.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
            return "Unknown";
        }
    }
}