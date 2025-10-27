const MAX_FILE_SIZE = 500 * 1024; // 500ko en bytes

const getBase64Size = (base64String: string): number => {
  const stringLength = base64String.length - 'data:image/jpeg;base64,'.length;
  return Math.ceil(stringLength * 3 / 4);
};

export const compressImage = async (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Calculate new dimensions (max 800px width/height)
      const maxSize = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      } else if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      let quality = 0.7;
      let result = canvas.toDataURL('image/jpeg', quality);
      let size = getBase64Size(result);
      
      // Réduire progressivement la qualité jusqu'à ce que la taille soit < 500ko
      while (size > MAX_FILE_SIZE && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
        size = getBase64Size(result);
      }
      
      resolve(result);
    };
  });
};
