import { Progress } from "@/components/ui/progress";
import { useUpload } from "@/contexts/UploadContext";

export default function UploadToast() {
  const { activeUpload } = useUpload();

  if (!activeUpload) return null;

  const { title, fileName, progress } = activeUpload;

  return (
    <div className="fixed bottom-4 right-4 z-[1000] w-[360px] max-w-[92vw] shadow-lg rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Uploading this resource</div>
        <div className="text-xs text-gray-500">{progress}%</div>
      </div>
      <div className="text-sm text-gray-700 truncate">Title: {title}</div>
      <div className="text-xs text-gray-500 truncate mb-2">{fileName}</div>
      <Progress value={progress} />
    </div>
  );
}


