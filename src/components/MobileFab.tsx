import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa6";

const cls =
  "sm:hidden fixed bottom-[65px] opacity-70 right-5 z-20 w-10 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-lg flex items-center justify-center transition-colors";

type Props =
  | { to: string; onClick?: never; label?: string }
  | { onClick: () => void; to?: never; label?: string };

export function MobileFab({ to, onClick, label = "Add" }: Props) {
  if (to) {
    return (
      <Link to={to} className={cls} aria-label={label}>
        <FaPlus className="text-xl" />
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls} aria-label={label}>
      <FaPlus className="text-xl" />
    </button>
  );
}
