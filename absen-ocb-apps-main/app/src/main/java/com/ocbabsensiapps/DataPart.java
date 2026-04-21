package com.ocbabsensiapps;

public class DataPart {
    private String fileName;
    private byte[] content;
    private String type;

    // Constructor
    public DataPart(String fileName, byte[] content) {
        this.fileName = fileName;
        this.content = content;
    }

    public DataPart(String fileName, byte[] content, String type) {
        this.fileName = fileName;
        this.content = content;
        this.type = type;
    }

    // Getter untuk nama file
    public String getFileName() {
        return fileName;
    }

    // Getter untuk konten
    public byte[] getContent() {
        return content;
    }

    // Getter untuk tipe file (MIME type)
    public String getType() {
        return type;
    }
}

