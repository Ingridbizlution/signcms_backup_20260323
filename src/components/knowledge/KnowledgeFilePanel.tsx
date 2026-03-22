import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload, Trash2, FileText, Image, File, ExternalLink, Loader2,
} from "lucide-react";
import { useKnowledgeFiles, KnowledgeFile } from "@/hooks/useKnowledgeFiles";

const FILE_ICON_MAP: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "image/png": Image,
  "image/jpeg": Image,
  "image/webp": Image,
  "image/gif": Image,
};

function getFileIcon(type: string) {
  return FILE_ICON_MAP[type] || File;
}

interface Props {
  knowledgeItemId: string;
  itemTitle: string;
}

export function KnowledgeFilePanel({ knowledgeItemId, itemTitle }: Props) {
  const { t } = useLanguage();
  const { files, loading, uploading, uploadFiles, deleteFile, getFileUrl } =
    useKnowledgeFiles(knowledgeItemId);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{itemTitle}</h3>
          <p className="text-xs text-muted-foreground">{files.length} 個檔案</p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            size="sm"
            className="gap-2"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            上傳檔案
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <File className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">尚無檔案，點擊上方按鈕上傳</p>
          <p className="text-xs mt-1">支援 PDF、圖片、Word、Excel、TXT</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {files.map((file) => {
              const IconComp = getFileIcon(file.file_type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <IconComp className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.file_size} · {file.created_at?.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={t("tipView")}
                      onClick={() => window.open(getFileUrl(file.storage_path), "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      title={t("delete")}
                      onClick={() => deleteFile(file)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
