import Select from "./Select.jsx";
import Input from "./Input.jsx";
import { DATE_RANGE_PRESETS, resolvePresetRange, type DateRangePreset } from "../../utils/dateRangePresets.js";

interface DateRangeFilterProps {
  // Callers typically hold this in a plain `useState({ preset: "all", ... })`,
  // which widens to `string` — accept that rather than forcing every call site
  // to annotate its state with the exact DateRangePreset union.
  preset: string;
  startDate: string;
  endDate: string;
  onChange: (value: { preset: DateRangePreset; startDate: string; endDate: string }) => void;
}

export default function DateRangeFilter({ preset, startDate, endDate, onChange }: DateRangeFilterProps) {
  function handlePresetChange(next: DateRangePreset) {
    if (next === "custom") {
      onChange({ preset: next, startDate, endDate });
    } else {
      onChange({ preset: next, ...resolvePresetRange(next) });
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-44">
        <Select
          label="Date range"
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
        >
          {DATE_RANGE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      {preset === "custom" && (
        <>
          <div className="w-40">
            <Input
              label="From"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => onChange({ preset: preset as DateRangePreset, startDate: e.target.value, endDate })}
            />
          </div>
          <div className="w-40">
            <Input
              label="To"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => onChange({ preset: preset as DateRangePreset, startDate, endDate: e.target.value })}
            />
          </div>
        </>
      )}
    </div>
  );
}
