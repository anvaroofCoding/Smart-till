const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error('Faqat JPG, PNG, WEBP yoki GIF rasm yuklash mumkin'))
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      reject(new Error('Rasm hajmi 2 MB dan oshmasligi kerak'))
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Rasmni o\'qib bo\'lmadi'))
      }
    }

    reader.onerror = () => reject(new Error('Rasmni o\'qib bo\'lmadi'))
    reader.readAsDataURL(file)
  })
}
