package com.ocbabsensiapps;

public class RiwayatAbsen {
    private String id;
    private String status;
    private String tanggal;
    private String jam;
    private String category;
    private String photoUrl;
    private String nama;
    private String statusApproval;

    public RiwayatAbsen(String id, String status, String tanggal, String jam, String category, String photoUrl, String nama, String statusApproval) {
        this.id = id;
        this.status = status;
        this.tanggal = tanggal;
        this.jam = jam;
        this.category = category;
        this.photoUrl = photoUrl;
        this.nama = nama;
        this.statusApproval = statusApproval;
    }

    public String getId() {
        return id;
    }

    public String getStatus() {
        return status;
    }

    public String getTanggal() {
        return tanggal;
    }

    public String getJam() {
        return jam;
    }

    public String getCategory() {
        return category;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public String getNama() {
        return nama;
    }

    public String getStatusApproval() {
        return statusApproval;
    }
}