package com.ocbabsensiapps;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.bumptech.glide.Glide;
import com.bumptech.glide.request.RequestOptions;

import org.json.JSONException;
import org.json.JSONObject;
import org.w3c.dom.Text;

import java.text.NumberFormat;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class ProfileActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        // Bind views
        fetchProfile();

    }
    private void fetchProfile() {
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String token = sharedPreferences.getString("authToken", "");
        String userId = sharedPreferences.getString("userId", "");
        String url = Constant.API + "users/profile/" + userId;

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, url, null,
                response -> {
                    Log.d("ProfileResponse", response.toString());
                    try {
                        JSONObject data = ApiResponseParser.getObjectOrFirstArrayItem(response, "data");
                        JSONObject dataFee = ApiResponseParser.getObjectOrFirstArrayItem(response, "fee");

                        if (data != null) {
                            String name = ApiResponseParser.optString(data, "name", "nama_karyawan", "username");
                            String role = ApiResponseParser.optString(data, "role", "category_user", "name_role");
                            String categoryUser = ApiResponseParser.optString(data, "category_user", "role", "name_role");
                            String upline = ApiResponseParser.optString(data, "upline", "nama_upline", "atasan");
                            String photoUrl = ApiResponseParser.optString(data, "photo_url", "foto_url", "image");
                            String retailName = ApiResponseParser.optString(data, "retail_name", "location_name", "retail");
                            String periodeFee = ApiResponseParser.optString(dataFee, "period", "periode");
                            String totalFee = ApiResponseParser.optString(dataFee, "total_gaji_akhir", "total_fee", "nominal");

                            TextView nameText = findViewById(R.id.nameText);
                            TextView jobText = findViewById(R.id.jobText);
                            TextView employeeIdText = findViewById(R.id.employeeIdText);
                            TextView locationShiftText = findViewById(R.id.locationShiftText);
                            TextView nameBigText = findViewById(R.id.nameBigText);
                            TextView jobBigText = findViewById(R.id.jobBigText);
                            TextView periodeFeeText = findViewById(R.id.periodeFeeText);
                            TextView totalFeeText = findViewById(R.id.totalFeeText);
                            ImageView profileImageView = findViewById(R.id.profileImage);
                            TextView versionAppText = findViewById(R.id.versionAppText);

                            nameText.setText("Nama: " + name);
                            jobText.setText("Jabatan: " + categoryUser);
                            employeeIdText.setText("Atasan: " + upline);
                            locationShiftText.setText("Lokasi Shift: " + retailName);
                            nameBigText.setText(name);
                            jobBigText.setText(role);
                            Glide.with(this)
                                    .load(ApiResponseParser.buildImageUrl(photoUrl))
                                    .override(128, 128)
                                    .apply(RequestOptions.circleCropTransform())
                                    .error(R.drawable.ic_warning)
                                    .into(profileImageView);

                            NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("id", "ID"));
                            double value = totalFee.isEmpty() ? 0 : Double.parseDouble(totalFee);
                            periodeFeeText.setText("Periode: " + periodeFee);
                            totalFeeText.setText("Gaji Bulan Ini: " + formatter.format(value));
                            String versionName = getVersionName(this);
                            versionAppText.setText("v" + versionName);
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
                headers.put("Authorization", "Bearer " + token); // Tambahkan token di header
                return headers;
            }
        };

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
                Intent intent = new Intent(ProfileActivity.this, LoginActivity.class);
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
