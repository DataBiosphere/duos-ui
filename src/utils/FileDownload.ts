export const fileDownload = (data: string | ArrayBuffer | ArrayBufferView | Blob, filename: string, mime?: string) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const blob = new Blob([data], { type: mime || 'application/octet-stream' })
  const blobUrl = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.style.display = 'none'
  a.download = filename
  a.href = blobUrl

  document.body.appendChild(a)

  Promise.resolve(a.click()).then(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  })
}
