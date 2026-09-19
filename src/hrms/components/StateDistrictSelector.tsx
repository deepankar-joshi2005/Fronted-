import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  locationService,
  type District,
  type State,
} from "@/api/locationService";
import { REQUIRED_LABEL_CLASS } from "@/constants/forms";
import { toast } from "sonner";

interface SelectionValue {
  id: string;
  name: string;
}

interface StateDistrictSelectorProps {
  selectedStateId?: string;
  selectedStateName?: string;
  selectedDistrictId?: string;
  selectedDistrictName?: string;
  onStateChange: (value: SelectionValue | null) => void;
  onDistrictChange: (value: SelectionValue | null) => void;
  required?: boolean;
  disabled?: boolean;
  stateLabel?: string;
  districtLabel?: string;
  stateLabelClassName?: string;
  districtLabelClassName?: string;
}

export default function StateDistrictSelector({
  selectedStateId,
  selectedStateName,
  selectedDistrictId,
  selectedDistrictName,
  onStateChange,
  onDistrictChange,
  required = false,
  disabled = false,
  stateLabel = "State",
  districtLabel = "District",
  stateLabelClassName,
  districtLabelClassName,
}: StateDistrictSelectorProps) {
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const onDistrictChangeRef = useRef(onDistrictChange);

  useEffect(() => {
    onDistrictChangeRef.current = onDistrictChange;
  }, [onDistrictChange]);

  const activeState = useMemo(() => {
    if (!states.length) return null;
    if (selectedStateId) {
      const matchById = states.find((state) => state._id === selectedStateId);
      if (matchById) return matchById;
    }
    if (selectedStateName) {
      const lowerName = selectedStateName.toLowerCase();
      return (
        states.find((state) => state.name.toLowerCase() === lowerName) ?? null
      );
    }
    return null;
  }, [states, selectedStateId, selectedStateName]);

  const activeStateId = activeState?._id ?? selectedStateId ?? "";

  const selectedStateLabel = activeState?.name ?? selectedStateName ?? "";

  const selectedDistrictLabel = useMemo(() => {
    if (selectedDistrictId) {
      const matched = districts.find(
        (district) => district._id === selectedDistrictId
      );
      if (matched) return matched.name;
    }
    return selectedDistrictName ?? "";
  }, [selectedDistrictId, selectedDistrictName, districts]);

  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true);
      try {
        const statesData = await locationService.getStates();
        setStates(statesData);
      } catch (error) {
        console.error("Error fetching states:", error);
        toast.error("Failed to load states. Please try again.");
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, []);

  useEffect(() => {
    if (!activeStateId) {
      setDistricts([]);
      if (selectedDistrictId) {
        onDistrictChangeRef.current(null);
      }
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const districtsData = await locationService.getDistricts(activeStateId);
        setDistricts(districtsData);

        if (selectedDistrictId) {
          const idMatch = districtsData.some(
            (district) => district._id === selectedDistrictId
          );
          if (!idMatch) {
            onDistrictChangeRef.current(null);
          }
        } else if (selectedDistrictName) {
          const matched = districtsData.find(
            (district) =>
              district.name.trim().toLowerCase() ===
              selectedDistrictName.trim().toLowerCase()
          );
          if (matched) {
            onDistrictChangeRef.current({
              id: matched._id,
              name: matched.name,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
        toast.error("Failed to load districts. Please try again.");
        setDistricts([]);
        if (selectedDistrictId) {
          onDistrictChangeRef.current(null);
        }
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [activeStateId, selectedDistrictId]);

  const handleStateSelect = (state: State) => {
    onStateChange({ id: state._id, name: state.name });
    onDistrictChange(null);
    setDistricts([]);
  };

  const handleDistrictSelect = (district: District) => {
    onDistrictChange({ id: district._id, name: district.name });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label
          htmlFor="state"
          className={cn(
            stateLabelClassName,
            required ? REQUIRED_LABEL_CLASS : undefined
          )}
        >
          {stateLabel}
        </Label>
        <Popover open={stateOpen} onOpenChange={setStateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={stateOpen}
              className="w-full justify-between"
              disabled={disabled || loadingStates}
            >
              {selectedStateLabel ||
                (loadingStates ? "Loading states..." : "Select state")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search states..." />
              <CommandList>
                <CommandEmpty>No state found.</CommandEmpty>
                <CommandGroup>
                  {states.map((state) => (
                    <CommandItem
                      key={state._id}
                      value={state.name}
                      onSelect={() => {
                        handleStateSelect(state);
                        setStateOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          activeStateId === state._id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {state.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="district"
          className={cn(
            districtLabelClassName,
            required ? REQUIRED_LABEL_CLASS : undefined
          )}
        >
          {districtLabel}
        </Label>
        <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={districtOpen}
              className="w-full justify-between"
              disabled={disabled || loadingDistricts || !activeStateId}
            >
              {selectedDistrictLabel ||
                (!activeStateId
                  ? "Select state first"
                  : loadingDistricts
                  ? "Loading districts..."
                  : "Select district")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search districts..." />
              <CommandList>
                <CommandEmpty>No district found.</CommandEmpty>
                <CommandGroup>
                  {districts.map((district) => (
                    <CommandItem
                      key={district._id}
                      value={district.name}
                      onSelect={() => {
                        handleDistrictSelect(district);
                        setDistrictOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedDistrictId === district._id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {district.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}


