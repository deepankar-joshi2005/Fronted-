import { useRef, useState } from "react";

// Keeps `page` in sync with a set of filters (pass a stable string key built
// from them, e.g. `${search}|${tab}|${startDate}|${endDate}`). Whenever that
// key changes from the previous render, page snaps back to 1 in the same
// render — before any fetch effect keyed on `page` can fire for a page that
// no longer matches the new filters. Avoids a stale "wrong page" request
// racing the correct one when a filter changes while deep in pagination.
export default function useResettablePage(filterKey: string) {
  const [page, setPage] = useState(1);
  const prevKey = useRef(filterKey);
  if (prevKey.current !== filterKey) {
    prevKey.current = filterKey;
    if (page !== 1) setPage(1);
  }
  return [page, setPage] as const;
}
