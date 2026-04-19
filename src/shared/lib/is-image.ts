export const isImage = (valueImage?: string): Promise<boolean> => {
  
  return new Promise((resolve) => {
    const img = new Image()
    img.src = valueImage || ''

    img.onload = () => {
      resolve(true)
    }

    img.onerror = () => {
      resolve(false)
    }
  })
}
