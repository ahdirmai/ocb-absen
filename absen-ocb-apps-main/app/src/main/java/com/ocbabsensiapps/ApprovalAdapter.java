package com.ocbabsensiapps;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class ApprovalAdapter extends RecyclerView.Adapter<ApprovalAdapter.ViewHolder> {

    private Context context;
    private List<ApprovalItem> approvalList;
    private OnItemClickListener onItemClickListener;

    public ApprovalAdapter(Context context, List<ApprovalItem> approvalList, OnItemClickListener onItemClickListener) {
        this.context = context;
        this.approvalList = approvalList;
        this.onItemClickListener = onItemClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_approval, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ApprovalItem item = approvalList.get(position);
        holder.nameTextView.setText(item.getNama_karyawan());
        holder.dateTextView.setText(item.getAbsen_time());
        holder.statusTextView.setText(item.getStatus_approval());

        holder.itemView.setOnClickListener(v -> onItemClickListener.onItemClick(item));
    }

    @Override
    public int getItemCount() {
        return approvalList.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView nameTextView, dateTextView, statusTextView;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            nameTextView = itemView.findViewById(R.id.nameTextView);
            dateTextView = itemView.findViewById(R.id.dateTextView);
            statusTextView = itemView.findViewById(R.id.statusTextView);
        }
    }

    public interface OnItemClickListener {
        void onItemClick(ApprovalItem item);
    }
}
