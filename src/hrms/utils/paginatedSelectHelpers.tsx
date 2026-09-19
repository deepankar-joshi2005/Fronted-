import { SelectItem } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface LoadMoreSelectItemProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  label?: string;
}

export function LoadMoreSelectItem({
  hasMore,
  loading,
  onLoadMore,
  label = "Load More",
}: LoadMoreSelectItemProps) {
  if (!hasMore) return null;

  return (
    <SelectItem
      value="__load_more__"
      disabled
      className="cursor-pointer"
      onSelect={(e) => {
        e.preventDefault();
        if (!loading && hasMore) {
          onLoadMore();
        }
      }}
    >
      <div
        className="flex items-center justify-center py-2"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!loading && hasMore) {
            onLoadMore();
          }
        }}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          label
        )}
      </div>
    </SelectItem>
  );
}

