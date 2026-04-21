package com.ocbabsensiapps;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;

import java.util.List;

public class KaryawanAdapter extends RecyclerView.Adapter<KaryawanAdapter.KaryawanViewHolder> {

    private Context context;
    private final List<Karyawan> karyawanList;
    private OnItemClickListener onItemClickListener;

    public KaryawanAdapter(Context context, List<Karyawan> karyawanList,  OnItemClickListener onItemClickListener) {
        this.context = context;
        this.karyawanList = karyawanList;
        this.onItemClickListener = onItemClickListener;
    }

    @NonNull
    @Override
    public KaryawanViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_karyawan, parent, false);
        return new KaryawanViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull KaryawanViewHolder holder, int position) {
        Karyawan karyawan = karyawanList.get(position);
        holder.tvName.setText(karyawan.getName());
        holder.tvJabatan.setText(karyawan.getJabatan());

        // Muat foto menggunakan Glide
        Glide.with(holder.itemView.getContext())
                .load(Constant.IMAGE+karyawan.getFotoUrl())
                .placeholder(R.drawable.ic_launcher_foreground) // Placeholder gambar
                .error(R.drawable.ic_warning) // Jika gagal memuat gambar
                .into(holder.ivFoto);

        holder.itemView.setOnClickListener(v -> onItemClickListener.onItemClick(karyawan));
    }

    @Override
    public int getItemCount() {
        return karyawanList.size();
    }

    public static class KaryawanViewHolder extends RecyclerView.ViewHolder {
        TextView tvName, tvJabatan;
        ImageView ivFoto;

        public KaryawanViewHolder(@NonNull View itemView) {
            super(itemView);
            tvName = itemView.findViewById(R.id.tvName);
            tvJabatan = itemView.findViewById(R.id.tvJabatan);
            ivFoto = itemView.findViewById(R.id.ivFoto);
        }
    }

    public interface OnItemClickListener {
        void onItemClick(Karyawan item);
    }
}
