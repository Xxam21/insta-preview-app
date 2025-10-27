'use client';

import { useState, useEffect } from 'react';
import { Upload, Grid, Users, BookOpen, Menu, Heart, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableImage } from '../components/DraggableImage';
import { compressImage } from '../utils/imageCompression';

export default function Home() {
  // Initialize state
  const [images, setImages] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Charger la photo de profil après le montage du composant
  useEffect(() => {
    const savedProfilePicture = localStorage.getItem('instaPreviewProfilePicture');
    if (savedProfilePicture) {
      setProfilePicture(savedProfilePicture);
    }
  }, []);
  const [profileInfo] = useState({
    username: 'Anywhere.project',
    posts: 34,
    followers: 865,
    following: 555,
    fullName: 'Pauline & Max – Overland en Defender TD5',
    bio: '👥 Bricolages, bivouacs & liberté\n🔧 Future shop : aménagements & gear'
  });

  // Initialize sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load saved images on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('instaPreviewImages');
      if (saved) {
        setImages(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved images:', error);
    }
  }, []);

  // Save images to localStorage
  const saveToLocalStorage = (newImages: string[]) => {
    try {
      localStorage.setItem('instaPreviewImages', JSON.stringify(newImages));
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          alert('Désolé, la limite de stockage est atteinte. Veuillez supprimer quelques images.');
        } else {
          console.error('Error saving to localStorage:', error);
        }
      }
    }
  };

  // Handle drag end for image reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = parseInt(active.id as string);
        const newIndex = parseInt(over.id as string);
        const newImages = arrayMove(items, oldIndex, newIndex);
        saveToLocalStorage(newImages);
        return newImages;
      });
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = [...images];
      
      for (const file of Array.from(files)) {
        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          
          const compressed = await compressImage(base64);
          newImages.unshift(compressed); // Ajouter au début du tableau
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
      
      setImages(newImages);
      saveToLocalStorage(newImages);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white touch-pan-y">
      {/* Profile Header */}
      <header className="sticky top-0 z-50 bg-black border-b border-gray-800">
        <div className="px-4 py-3 flex items-center">
          <div className="w-12">
            <label className="cursor-pointer text-white">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Plus className="w-6 h-6" />
            </label>
          </div>
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-white">{profileInfo.username}</h1>
          </div>

          <div className="w-12 flex justify-end">
            {images.length > 0 && (
              <button 
                className="text-white" 
                onClick={() => {
                  if (window.confirm('Voulez-vous vraiment supprimer toutes les images ?')) {
                    if (window.confirm('Cette action est irréversible. Êtes-vous vraiment sûr ?')) {
                      setImages([]);
                      saveToLocalStorage([]);
                    }
                  }
                }}
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Profile Info */}
      <div className="px-4 pt-6">
        {/* Username */}
        <h2 className="text-[22px] font-semibold mb-8">{profileInfo.username}</h2>

        {/* Profile Info Row */}
        <div className="flex items-start mb-8">
          {/* Profile Picture */}
          <div className="relative w-[77px] h-[77px] mr-16">
            <label className="block relative w-full h-full cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64 = reader.result as string;
                      const compressed = await compressImage(base64);
                      setProfilePicture(compressed);
                      localStorage.setItem('instaPreviewProfilePicture', compressed);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {/* Story ring */}
              <div className="absolute inset-[-3px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[3px]">
                <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-white">
                  {profilePicture ? (
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                      <Image
                        src={profilePicture}
                        alt="Profile picture"
                        fill
                        className="object-cover rounded-full"
                        sizes="77px"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <Upload size={24} />
                    </div>
                  )}
                </div>
              </div>
            </label>
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="flex gap-12 text-center">
              <div>
                <div className="font-semibold text-white text-lg">{profileInfo.posts}</div>
                <div className="text-sm text-white">publications</div>
              </div>
              <div>
                <div className="font-semibold text-white text-lg">{profileInfo.followers}</div>
                <div className="text-sm text-white">followers</div>
              </div>
              <div>
                <div className="font-semibold text-white text-lg">{profileInfo.following}</div>
                <div className="text-sm text-white">suivi(e)s</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2 mb-6">
          <div className="font-semibold text-white whitespace-pre-line">{profileInfo.fullName}</div>
          <div className="text-sm text-white whitespace-pre-line">{profileInfo.bio}</div>
        </div>

        {/* Edit Profile Button */}
        <button className="w-full px-4 py-1.5 bg-[#363636] rounded-lg text-sm font-medium text-white">
          Modifier le profil
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-around mt-10 border-t border-gray-800">
        <button className="px-4 py-3 text-white border-t border-white">
          <Grid size={24} />
        </button>
        <button className="px-4 py-3 text-gray-500">
          <BookOpen size={24} />
        </button>
        <button className="px-4 py-3 text-gray-500">
          <Users size={24} />
        </button>
      </div>

      {/* Image Grid */}
      <div className="px-px">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
            <Upload className="w-16 h-16 mb-4" />
            <p>Upload images to preview your feed</p>
            <p className="text-sm text-gray-500 mt-2">Cliquez sur + en haut à droite pour ajouter des images</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((_, index) => index.toString())}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-3 gap-px">
                {images.map((img, index) => (
                  <DraggableImage
                    key={index}
                    id={index.toString()}
                    url={img}
                    index={index}
                    onDelete={(id) => {
                      const newImages = images.filter((_, i) => i !== parseInt(id));
                      setImages(newImages);
                      saveToLocalStorage(newImages);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

    </main>
  );
}
