package com.ocbabsensiapps;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide; // Tambahkan library Glide untuk loading gambar (jika belum ada)
import com.bumptech.glide.request.RequestOptions;

import java.util.List;

public class RiwayatAbsenAdapter extends RecyclerView.Adapter<RiwayatAbsenAdapter.ViewHolder> {
    private Context context;
    private List<RiwayatAbsen> riwayatAbsenList;
    private OnItemClickListener onItemClickListener;

    public RiwayatAbsenAdapter(Context context, List<RiwayatAbsen> riwayatAbsenList,  OnItemClickListener onItemClickListener) {
        this.context = context;
        this.riwayatAbsenList = riwayatAbsenList;
        this.onItemClickListener = onItemClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_riwayat_absen, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        RiwayatAbsen riwayat = riwayatAbsenList.get(position);
        holder.tvStatus.setText(riwayat.getStatus());
        holder.tvTanggal.setText(riwayat.getTanggal());
        holder.tvJam.setText(riwayat.getJam());
        if ("ontime".equals(riwayat.getCategory())) {
            holder.iconStatus.setImageResource(R.drawable.green_time);
        } else if ("late".equals(riwayat.getCategory())) {
            holder.iconStatus.setImageResource(R.drawable.red_time);
        }
        if ("Approved".equals(riwayat.getStatusApproval()) || riwayat.getStatusApproval() == null || "null".equalsIgnoreCase(riwayat.getStatusApproval()) ) {
            holder.tvStatusApproval.setText("Approved");
            holder.tvStatusApproval.setTextColor(context.getResources().getColor(R.color.green));
        } else if ("Rejected".equals(riwayat.getStatusApproval())) {
            holder.tvStatusApproval.setText("Rejected");
            holder.tvStatusApproval.setTextColor(context.getResources().getColor(R.color.red));
        } else if ("Waiting".equals(riwayat.getStatusApproval())){
            holder.tvStatusApproval.setText("Waiting");
            holder.tvStatusApproval.setTextColor(context.getResources().getColor(R.color.red));
        } else if ("1".equals(riwayat.getStatusApproval())){
            holder.tvStatusApproval.setText("Valid");
            holder.tvStatusApproval.setTextColor(context.getResources().getColor(R.color.green));
        } else if ("2".equals(riwayat.getStatusApproval())){
            holder.tvStatusApproval.setText("Tidak Valid");
            holder.tvStatusApproval.setTextColor(context.getResources().getColor(R.color.red));
        }
//        holder.tvStatusApproval.setText(riwayat.getStatusApproval());

        holder.itemView.setOnClickListener(v -> {
            String photoUrl = riwayat.getPhotoUrl();
            if (photoUrl != null && !photoUrl.isEmpty()) {
                // Cek apakah URL adalah gambar atau video (berdasarkan ekstensi atau cara lain)
                if (isImageFile(photoUrl)) {
                    // Jika gambar, tampilkan gambar
                    showImage(photoUrl);
                } else if (isVideoFile(photoUrl)) {
                    // Jika video, tampilkan video
                    showVideo(photoUrl);
                } else {
                    Toast.makeText(context, "Format file tidak didukung.", Toast.LENGTH_SHORT).show();
                }
            } else {
                Toast.makeText(context, "Tidak ada foto/video terlampir.", Toast.LENGTH_SHORT).show();
            }
            onItemClickListener.onItemClick(riwayat); // Tetap panggil onItemClick jika ada logic lain di Activity/Fragment
        });
    }

    // Fungsi untuk menentukan apakah URL adalah file gambar (berdasarkan ekstensi)
    private boolean isImageFile(String url) {
        String lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png") || lowerUrl.endsWith(".gif") || lowerUrl.endsWith(".bmp");
        // Tambahkan ekstensi gambar lain jika perlu
    }

    // Fungsi untuk menentukan apakah URL adalah file video (berdasarkan ekstensi)
    private boolean isVideoFile(String url) {
        String lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".avi") || lowerUrl.endsWith(".mov") || lowerUrl.endsWith(".mkv");
        // Tambahkan ekstensi video lain jika perlu
    }

    // Fungsi untuk menampilkan gambar (bisa menggunakan Activity baru atau Dialog)
    private void showImage(String imageUrl) {
        Intent intent = new Intent(context, TampilanMediaActivity.class); // Buat Activity baru bernama TampilanMediaActivity
        intent.putExtra("mediaUrl", imageUrl);
        intent.putExtra("mediaType", "image");
        context.startActivity(intent);
    }

    // Fungsi untuk menampilkan video (bisa menggunakan Activity baru atau Dialog)
    private void showVideo(String videoUrl) {
        Intent intent = new Intent(context, TampilanMediaActivity.class); // Gunakan Activity yang sama untuk gambar dan video
        intent.putExtra("mediaUrl", videoUrl);
        intent.putExtra("mediaType", "video");
        context.startActivity(intent);
    }


    @Override
    public int getItemCount() {
        return riwayatAbsenList.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvStatus, tvTanggal, tvJam, tvStatusApproval;
        ImageView iconStatus;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvStatus = itemView.findViewById(R.id.tvStatus);
            tvTanggal = itemView.findViewById(R.id.tvTanggal);
            tvJam = itemView.findViewById(R.id.tvJam);
            iconStatus = itemView.findViewById(R.id.iconStatus);
            tvStatusApproval = itemView.findViewById(R.id.tvStatusApproval);
        }
    }

    public interface OnItemClickListener {
        void onItemClick(RiwayatAbsen item);
    }
}