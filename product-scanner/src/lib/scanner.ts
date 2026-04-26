import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

export class BarcodeScanner {
  private reader: BrowserMultiFormatReader

  constructor() {
    this.reader = new BrowserMultiFormatReader()
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    onResult: (barcode: string) => void,
    onError: (error: Error) => void
  ) {
    try {
      // Use decodeFromConstraints instead of listing devices
      // This automatically uses the back camera on mobile
      await this.reader.decodeFromConstraints(
        {
          video: {
            facingMode: 'environment', // back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        videoElement,
        (result, error) => {
          if (result) {
            onResult(result.getText())
          }
          if (error && !(error instanceof NotFoundException)) {
            console.warn('Scanner error:', error)
          }
        }
      )
    } catch (err) {
      onError(err as Error)
    }
  }

  stopScanning() {
    try {
      this.reader.reset()
    } catch (e) {
      console.warn('Scanner reset error:', e)
    }
  }
}
