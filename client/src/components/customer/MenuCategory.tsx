import { Button } from '@/components/ui/button';

interface MenuCategoryProps {
  id: number;
  name: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function MenuCategory({ id, name, isSelected, onClick }: MenuCategoryProps) {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-full ${
        isSelected
          ? 'bg-primary text-white'
          : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
      }`}
      onClick={onClick}
    >
      {name}
    </button>
  );
}
