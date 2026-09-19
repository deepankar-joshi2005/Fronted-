/** @format */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: PaginationProps) {
    const getPaginationPages = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        if (currentPage > 3) pages.push("...");

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) pages.push(i);

        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);

        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className={cn("flex items-center justify-end gap-2", className)}>
            <div className="flex items-center gap-2 bg-white shadow-sm border rounded-xl px-2 py-2">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="text-orange-600 hover:bg-orange-50"
                >
                    <ChevronLeft className="size-4" />
                </Button>

                {getPaginationPages().map((p, i) =>
                    p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">
                            …
                        </span>
                    ) : (
                        <Button
                            key={`page-${p}`}
                            variant={currentPage === p ? "default" : "ghost"}
                            size="icon-sm"
                            onClick={() => typeof p === "number" && onPageChange(p)}
                            className={cn(
                                "min-w-8 h-8 text-sm font-medium transition-all duration-200",
                                currentPage === p
                                    ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                                    : "text-orange-600 hover:bg-orange-100"
                            )}
                        >
                            {p}
                        </Button>
                    )
                )}

                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="text-orange-600 hover:bg-orange-50"
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}
