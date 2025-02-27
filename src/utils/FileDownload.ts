export const fileDownload = (data: string | ArrayBuffer | ArrayBufferView | Blob, filename: string, mime?: string) => {
    const blob = new Blob([data], { type: mime || 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.download = filename;
    a.href = blobUrl;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    }, 100);
}
