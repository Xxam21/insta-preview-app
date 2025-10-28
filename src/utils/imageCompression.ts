const TARGET_FILE_SIZE = 100 * 1024; // Viser 100ko par image pour iPhone
const MIN_QUALITY = 0.1; // Qualité minimale
const INITIAL_MAX_SIZE = 600; // Taille maximale initiale

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

      let width = img.width;
      let height = img.height;
      let currentMaxSize = INITIAL_MAX_SIZE;

      // Réduire d'abord les dimensions si l'image est très grande
      if (width > currentMaxSize || height > currentMaxSize) {
        const ratio = Math.min(currentMaxSize / width, currentMaxSize / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Compression progressive
      let quality = 0.7;
      let result = canvas.toDataURL('image/jpeg', quality);
      let size = getBase64Size(result);
      
      while (size > TARGET_FILE_SIZE && quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - 0.1);
        result = canvas.toDataURL('image/jpeg', quality);
        size = getBase64Size(result);

        // Si on atteint la qualité minimale et que c'est toujours trop gros,
        // réduire encore les dimensions
        if (quality === MIN_QUALITY && size > TARGET_FILE_SIZE) {
          currentMaxSize *= 0.8; // Réduire de 20%
          width = Math.floor(width * 0.8);
          height = Math.floor(height * 0.8);
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          result = canvas.toDataURL('image/jpeg', quality);
          size = getBase64Size(result);
        }
      }
      
      resolve(result);
    };
  });
};
