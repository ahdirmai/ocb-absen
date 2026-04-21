package com.ocbabsensiapps;

public class ApprovalItem {
    private String absensi_id;
    private String nama_karyawan;
    private String absen_time;
    private String description;
    private String status_approval;
    private String retail_name;
    private String reason;
    private String photoUrll;


    public ApprovalItem(String absensi_id, String nama_karyawan, String absen_time, String description, String status_approval, String retail_name, String reason, String photoUrll) {
        this.absensi_id = absensi_id;
        this.nama_karyawan = nama_karyawan;
        this.absen_time = absen_time;
        this.description = description;
        this.status_approval = status_approval;
        this.retail_name = retail_name;
        this.reason = reason;
        this.photoUrll = photoUrll;
    }
    public String getAbsensi_id() {
        return absensi_id;
    }

    public void setAbsensi_id(String absensi_id) {
        this.absensi_id = absensi_id;
    }

    public String getNama_karyawan() {
        return nama_karyawan;
    }

    public void setNama_karyawan(String nama_karyawan) {
        this.nama_karyawan = nama_karyawan;
    }

    public String getAbsen_time() {
        return absen_time;
    }

    public void setAbsen_time(String absen_time) {
        this.absen_time = absen_time;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus_approval() {
        return status_approval;
    }

    public void setStatus_approval(String status_approval) {
        this.status_approval = status_approval;
    }

    public String getRetail_name() {
        return retail_name;
    }

    public void setRetail_name(String retail_name) {
        this.retail_name = retail_name;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getPhotoUrll() {
        return photoUrll;
    }

    public void setPhotoUrll(String photoUrll) {
        this.photoUrll = photoUrll;
    }

}
