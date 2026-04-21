package com.ocbabsensiapps;

public class Karyawan {
    private String id;
    private String name;
    private String jabatan;
    private String fotoUrl;

    public Karyawan(String id, String name, String jabatan, String fotoUrl) {
        this.id = id;
        this.name = name;
        this.jabatan = jabatan;
        this.fotoUrl = fotoUrl;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getJabatan() {
        return jabatan;
    }

    public String getFotoUrl() {
        return fotoUrl;
    }
}
