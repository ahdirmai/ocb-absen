package com.ocbabsensiapps;

public class AbsenItem {

    private String absen_id;
    private String name;
    private String description;
    private String retail_id;
    private String latitude;
    private String longitude;
    private String radius;
    private String start_time;
    private String end_time;
    private String retail_name;
    private String is_absen_today;
    private String kategori_absen; // Tambahkan field ini

    // Constructor
    public AbsenItem(String absen_id, String name, String description, String retail_id, String latitude, String longitude, String radius, String start_time, String end_time, String retail_name, String is_absen_today, String kategori_absen) {
        this.absen_id = absen_id;
        this.name = name;
        this.description = description;
        this.retail_id = retail_id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radius = radius;
        this.start_time = start_time;
        this.end_time = end_time;
        this.retail_name = retail_name;
        this.is_absen_today = is_absen_today;
        this.kategori_absen = kategori_absen; // Inisialisasi field kategori_absen
    }

    // Getter untuk kategori_absen
    public String getKategori_absen() {
        return kategori_absen;
    }

    // Setter untuk kategori_absen (opsional, jika diperlukan)
    public void setKategori_absen(String kategori_absen) {
        this.kategori_absen = kategori_absen;
    }

    // Getter dan Setter lainnya (seperti sebelumnya)
    public String getAbsen_id() {
        return absen_id;
    }

    public void setAbsen_id(String absen_id) {
        this.absen_id = absen_id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRetail_id() {
        return retail_id;
    }

    public void setRetail_id(String retail_id) {
        this.retail_id = retail_id;
    }

    public String getLatitude() {
        return latitude;
    }

    public void setLatitude(String latitude) {
        this.latitude = latitude;
    }

    public String getLongitude() {
        return longitude;
    }

    public void setLongitude(String longitude) {
        this.longitude = longitude;
    }

    public String getRadius() {
        return radius;
    }

    public void setRadius(String radius) {
        this.radius = radius;
    }

    public String getStart_time() {
        return start_time;
    }

    public void setStart_time(String start_time) {
        this.start_time = start_time;
    }

    public String getEnd_time() {
        return end_time;
    }

    public void setEnd_time(String end_time) {
        this.end_time = end_time;
    }

    public String getRetail_name() {
        return retail_name;
    }

    public void setRetail_name(String retail_name) {
        this.retail_name = retail_name;
    }

    public String getIs_absen_today() {
        return is_absen_today;
    }

    public void setIs_absen_today(String is_absen_today) {
        this.is_absen_today = is_absen_today;
    }
}