package com.ocbabsensiapps;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.location.Location;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.VideoView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.android.volley.VolleyError;
import com.android.volley.toolbox.Volley;
import com.coremedia.iso.IsoFile;
import com.coremedia.iso.boxes.Container;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.CircleOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.material.snackbar.Snackbar;
import com.googlecode.mp4parser.FileDataSourceImpl;
import com.googlecode.mp4parser.authoring.Movie;
import com.googlecode.mp4parser.authoring.Track;
import com.googlecode.mp4parser.authoring.builder.DefaultMp4Builder;
import com.googlecode.mp4parser.authoring.container.mp4.MovieCreator;
import com.googlecode.mp4parser.authoring.tracks.AppendTrack;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import com.coremedia.iso.boxes.MovieBox;

public class AbsenActivity extends AppCompatActivity {
    private static final String TAG = AbsenActivity.class.getSimpleName(); // Tambahkan TAG untuk Log

    private static final int REQUEST_CODE_TAKE_PICTURE = 1;
    private static final int REQUEST_CODE_TAKE_VIDEO = 2;
    private static final int REQUEST_CODE_LOCATION = 100;
    private static final int REQUEST_CODE_CAMERA = 101;
    private static final int IMAGE_RESIZE_MAX_DIMENSION = 480; // Lebih kecil lagi
    private static final int IMAGE_COMPRESSION_QUALITY = 60;  // Kualitas kompresi lebih rendah
    private static final int MAP_ZOOM_LEVEL = 18;
    private static final int LOCATION_UPDATE_INTERVAL = 10000;
    private static final int LOCATION_FASTEST_INTERVAL = 5000;

    private GoogleMap mMap;
    private String evidenceUrl = "", absen_id, description, retail_id, targetLat, targetLng, radius, isNeedApprove = "0", reason, retail_name;
    private TextView textViewLocationStatus, textViewUploadStatus, textViewAbsenTitle, textViewRetailName, textViewLoadingMessage;
    private ImageView imagePreview;
    private VideoView videoPreview;
    private double userLat, userLng;
    private double targetLatDouble, targetLngDouble, radiusDouble;
    File photoFile;
    private FrameLayout progressOverlay;
    private EditText editTextCatatan;
    private CardView buttonTakePicture, buttonTakeVideo;
    private Button buttonSubmitAbsen;
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private Marker userMarker;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_absen);

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        initializeUI();
        getDataFromIntent();
        setupMapFragment();
        setupButtonListeners();

        checkPermissionsAndStartLocationUpdates();
    }

    private void initializeUI() {
        textViewLocationStatus = findViewById(R.id.textViewLocationStatus);
        textViewUploadStatus = findViewById(R.id.textViewUploadStatus);
        textViewAbsenTitle = findViewById(R.id.textViewTitle);
        progressOverlay = findViewById(R.id.progressOverlay);
        editTextCatatan = findViewById(R.id.editTextCatatan);
        textViewRetailName = findViewById(R.id.textViewRetailName);
        imagePreview = findViewById(R.id.imagePreview);
        videoPreview = findViewById(R.id.videoPreview);
        textViewLoadingMessage = findViewById(R.id.textViewLoadingMessage);
        buttonTakePicture = findViewById(R.id.cardTakePicture);
        buttonTakeVideo = findViewById(R.id.cardTakeVideo);
        buttonSubmitAbsen = findViewById(R.id.buttonSubmitAbsen);
    }

    private void getDataFromIntent() {
        Intent intent = getIntent();
        if (intent != null) {
            absen_id = intent.getStringExtra("absen_id");
            description = intent.getStringExtra("description");
            retail_id = getIntent().getStringExtra("retail_id");
            targetLat = intent.getStringExtra("latitude");
            targetLng = getIntent().getStringExtra("longitude");
            radius = getIntent().getStringExtra("radius");
            retail_name = getIntent().getStringExtra("retail_name");
            textViewAbsenTitle.setText(description);
            textViewRetailName.setText(retail_name);
            try {
                targetLatDouble = Double.parseDouble(targetLat);
                targetLngDouble = Double.parseDouble(targetLng);
                radiusDouble = Double.parseDouble(radius);
            } catch (NumberFormatException e) {
                Toast.makeText(this, "Invalid location data", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void setupMapFragment() {
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.mapFragment);
        if (mapFragment != null) {
            mapFragment.getMapAsync(googleMap -> {
                mMap = googleMap;
                initializeMap();
            });
        }
    }

    private void setupButtonListeners() {
        buttonTakePicture.setOnClickListener(v -> checkPermissionsAndTakePicture(1));
        buttonTakeVideo.setOnClickListener(v -> checkPermissionsAndTakePicture(2));
        buttonSubmitAbsen.setOnClickListener(v -> submitAbsen());
    }


    protected void initializeMap() {
        if (mMap == null) return;

        LatLng targetLocation = new LatLng(targetLatDouble, targetLngDouble);

        initializeMapCircle(targetLocation);
        // Marker pengguna akan ditambahkan dan diupdate di updateLocationUI
    }

    private void initializeMapCircle(LatLng targetLocation) {
        if (mMap == null) return;

        // Add radius circle
        mMap.addCircle(new CircleOptions()
                .center(targetLocation)
                .radius(radiusDouble)
                .strokeColor(Color.BLUE)
                .fillColor(0x220000FF)
                .strokeWidth(2f));
    }


    private void checkPermissionsAndTakePicture(Integer pos) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                        != PackageManager.PERMISSION_GRANTED) {
            requestPermissions();
        } else {
            if (pos == 1) {
                takePicture();
            } else {
                takeVideo();
            }
        }
    }

    private void requestPermissions() {
        ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.CAMERA},
                REQUEST_CODE_LOCATION);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_CODE_LOCATION || requestCode == REQUEST_CODE_CAMERA) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                checkPermissionsAndStartLocationUpdates();
            } else {
                Toast.makeText(this, "Izin diperlukan untuk menggunakan fitur ini", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);

        if (storageDir != null && !storageDir.mkdirs() && !storageDir.isDirectory()) { // Pengecekan direktori
            Log.e(TAG, "Directory not created or not a directory: " + storageDir.getAbsolutePath());
            throw new IOException("Failed to create directory: " + storageDir.getAbsolutePath()); // Lempar IOException
        }
        if (storageDir == null) { // Pengecekan storageDir null
            Log.e(TAG, "External files directory is null for type: " + Environment.DIRECTORY_PICTURES);
            throw new IOException("External files directory is null"); // Lempar IOException
        }


        File image = File.createTempFile(
                imageFileName,
                ".jpg",
                storageDir
        );
        evidenceUrl = image.getAbsolutePath();
        return image;
    }

    private File createVideoFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String videoFileName = "VIDEO_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_MOVIES);

        if (storageDir != null && !storageDir.mkdirs() && !storageDir.isDirectory()) { // Pengecekan direktori
            Log.e(TAG, "Directory not created or not a directory: " + storageDir.getAbsolutePath());
            throw new IOException("Failed to create directory: " + storageDir.getAbsolutePath()); // Lempar IOException
        }
        if (storageDir == null) { // Pengecekan storageDir null
            Log.e(TAG, "External files directory is null for type: " + Environment.DIRECTORY_MOVIES);
            throw new IOException("External files directory is null"); // Lempar IOException
        }


        File video = File.createTempFile(
                videoFileName,
                ".mp4",
                storageDir
        );
        evidenceUrl = video.getAbsolutePath();
        return video;
    }

    private void takePicture() {
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
            File photoFile = null;
            try {
                photoFile = createImageFile();
            } catch (IOException ex) {
                Log.e(TAG, "Error creating image file", ex); // Menggunakan TAG untuk Log
                showToast("Error saat membuat file foto."); // Menampilkan toast error user-friendly
            }

            if (photoFile != null) {
                Uri photoURI = FileProvider.getUriForFile(this,
                        "com.ocbabsensiapps.fileprovider",
                        photoFile);
                takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                startActivityForResult(takePictureIntent, REQUEST_CODE_TAKE_PICTURE);
            }
        } else {
            showToast("Tidak ada aplikasi kamera yang ditemukan.");
        }
    }

    private void takeVideo() {
        Intent takeVideoIntent = new Intent(MediaStore.ACTION_VIDEO_CAPTURE);
        if (takeVideoIntent.resolveActivity(getPackageManager()) != null) {
            File videoFile = null;
            try {
                videoFile = createVideoFile();
            } catch (IOException ex) {
                Log.e(TAG, "Error creating video file", ex); // Menggunakan TAG untuk Log
                showToast("Error saat membuat file video."); // Menampilkan toast error user-friendly
            }

            if (videoFile != null) {
                Uri videoURI = FileProvider.getUriForFile(this,
                        "com.ocbabsensiapps.fileprovider",
                        videoFile);
                takeVideoIntent.putExtra(MediaStore.EXTRA_OUTPUT, videoURI);
                startActivityForResult(takeVideoIntent, REQUEST_CODE_TAKE_VIDEO);
            }
        } else {
            showToast("Tidak ada aplikasi video yang ditemukan.");
        }
    }

    private Bitmap resizeImage(File photoFile, int maxWidth, int maxHeight) {
        try {
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(photoFile.getAbsolutePath(), options);

            int photoWidth = options.outWidth;
            int photoHeight = options.outHeight;
            int scaleFactor = Math.min(photoWidth / maxWidth, photoHeight / maxHeight);

            options.inJustDecodeBounds = false;
            options.inSampleSize = scaleFactor;
            options.inPurgeable = true;

            return BitmapFactory.decodeFile(photoFile.getAbsolutePath(), options);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private void saveResizedImage(Bitmap bitmap, File targetFile) {
        try (FileOutputStream out = new FileOutputStream(targetFile)) {
            bitmap.compress(Bitmap.CompressFormat.JPEG, IMAGE_COMPRESSION_QUALITY, out);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode == RESULT_OK) {
            if (requestCode == REQUEST_CODE_TAKE_PICTURE) {
                if (evidenceUrl != null) {
                    photoFile = new File(evidenceUrl);
                    if (photoFile.exists()) {
                        Bitmap resizedBitmap = resizeImage(photoFile, IMAGE_RESIZE_MAX_DIMENSION, IMAGE_RESIZE_MAX_DIMENSION);
                        if (resizedBitmap != null) {
                            Bitmap rotatedBitmap = BitmapUtils.rotateBitmapBasedOnExif(resizedBitmap, photoFile.getAbsolutePath());
                            imagePreview.setVisibility(View.VISIBLE);
                            videoPreview.setVisibility(View.GONE);
                            textViewUploadStatus.setVisibility(View.GONE);
                            imagePreview.setImageBitmap(rotatedBitmap);

                            Snackbar.make(findViewById(android.R.id.content), "Foto berhasil diambil", Snackbar.LENGTH_SHORT).show();
                        } else {
                            Toast.makeText(this, "Gagal resize foto.", Toast.LENGTH_SHORT).show();
                        }
                    } else {
                        Toast.makeText(this, "Gagal menemukan file foto.", Toast.LENGTH_SHORT).show();
                        Log.e(TAG, "Evidence file not found after taking picture, path: " + evidenceUrl); // Logging path file
                    }

                } else {
                    Toast.makeText(this, "Gagal mendapatkan foto.", Toast.LENGTH_SHORT).show();
                }
            } else if (requestCode == REQUEST_CODE_TAKE_VIDEO) {
                if (evidenceUrl != null) {
                    photoFile = new File(evidenceUrl);
                    if (photoFile.exists()) {
                        File compressedVideoFile = null;
                        try {
                            compressedVideoFile = compressVideo(photoFile); // Kompres video di sini
                        } catch (IOException e) {
                            Log.e(TAG, "Video compression failed", e);
                            Toast.makeText(this, "Gagal mengkompres video.", Toast.LENGTH_SHORT).show();
                            return; // Hentikan proses jika kompresi gagal
                        }

                        if (compressedVideoFile != null && compressedVideoFile.exists()) {
                            photoFile = compressedVideoFile; // Gunakan video yang dikompres untuk upload
                            videoPreview.setVisibility(View.VISIBLE);
                            imagePreview.setVisibility(View.GONE);
                            textViewUploadStatus.setVisibility(View.GONE);
                            videoPreview.setVideoPath(photoFile.getAbsolutePath());
                            videoPreview.start();

                            Snackbar.make(findViewById(android.R.id.content), "Video berhasil diambil dan dikompresi", Snackbar.LENGTH_SHORT).show();
                        } else {
                            Toast.makeText(this, "Gagal memproses video yang dikompresi.", Toast.LENGTH_SHORT).show();
                            Log.e(TAG, "Compressed video file not found or null");
                        }
                    } else {
                        Toast.makeText(this, "Gagal menemukan file video.", Toast.LENGTH_SHORT).show();
                        Log.e(TAG, "Evidence video file not found, path: " + evidenceUrl);
                    }
                } else {
                    Toast.makeText(this, "Gagal mendapatkan video.", Toast.LENGTH_SHORT).show();
                    Log.e(TAG, "Evidence URL is null after taking video");
                }
            }
        }
    }

    private void submitAbsen() {
        sendAbsenToApi(userLat, userLng, photoFile);
    }

    private void checkPermissionsAndStartLocationUpdates() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions();
        } else {
            startLocationUpdates();
        }
    }

    @SuppressLint("MissingPermission")
    private void startLocationUpdates() {
        textViewLoadingMessage.setText("Mencari Lokasi...");
        progressOverlay.setVisibility(View.VISIBLE);
        setButtonsEnabled(false);

        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setInterval(LOCATION_UPDATE_INTERVAL);
        locationRequest.setFastestInterval(LOCATION_FASTEST_INTERVAL);

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(@NonNull LocationResult locationResult) {
                super.onLocationResult(locationResult);
                Location lastLocation = locationResult.getLastLocation();
                if (lastLocation != null) {
                    onLocationSuccess(lastLocation);
                    stopLocationUpdates();
                } else {
                    onLocationFailed();
                }
            }
        };

        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper());
    }

    private void stopLocationUpdates() {
        if (fusedLocationClient != null && locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
            locationCallback = null;
        }
    }

    private void onLocationSuccess(Location location) {
        userLat = location.getLatitude();
        userLng = location.getLongitude();

        updateLocationUI();
        updateMapMarker();
        progressOverlay.setVisibility(View.GONE);
        setButtonsEnabled(true);
    }

    private void onLocationFailed() {
        textViewLocationStatus.setText("Gagal mendapatkan lokasi. Aktifkan GPS dan coba lagi.");
        textViewLocationStatus.setTextColor(Color.RED);
        progressOverlay.setVisibility(View.GONE);
        setButtonsEnabled(true);
        Toast.makeText(this, "Gagal mendapatkan lokasi. Pastikan GPS aktif.", Toast.LENGTH_SHORT).show();
        Log.e(TAG, "Failed to get location");
    }


    private void updateLocationUI() {
        float distanceInMeters = calculateDistance(userLat, userLng, targetLatDouble, targetLngDouble);

        if (distanceInMeters <= radiusDouble) {
            textViewLocationStatus.setText("Anda berada di dalam radius");
            textViewLocationStatus.setTextColor(Color.GREEN);
            isNeedApprove = "0";
            reason = "";
        } else {
            textViewLocationStatus.setText("Anda berada di luar radius, absen akan membutuhkan approval");
            textViewLocationStatus.setTextColor(Color.parseColor("#FFA726"));
            isNeedApprove = "1";
            reason = "Absen di luar radius";
        }
    }

    private float calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        float[] results = new float[1];
        Location.distanceBetween(lat1, lon1, lat2, lon2, results);
        return results[0];
    }


    private void checkCameraPermissionAndTakePicture() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions();
        } else {
            takePicture();
        }
    }

    private void checkCameraPermissionAndTakeVideo() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions();
        } else {
            takeVideo();
        }
    }


    private void sendAbsenToApi(double userLat, double userLng, File photoPath) {
        if (photoFile == null) {
            Toast.makeText(this, "Foto tidak ditemukan!", Toast.LENGTH_SHORT).show();
            progressOverlay.setVisibility(View.GONE);
            return;
        }

        textViewLoadingMessage.setText("Mengupload Absen...");
        progressOverlay.setVisibility(View.VISIBLE);
        setButtonsEnabled(false);

        buttonTakePicture.setEnabled(false);
        buttonTakeVideo.setEnabled(false);
        buttonSubmitAbsen.setEnabled(false);
        String url = Constant.API + "absensi/";
        String catatan = editTextCatatan.getText().toString();
        SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String authToken = sharedPreferences.getString("authToken", null);
        String userId = sharedPreferences.getString("userId", null);

        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer " + authToken);

        Map<String, String> params = new HashMap<>();
        params.put("user_id", userId);
        params.put("retail_id", retail_id);
        params.put("absen_type_id", absen_id);
        params.put("latitude", String.valueOf(userLat));
        params.put("longitude", String.valueOf(userLng));
        params.put("is_approval", isNeedApprove);
        params.put("reason", catatan);


        String mimeType = getMimeType(evidenceUrl);
        MultipartRequest multipartRequest = new MultipartRequest(
                url,
                response -> {
                    progressOverlay.setVisibility(View.GONE);
                    setButtonsEnabled(true);

                    buttonTakePicture.setEnabled(true);
                    buttonTakeVideo.setEnabled(true);
                    buttonSubmitAbsen.setEnabled(true);
                    try {
                        JSONObject jsonResponse = new JSONObject(new String(response.data));
                        String status = jsonResponse.getString("message");
                        if (status != null) {
                            Intent intent = new Intent(AbsenActivity.this, StatusAbsenActivity.class);
                            intent.putExtra("infoStatus", "absen");
                            startActivity(intent);
                            finish();
                            Snackbar.make(findViewById(android.R.id.content), "Absen berhasil terkirim", Snackbar.LENGTH_SHORT).show();
                        } else {
                            String message = jsonResponse.getString("message");
                            Toast.makeText(AbsenActivity.this, "Gagal absen: " + message, Toast.LENGTH_SHORT).show();
                        }
                    } catch (JSONException e) {
                        e.printStackTrace();
                        Toast.makeText(AbsenActivity.this, "Error parsing response", Toast.LENGTH_SHORT).show();
                    }
                },
                error -> {
                    handleError(error);
                    setButtonsEnabled(true);
                },
                params,
                photoFile,
                "photo_url",
                mimeType,
                headers
        );

        Volley.newRequestQueue(this).add(multipartRequest);
    }


    private void handleError(VolleyError error) {
        progressOverlay.setVisibility(View.GONE);
        setButtonsEnabled(true);

        buttonTakePicture.setEnabled(true);
        buttonTakeVideo.setEnabled(true);
        buttonSubmitAbsen.setEnabled(true);
        if (error.networkResponse != null && error.networkResponse.statusCode == 401) {
            try {
                String responseBody = new String(error.networkResponse.data, "utf-8");
                JSONObject data = new JSONObject(responseBody);
                String message = data.getString("message");

                SharedPreferences sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE);
                SharedPreferences.Editor editor = sharedPreferences.edit();
                editor.remove("authToken");
                editor.apply();

                Intent intent = new Intent(AbsenActivity.this, LoginActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);

                Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else if (error.networkResponse != null) {
            int statusCode = error.networkResponse.statusCode;
            String responseBody = "";
            String message = "";
            try {
                responseBody = new String(error.networkResponse.data, "UTF-8");
                JSONObject data = new JSONObject(responseBody);
                message = data.getString("message");
            } catch (Exception e) {
                e.printStackTrace();
            }

            Log.e("API_ERROR", "Status Code: " + statusCode);
            Log.e("API_ERROR", "Response Body: " + responseBody);
            Toast.makeText(AbsenActivity.this, message, Toast.LENGTH_LONG).show();
        } else {
            Toast.makeText(this, "Error: " + error.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private String getMimeType(String filePath) {
        if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (filePath.endsWith(".mp4")) {
            return "video/mp4";
        }
        return "application/octet-stream";
    }

    private void setButtonsEnabled(boolean enabled) {
        buttonTakePicture.setEnabled(enabled);
        buttonTakeVideo.setEnabled(enabled);
        buttonSubmitAbsen.setEnabled(enabled);
    }

    private void updateMapMarker() {
        if (mMap == null) return;

        LatLng userLatLng = new LatLng(userLat, userLng);

        // Remove old marker
        if (userMarker != null) {
            userMarker.remove();
        }

        // Add new marker
        userMarker = mMap.addMarker(new MarkerOptions()
                .position(userLatLng)
                .title("Posisi Anda"));
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(userLatLng, MAP_ZOOM_LEVEL));
    }

    private void showToast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
    private File compressVideo(File videoFile) throws IOException {
        File compressedFile = null;
        try {
            textViewLoadingMessage.setText("Mengkompres Video..."); // Tampilkan pesan loading
            runOnUiThread(() -> progressOverlay.setVisibility(View.VISIBLE)); // Pastikan UI update di thread utama

            String filePath = videoFile.getAbsolutePath();
            IsoFile isoFile = new IsoFile(new FileDataSourceImpl(filePath));
            int videoTracks = isoFile.getMovieBox().getTrackCount();
            if (videoTracks < 1) {
                Log.e(TAG, "No video track found in: " + filePath);
                throw new IOException("No video track found");
            }

            Movie movie = MovieCreator.build(filePath); // Gunakan MovieCreator dari mp4parser

            List<Track> audioTracks = new LinkedList<>();
            List<Track> cleanedTracks = new LinkedList<>();

            for (Track track : movie.getTracks()) {
                String type = track.getHandler();
                if ("soun".equals(type)) {
                    audioTracks.add(track);
                } else if ("vide".equals(type)) {
                    cleanedTracks.add(track);
                }
            }

            Movie resultMovie = new Movie();
            if (!cleanedTracks.isEmpty()) {
                resultMovie.addTrack(new AppendTrack(cleanedTracks.toArray(new Track[0])));
            }
            if (!audioTracks.isEmpty()) {
                resultMovie.addTrack(new AppendTrack(audioTracks.toArray(new Track[0])));
            }


            Container mp4file = new DefaultMp4Builder().build(resultMovie);
            String compressedPath = videoFile.getParentFile().getAbsolutePath() + "/COMPRESSED_" + videoFile.getName();
            compressedFile = new File(compressedPath);
            FileOutputStream fos = new FileOutputStream(compressedFile);
            FileChannel fc = fos.getChannel();
            mp4file.writeContainer(fc);
            fc.close();
            fos.close();

            Log.d(TAG, "Video compressed successfully. Original size: " + videoFile.length() + ", Compressed size: " + compressedFile.length());
        } catch (IOException e) {
            Log.e(TAG, "Error compressing video", e);
            throw e; // Re-throw exception agar ditangani di pemanggil
        } finally {
            runOnUiThread(() -> progressOverlay.setVisibility(View.GONE)); // Pastikan hide progress overlay
        }
        return compressedFile;
    }
}
class BitmapUtils {

    public static Bitmap rotateBitmapBasedOnExif(Bitmap bitmap, String photoPath) {
        try {
            android.media.ExifInterface ei = new android.media.ExifInterface(photoPath);
            int orientation = ei.getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION,
                    android.media.ExifInterface.ORIENTATION_UNDEFINED);

            switch (orientation) {
                case android.media.ExifInterface.ORIENTATION_ROTATE_90:
                    return rotateImage(bitmap, 90);
                case android.media.ExifInterface.ORIENTATION_ROTATE_180:
                    return rotateImage(bitmap, 180);
                case android.media.ExifInterface.ORIENTATION_ROTATE_270:
                    return rotateImage(bitmap, 270);
                case android.media.ExifInterface.ORIENTATION_FLIP_HORIZONTAL:
                    return flipImage(bitmap, true, false);
                case android.media.ExifInterface.ORIENTATION_FLIP_VERTICAL:
                    return flipImage(bitmap, false, true);
                default:
                    return bitmap;
            }
        } catch (IOException e) {
            Log.e("BitmapUtils", "Error rotating bitmap based on EXIF: " + e.getMessage());
            return bitmap;
        }
    }


    private static Bitmap rotateImage(Bitmap source, float angle) {
        android.graphics.Matrix matrix = new android.graphics.Matrix();
        matrix.postRotate(angle);
        return Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(),
                matrix, true);
    }

    private static Bitmap flipImage(Bitmap source, boolean flipX, boolean flipY) {
        android.graphics.Matrix matrix = new android.graphics.Matrix();
        float scaleX = flipX ? -1 : 1;
        float scaleY = flipY ? -1 : 1;
        matrix.setScale(scaleX, scaleY);
        return Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), matrix, false);
    }
}