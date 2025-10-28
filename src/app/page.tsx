'use client';

import { useState, useEffect } from 'react';
import { Upload, Grid, Users, BookOpen, Menu, Heart, Plus, Trash2, Sun, Moon, HardDrive } from 'lucide-react';
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
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [images, setImages] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [compressionStatus, setCompressionStatus] = useState<{active: boolean; progress: number; total: number} | null>(null);
  const [profileInfo] = useState({
    username: 'Anywhere.project',
    posts: 34,
    followers: 865,
    following: 555,
    fullName: 'Pauline & Max – Overland en Defender TD5',
    bio: '👥 Bricolages, bivouacs & liberté\n🔧 Future shop : aménagements & gear'
  });

  useEffect(() => {
    console.log('Checking localStorage on mount...');
    const saved = localStorage.getItem('instaPreviewImages');
    console.log('Found saved images:', saved ? JSON.parse(saved).length : 0);
    if (saved) {
      const savedImages = JSON.parse(saved) as string[];
      
      // Vérifier et recompresser les images
      const checkAndCompressImages = async () => {
        console.log('Checking image sizes...');
        const processedImages = [];
        let totalSize = 0;

        // Traiter chaque image
        for (let i = 0; i < savedImages.length; i++) {
          const base64 = savedImages[i];
          const size = Math.ceil((base64.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
          totalSize += size;
          
          console.log(`Image ${i + 1}/${savedImages.length}: ${Math.round(size / 1024)}KB`);
          
          try {
            if (size > 100 * 1024) { // Ne montrer le statut que si une compression est nécessaire
              setCompressionStatus(prev => ({
                active: true,
                progress: i + 1,
                total: savedImages.length
              }));
              // Recompresser toutes les images pour s'assurer de la taille optimale
              const compressed = await compressImage(base64);
              processedImages.push(compressed);
            } else {
              processedImages.push(base64);
            }
          } catch (error) {
            console.error('Error compressing image:', error);
            processedImages.push(base64); // Garder l'original en cas d'erreur
          }
        }

        console.log(`Total storage before compression: ${Math.round(totalSize / 1024)}KB`);
        
        // Sauvegarder les images recompressées
        localStorage.clear(); // Nettoyer le stockage
        setImages(processedImages);
        saveToLocalStorage(processedImages);
        setCompressionStatus(null); // Cacher la notification
        
        // Vérifier la nouvelle taille totale
        const newTotalSize = processedImages.reduce((acc, img) => {
          return acc + Math.ceil((img.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
        }, 0);
        console.log(`Total storage after compression: ${Math.round(newTotalSize / 1024)}KB`);
      };

      checkAndCompressImages();
    }
  }, []);

  useEffect(() => {
    const savedProfilePicture = localStorage.getItem('instaPreviewProfilePicture');
    if (savedProfilePicture) {
      setProfilePicture(savedProfilePicture);
    }
  }, []);

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

  const getTotalStorageSize = (images: string[]) => {
    return images.reduce((acc, img) => {
      return acc + Math.ceil((img.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
    }, 0);
  };

  const saveToLocalStorage = (newImages: string[]) => {
    try {
      console.log('Saving images to localStorage:', newImages.length);
      
      // Vérifier la taille totale
      let currentImages = [...newImages];
      let totalSize = getTotalStorageSize(currentImages);
      
      // Tant que la taille dépasse 4000KB, supprimer la dernière image
      while (totalSize > 4000 * 1024 && currentImages.length > 0) {
        const removedImage = currentImages.pop();
        totalSize = getTotalStorageSize(currentImages);
        alert('La limite de stockage (4MB) a été atteinte. La dernière image a été supprimée automatiquement.');
      }

      // Mettre à jour l'état si des images ont été supprimées
      if (currentImages.length !== newImages.length) {
        setImages(currentImages);
      }

      localStorage.setItem('instaPreviewImages', JSON.stringify(currentImages));
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

  const handleDragStart = () => {
    // Désactiver le scroll quand on commence à déplacer
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Réactiver le scroll quand on finit de déplacer
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
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
          newImages.unshift(compressed);
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
      
      setImages(newImages);
      saveToLocalStorage(newImages);
    }
  };

  return (
    <main className="min-h-screen touch-pan-y relative" style={{ backgroundColor: 'var(--background)' }}>
      {/* Notification de compression */}
      {compressionStatus && compressionStatus.active && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white px-4 py-2 text-center z-50">
          Optimisation des images en cours... ({compressionStatus.progress}/{compressionStatus.total})
        </div>
      )}
      {/* Profile Header */}
      <header className="sticky top-0 z-50 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
        <div className="px-4 py-3 flex items-center">
          <div className="w-24 flex items-center gap-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Plus className="w-6 h-6" />
            </label>
            <button
              onClick={toggleTheme}
              className="hover:opacity-80"
            >
              {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold">{profileInfo.username}</h1>
          </div>

          <div className="w-24 flex justify-end gap-4">
            <button 
              className="hover:opacity-80" 
              onClick={() => {
                const totalSize = getTotalStorageSize(images);
                alert(`Stockage utilisé : ${Math.round(totalSize / 1024)}KB sur 4000KB maximum`);
              }}
            >
              <HardDrive className="w-6 h-6" />
            </button>
            {images.length > 0 && (
              <button 
                className="hover:opacity-80" 
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

        {/* Profile Info Section */}
        <div className="grid grid-cols-[auto,1fr] gap-x-8 mb-16">
          {/* Profile Picture */}
          <div className="relative w-[77px] h-[77px]">
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
          <div className="grid grid-cols-3 gap-x-16">
            <div className="text-center">
              <div className="font-semibold text-lg">{profileInfo.posts}</div>
              <div className="text-sm">publications</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{profileInfo.followers}</div>
              <div className="text-sm">followers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">{profileInfo.following}</div>
              <div className="text-sm">suivi(e)s</div>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-16"></div>

        {/* Bio */}
        <div className="space-y-2 mb-6">
          <div className="font-semibold whitespace-pre-line">{profileInfo.fullName}</div>
          <div className="text-sm whitespace-pre-line">{profileInfo.bio}</div>
        </div>

        {/* Edit Profile Button */}
        <button className="w-full px-4 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--border)', color: 'var(--text)' }}>
          Modifier le profil
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-around mt-10 border-t" style={{ borderColor: 'var(--border)' }}>
        <button className="px-4 py-3 border-t" style={{ borderColor: 'var(--text)' }}>
          <Grid size={24} />
        </button>
        <button className="px-4 py-3" style={{ color: 'var(--secondary-text)' }}>
          <BookOpen size={24} />
        </button>
        <button className="px-4 py-3" style={{ color: 'var(--secondary-text)' }}>
          <Users size={24} />
        </button>
      </div>

      {/* Image Grid */}
      <div className="px-px">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]" style={{ color: 'var(--secondary-text)' }}>
            <Upload className="w-16 h-16 mb-4" />
            <p>Upload images to preview your feed</p>
            <p className="text-sm mt-2" style={{ color: 'var(--secondary-text)' }}>Cliquez sur + en haut à droite pour ajouter des images</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
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
