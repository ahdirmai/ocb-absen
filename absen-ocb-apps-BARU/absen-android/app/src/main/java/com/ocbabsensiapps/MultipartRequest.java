package com.ocbabsensiapps;
import com.android.volley.NetworkResponse;
import com.android.volley.ParseError;
import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.toolbox.HttpHeaderParser;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;

public class MultipartRequest extends Request<NetworkResponse> {
    private final Response.Listener<NetworkResponse> mListener;
    private final Map<String, String> mHeaders;
    private final Map<String, String> mParams;
    private final File mFile;
    private final String mFileFieldName;
    private final String mFileMimeType;

    public MultipartRequest(String url,
                            Response.Listener<NetworkResponse> listener,
                            Response.ErrorListener errorListener,
                            Map<String, String> params,
                            File file,
                            String fileFieldName,
                            String fileMimeType,
                            Map<String, String> headers) {
        super(Method.POST, url, errorListener);
        this.mListener = listener;
        this.mHeaders = headers != null ? headers : new HashMap<>();
        this.mParams = params != null ? params : new HashMap<>();
        this.mFile = file;
        this.mFileFieldName = fileFieldName;
        this.mFileMimeType = fileMimeType;
    }

    @Override
    public Map<String, String> getHeaders() {
        return mHeaders;
    }

    @Override
    protected Map<String, String> getParams() {
        return mParams;
    }

    @Override
    public String getBodyContentType() {
        return "multipart/form-data; boundary=" + BOUNDARY;
    }

    @Override
    public byte[] getBody() {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try {
            // Add form fields
            for (Map.Entry<String, String> entry : mParams.entrySet()) {
                bos.write(("--" + BOUNDARY + "\r\n").getBytes());
                bos.write(("Content-Disposition: form-data; name=\"" + entry.getKey() + "\"\r\n\r\n").getBytes());
                bos.write((entry.getValue() + "\r\n").getBytes());
            }

            // Add file if present
            if (mFile != null) {
                bos.write(("--" + BOUNDARY + "\r\n").getBytes());
                bos.write(("Content-Disposition: form-data; name=\"" + mFileFieldName + "\"; filename=\"" + mFile.getName() + "\"\r\n").getBytes());
                bos.write(("Content-Type: " + mFileMimeType + "\r\n\r\n").getBytes());

                FileInputStream fileInputStream = new FileInputStream(mFile);
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = fileInputStream.read(buffer)) != -1) {
                    bos.write(buffer, 0, bytesRead);
                }
                bos.write("\r\n".getBytes());
                fileInputStream.close();
            }

            // Add closing boundary
            bos.write(("--" + BOUNDARY + "--\r\n").getBytes());

        } catch (IOException e) {
            e.printStackTrace();
        }

        return bos.toByteArray();
    }

    @Override
    protected Response<NetworkResponse> parseNetworkResponse(NetworkResponse response) {
        try {
            return Response.success(response, HttpHeaderParser.parseCacheHeaders(response));
        } catch (Exception e) {
            return Response.error(new ParseError(e));
        }
    }

    @Override
    protected void deliverResponse(NetworkResponse response) {
        mListener.onResponse(response);
    }

    private static final String BOUNDARY = "apiclient-" + System.currentTimeMillis();
}

