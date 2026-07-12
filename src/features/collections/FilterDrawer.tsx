import { SideDrawer } from "@/components/SideDrawer";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  label?: string;
  hasActiveFilters?: boolean;
  children: React.ReactNode;
}

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 3.5h12M3 7h8M5 10.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function FilterDrawer({
  open,
  onClose,
  onOpen,
  label = "FILTER",
  hasActiveFilters = false,
  children,
}: FilterDrawerProps) {
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      tabLabel={label}
      tabIcon={<FilterIcon />}
      topValue="top-[100px] flex-row"
      title="Filters"
      hasActiveIndicator={hasActiveFilters}>
      {children}
    </SideDrawer>
  );
}
