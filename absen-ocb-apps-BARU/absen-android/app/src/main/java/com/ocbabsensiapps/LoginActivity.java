package com.ocbabsensiapps;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.text.InputType;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.Request;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import org.json.JSONException;
import org.json.JSONObject;

import android.content.pm.PackageManager;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatDelegate;

import android.content.SharedPreferences;

public class LoginActivity extends AppCompatActivity {
    TextInputLayout emailInput, passwordInput;
    Button loginButton;
    ProgressBar progressBar;
    private boolean isPasswordVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        emailInput = findViewById(R.id.emailInputLayout);
        passwordInput = findViewById(R.id.passwordInputLayout);
        loginButton = findViewById(R.id.loginButton);
        progressBar = findViewById(R.id.progressBar);

        loginButton.setOnClickListener(v -> {
            String email = emailInput.getEditText().getText().toString().trim();
            String password = passwordInput.getEditText().getText().toString().trim();

            // Validasi input email dan password
            if (email.isEmpty()) {
                emailInput.setError("Email harus diisi");
                return;
            } else {
                emailInput.setError(null);
            }

            if (password.isEmpty()) {
                passwordInput.setError("Password harus diisi");
                return;
            } else {
                passwordInput.setError(null);
            }

            login(email, password);
        });

        // Meminta izin untuk READ_PHONE_STATE jika menggunakan IMEI
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.READ_PHONE_STATE}, 1);
            }
        }
        TextInputEditText passwordInputText = findViewById(R.id.passwordInput);
        passwordInput.setEndIconOnClickListener(v -> {
            if (isPasswordVisible) {
                passwordInputText.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
                isPasswordVisible = false;
            } else {
                passwordInputText.setInputType(InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
                isPasswordVisible = true;
            }
            passwordInputText.setSelection(passwordInputText.getText().length()); // Memastikan kursor tetap di akhir teks
        });
    }

    // Method untuk login
    private void login(String email, String password) {
        progressBar.setVisibility(View.VISIBLE);

        String url = Constant.API + "users/login";  // URL API
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("username", email);
            jsonObject.put("password", password);

            String imeiOrAndroidID = getDeviceAndroidID();
            jsonObject.put("imei", imeiOrAndroidID);

            Log.d("LoginPayload", jsonObject.toString()); // Log payload
        } catch (JSONException e) {
            e.printStackTrace();
        }

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, url, jsonObject,
                response -> {
                    progressBar.setVisibility(View.GONE);
                    try {
                        Log.d("LoginResponse", response.toString()); // Log response

                        // Menampilkan pesan dari API
                        String message = response.optString("message", "Login berhasil!");

                        // Cek status
                        String status = response.optString("status");
                        if ("success".equals(status)) {
                            String token = response.optString("token");
                            String userId = response.optString("user_id");

                            // Simpan token di SharedPreferences
                            SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
                            SharedPreferences.Editor editor = sharedPreferences.edit();
                            editor.putString("authToken", token);
                            editor.putString("userId", userId);
                            editor.apply();

                            // Tampilkan pesan dari API
                            Toast.makeText(LoginActivity.this, message, Toast.LENGTH_LONG).show();

                            // Pindah ke halaman utama
                            startActivity(new Intent(LoginActivity.this, MainActivity.class));
                            finish();
                        } else {
                            // Tampilkan pesan gagal dari API
                            Toast.makeText(LoginActivity.this, message, Toast.LENGTH_LONG).show();
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        Toast.makeText(LoginActivity.this, "Terjadi kesalahan saat memproses data.", Toast.LENGTH_SHORT).show();
                    }
                },
                error -> {
                    progressBar.setVisibility(View.GONE);

                    // Handling error dari server
                    if (error.networkResponse != null && error.networkResponse.data != null) {
                        String errorBody = new String(error.networkResponse.data);
                        try {
                            JSONObject errorJson = new JSONObject(errorBody);
                            String message = errorJson.optString("message", "Terjadi kesalahan pada server.");
                            Toast.makeText(LoginActivity.this, message, Toast.LENGTH_LONG).show();
                        } catch (JSONException e) {
                            e.printStackTrace();
                            Toast.makeText(LoginActivity.this, "Terjadi kesalahan. Silakan coba lagi.", Toast.LENGTH_SHORT).show();
                        }
                    } else {
                        Toast.makeText(LoginActivity.this, "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.", Toast.LENGTH_SHORT).show();
                    }
                });

        // Menambahkan request ke request queue
        Volley.newRequestQueue(this).add(request);
    }

    // Method untuk mengambil Android ID
    private String getDeviceAndroidID() {
        return Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    }

    // Method untuk mengambil IMEI (untuk perangkat sebelum Android 10)
    private String getDeviceIMEI() {
        TelephonyManager telephonyManager = (TelephonyManager) getSystemService(TELEPHONY_SERVICE);
        if (checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            return telephonyManager.getDeviceId();  // Deprecated di Android 10+
        } else {
            return "Permission not granted";
        }
    }

    // Menangani permintaan izin di runtime (Android 6.0+)
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 1) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Permission Granted", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Permission Denied", Toast.LENGTH_SHORT).show();
            }
        }
    }
}
