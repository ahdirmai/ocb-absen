package com.ocbabsensiapps;
import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class AbsenAdapter extends RecyclerView.Adapter<AbsenAdapter.ViewHolder> {

    private final List<AbsenItem> absenList;
    private final Context context;

    // Konteks lembur — di-set oleh AbsensiActivity sebelum notifyDataSetChanged.
    private boolean lemburMode = false;
    private AbsensiActivity.RetailOption lemburRetail = null;

    public AbsenAdapter(Context context, List<AbsenItem> absenList) {
        this.context = context;
        this.absenList = absenList;
    }

    public void setLemburContext(boolean lemburMode, AbsensiActivity.RetailOption lemburRetail) {
        this.lemburMode = lemburMode;
        this.lemburRetail = lemburRetail;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_absen, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        AbsenItem item = absenList.get(position);
        holder.jenisAbsenTextView.setText(item.getDescription());
        holder.tanggalAbsenTextView.setText(item.getStart_time() + " - " + item.getEnd_time());
        // Saat lembur, retail tipe tak relevan (OC ditentukan spinner) → sembunyikan.
        if (lemburMode) {
            holder.namaRetailTextView.setVisibility(View.GONE);
        } else {
            holder.namaRetailTextView.setVisibility(View.VISIBLE);
            holder.namaRetailTextView.setText(item.getRetail_name());
        }

        // Icon per arah (bukan lagi gate is_absen_today — list sudah arah-aware).
        String dir = AbsenLogic.directionOf(item);
        if ("keluar".equals(dir)) {
            holder.iconImageView.setImageResource(R.drawable.red_out);
        } else {
            holder.iconImageView.setImageResource(R.drawable.green_in);
        }

        holder.itemView.setOnClickListener(v -> {
            Intent intent = new Intent(context, AbsenActivity.class);
            intent.putExtra("absen_id", item.getAbsen_id());
            intent.putExtra("description", item.getDescription());
            intent.putExtra("start_time", item.getStart_time());
            intent.putExtra("is_lembur", String.valueOf(item.getIs_lembur()));

            // Lembur: lokasi/retail dari OC terpilih (gantikan toko lain).
            // Regular: dari tipe itu sendiri.
            boolean useLemburRetail = lemburMode && item.getIs_lembur() == 1 && lemburRetail != null;
            if (useLemburRetail) {
                intent.putExtra("retail_id", lemburRetail.retail_id);
                intent.putExtra("latitude", lemburRetail.latitude);
                intent.putExtra("longitude", lemburRetail.longitude);
                intent.putExtra("radius", lemburRetail.radius);
                intent.putExtra("retail_name", lemburRetail.name);
            } else {
                if (lemburMode && item.getIs_lembur() == 1 && lemburRetail == null) {
                    Toast.makeText(context, "Pilih OC lembur dulu.", Toast.LENGTH_SHORT).show();
                    return;
                }
                intent.putExtra("retail_id", item.getRetail_id());
                intent.putExtra("latitude", item.getLatitude());
                intent.putExtra("longitude", item.getLongitude());
                intent.putExtra("radius", item.getRadius());
                intent.putExtra("retail_name", item.getRetail_name());
            }

            context.startActivity(intent);
        });
    }

    @Override
    public int getItemCount() {
        return absenList.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView jenisAbsenTextView, tanggalAbsenTextView, namaRetailTextView;
        ImageView iconImageView;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            jenisAbsenTextView = itemView.findViewById(R.id.jenisAbsenTextView);
            tanggalAbsenTextView = itemView.findViewById(R.id.tanggalAbsenTextView);
            iconImageView = itemView.findViewById(R.id.iconImageView);
            namaRetailTextView = itemView.findViewById(R.id.namaRetailTextView);
        }
    }
}
