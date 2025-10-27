import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

interface Props {
  id: string;
  url: string;
  index: number;
  onDelete: (id: string) => void;
}

export function DraggableImage({ id, url, index, onDelete }: Props) {
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'manipulation',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative pb-[125%] bg-gray-900 group"
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Empêcher le déclenchement du drag and drop lors du clic
        e.preventDefault();
        setShowDeleteButton(!showDeleteButton);
      }}
    >
      <Image
        src={url}
        alt={`Post ${index + 1}`}
        fill
        className="object-cover"
      />
      
      {/* Bouton de suppression */}
      {showDeleteButton && (
        <button
          className="absolute top-2 right-2 bg-red-600 p-2 rounded-full hover:bg-red-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation(); // Empêcher la propagation du clic au parent
            onDelete(id);
          }}
        >
          <Trash2 size={16} className="text-white" />
        </button>
      )}
    </div>
  );
}
