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

    private List<AbsenItem> absenList;
    private Context context;

    public AbsenAdapter(Context context, List<AbsenItem> absenList) {
        this.context = context;
        this.absenList = absenList;
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
        holder.namaRetailTextView.setText(item.getRetail_name());
        String isAbsenToday = item.getIs_absen_today();
        if ("1".equals(isAbsenToday)) {
            holder.iconImageView.setImageResource(R.drawable.green_check);
        }else {
            holder.iconImageView.setImageResource(R.drawable.red_out);
        }
        holder.itemView.setOnClickListener(v -> {
            // Pindah ke halaman lain
            if ("1".equals(item.getIs_absen_today())) {
                // Tampilkan Toast jika sudah absen
                Toast.makeText(context, "Anda sudah absen hari ini!", Toast.LENGTH_SHORT).show();
            } else {
                Intent intent = new Intent(context, AbsenActivity.class);

                // Kirim parameter dengan Intent
                intent.putExtra("absen_id", item.getAbsen_id());
                intent.putExtra("description", item.getDescription());
                intent.putExtra("retail_id", item.getRetail_id());
                intent.putExtra("latitude", item.getLatitude());
                intent.putExtra("longitude", item.getLongitude());
                intent.putExtra("radius", item.getRadius());
                intent.putExtra("retail_name", item.getRetail_name());

                // Start activity
                context.startActivity(intent);
            }
        });
    }

    @Override
    public int getItemCount() {
        return absenList.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView jenisAbsenTextView, tanggalAbsenTextView , namaRetailTextView;
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
