import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PaginatedSelectProps<T> {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  items: T[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  getItemValue: (item: T) => string;
  getItemLabel: (item: T) => string;
  disabled?: boolean;
  className?: string;
}

export function PaginatedSelect<T>({
  value,
  onValueChange,
  placeholder = 'Select...',
  items,
  loading,
  hasMore,
  onLoadMore,
  getItemValue,
  getItemLabel,
  disabled = false,
  className,
}: PaginatedSelectProps<T>) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={getItemValue(item)} value={getItemValue(item)}>
            {getItemLabel(item)}
          </SelectItem>
        ))}
        {hasMore && (
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
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center h-auto py-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!loading && hasMore) {
                  onLoadMore();
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

