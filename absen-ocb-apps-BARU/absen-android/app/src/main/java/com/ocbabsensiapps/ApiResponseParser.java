package com.ocbabsensiapps;

import org.json.JSONArray;
import org.json.JSONObject;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public final class ApiResponseParser {

    private ApiResponseParser() {
    }

    public static JSONObject getObjectOrFirstArrayItem(JSONObject response, String key) {
        if (response == null || key == null || !response.has(key) || response.isNull(key)) {
            return null;
        }

        Object value = response.opt(key);
        if (value instanceof JSONObject) {
            return (JSONObject) value;
        }

        if (value instanceof JSONArray) {
            JSONArray array = (JSONArray) value;
            if (array.length() > 0) {
                return array.optJSONObject(0);
            }
        }

        return null;
    }

    public static JSONArray getArray(JSONObject response, String key) {
        if (response == null || key == null || !response.has(key) || response.isNull(key)) {
            return new JSONArray();
        }

        Object value = response.opt(key);
        if (value instanceof JSONArray) {
            return (JSONArray) value;
        }

        if (value instanceof JSONObject) {
            JSONArray array = new JSONArray();
            array.put(value);
            return array;
        }

        return new JSONArray();
    }

    public static String optString(JSONObject object, String... keys) {
        if (object == null || keys == null) {
            return "";
        }

        for (String key : keys) {
            if (key == null || !object.has(key) || object.isNull(key)) {
                continue;
            }

            Object value = object.opt(key);
            if (value != null) {
                String normalized = String.valueOf(value).trim();
                if (!normalized.isEmpty() && !"null".equalsIgnoreCase(normalized)) {
                    return normalized;
                }
            }
        }

        return "";
    }

    public static String cleanPath(String value) {
        if (value == null) {
            return "";
        }

        String cleaned = value.trim();
        return "null".equalsIgnoreCase(cleaned) ? "" : cleaned;
    }

    public static String buildImageUrl(String path) {
        String cleanedPath = cleanPath(path);
        if (cleanedPath.isEmpty()) {
            return "";
        }

        if (cleanedPath.startsWith("http://") || cleanedPath.startsWith("https://")) {
            return cleanedPath;
        }

        return Constant.IMAGE + cleanedPath;
    }

    public static String formatDateTime(String value, String outputPattern) {
        if (value == null || value.trim().isEmpty()) {
            return "";
        }

        String normalizedValue = value.trim();
        String[] inputPatterns = new String[]{
                "yyyy-MM-dd'T'HH:mm:ss.SSSX",
                "yyyy-MM-dd'T'HH:mm:ssX",
                "yyyy-MM-dd HH:mm:ss"
        };

        ZoneId deviceZone = ZoneId.systemDefault();
        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern(outputPattern);

        for (String inputPattern : inputPatterns) {
            try {
                DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern(inputPattern).withZone(ZoneId.of("UTC"));
                ZonedDateTime dateTime = ZonedDateTime.parse(normalizedValue, inputFormatter);
                return dateTime.withZoneSameInstant(deviceZone).format(outputFormatter);
            } catch (DateTimeParseException ignored) {
            }
        }

        return normalizedValue;
    }
}
