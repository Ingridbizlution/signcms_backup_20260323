import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KnowledgeFile {
  id: string;
  knowledge_item_id: string;
  file_name: string;
  file_size: string;
  file_type: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useKnowledgeFiles(knowledgeItemId: string | null) {
  const { user } = useAuth();
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!knowledgeItemId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("knowledge_files")
      .select("*")
      .eq("knowledge_item_id", knowledgeItemId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch files:", error);
    } else {
      setFiles(data ?? []);
    }
    setLoading(false);
  }, [knowledgeItemId]);

  useEffect(() => {
    if (knowledgeItemId && user) fetchFiles();
    else setFiles([]);
  }, [knowledgeItemId, user, fetchFiles]);

  const uploadFiles = useCallback(
    async (fileList: FileList) => {
      if (!user || !knowledgeItemId) return;

      const filesToUpload = Array.from(fileList);

      // Validate
      for (const file of filesToUpload) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`檔案 "${file.name}" 超過 20MB 限制`);
          return;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`檔案 "${file.name}" 格式不支援`);
          return;
        }
      }

      setUploading(true);
      let successCount = 0;

      for (const file of filesToUpload) {
        const ext = file.name.split(".").pop() || "";
        const storagePath = `${knowledgeItemId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("knowledge-files")
          .upload(storagePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`上傳 "${file.name}" 失敗`);
          continue;
        }

        const { error: insertError } = await supabase.from("knowledge_files").insert({
          knowledge_item_id: knowledgeItemId,
          file_name: file.name,
          file_size: formatFileSize(file.size),
          file_type: file.type,
          storage_path: storagePath,
          uploaded_by: user.id,
        });

        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error(`記錄 "${file.name}" 失敗`);
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`已上傳 ${successCount} 個檔案`);
        await fetchFiles();
      }
      setUploading(false);
    },
    [user, knowledgeItemId, fetchFiles]
  );

  const deleteFile = useCallback(
    async (file: KnowledgeFile) => {
      const { error: storageError } = await supabase.storage
        .from("knowledge-files")
        .remove([file.storage_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      const { error } = await supabase.from("knowledge_files").delete().eq("id", file.id);
      if (error) {
        console.error("Delete error:", error);
        toast.error("刪除失敗");
      } else {
        toast.success("檔案已刪除");
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
    },
    []
  );

  const getFileUrl = useCallback((storagePath: string) => {
    const { data } = supabase.storage.from("knowledge-files").getPublicUrl(storagePath);
    return data.publicUrl;
  }, []);

  return { files, loading, uploading, uploadFiles, deleteFile, getFileUrl };
}
