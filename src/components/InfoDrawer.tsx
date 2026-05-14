import { SideDrawer } from "@/components/SideDrawer";
import { FaInfo } from "react-icons/fa6";

interface InfoDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  title?: string;
  children: React.ReactNode;
}

export function InfoDrawer({ open, onClose, onOpen, title = "Info", children }: InfoDrawerProps) {
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      side="right"
      tabLabel="INFO"
      tabIcon={<FaInfo />}
      title={title}>
      {children}
    </SideDrawer>
  );
}
