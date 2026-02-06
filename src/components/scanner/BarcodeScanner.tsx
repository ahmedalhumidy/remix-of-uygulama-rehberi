import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, SwitchCamera, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  /** When true, scanner stays open after each scan for continuous scanning */
  continuous?: boolean;
}

export function BarcodeScanner({ isOpen, onClose, onScan, continuous = false }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const lastContinuousScanRef = useRef<string>('');
  const lastContinuousScanTimeRef = useRef<number>(0);

  const containerId = 'barcode-scanner-container';

  useEffect(() => {
    if (isOpen) {
      // Get available cameras
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Prefer back camera
            const backCameraIndex = devices.findIndex(
              (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('arka')
            );
            setCurrentCameraIndex(backCameraIndex >= 0 ? backCameraIndex : 0);
          } else {
            setError('Kamera bulunamadı');
          }
        })
        .catch((err) => {
          console.error('Camera error:', err);
          setError('Kamera erişim izni gerekli');
        });
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && cameras.length > 0 && !isScanning) {
      startScanner();
    }
  }, [cameras, currentCameraIndex, isOpen]);

  const startScanner = async () => {
    if (scannerRef.current) {
      await stopScanner();
    }

    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778,
      };

      await scanner.start(
        cameras[currentCameraIndex].id,
        config,
        (decodedText) => {
          if (continuous) {
            // In continuous mode, debounce same barcode within 1.5s
            const now = Date.now();
            if (
              decodedText === lastContinuousScanRef.current &&
              now - lastContinuousScanTimeRef.current < 1500
            ) {
              return; // skip duplicate
            }
            lastContinuousScanRef.current = decodedText;
            lastContinuousScanTimeRef.current = now;
            onScan(decodedText);
            // Don't close - keep scanning
          } else {
            // Legacy single-scan mode
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQ4HT4/f/bqGFQ4ek/L/2aIqDgQf');
            audio.play().catch(() => {});
            onScan(decodedText);
            handleClose();
          }
        },
        (errorMessage) => {
          // Ignore scan errors (no code found)
        }
      );

      setIsScanning(true);
      setError(null);

      // Check if flash is available
      try {
        const capabilities = scanner.getRunningTrackCameraCapabilities();
        if (capabilities.torchFeature && capabilities.torchFeature().isSupported()) {
          setHasFlash(true);
        }
      } catch {
        setHasFlash(false);
      }
    } catch (err: any) {
      console.error('Scanner start error:', err);
      setError('Kamera başlatılamadı. Lütfen izin verin.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Stop scanner error:', err);
      }
      scannerRef.current = null;
      setIsScanning(false);
      setFlashOn(false);
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const switchCamera = async () => {
    if (cameras.length > 1) {
      await stopScanner();
      setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
    }
  };

  const toggleFlash = async () => {
    if (scannerRef.current && hasFlash) {
      try {
        const capabilities = scannerRef.current.getRunningTrackCameraCapabilities();
        if (capabilities.torchFeature) {
          const torch = capabilities.torchFeature();
          if (flashOn) {
            await torch.apply(false);
            setFlashOn(false);
          } else {
            await torch.apply(true);
            setFlashOn(true);
          }
        }
      } catch (err) {
        console.error('Flash toggle error:', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Barkod Tarayıcı
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Scanner Container */}
          <div 
            id={containerId} 
            className="w-full bg-black min-h-[300px]"
          />

          {/* Overlay with scanning frame */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[260px] h-[160px]">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-x-2 top-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90">
              <div className="text-center p-4">
                <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-destructive font-medium">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setError(null);
                    startScanner();
                  }}
                >
                  Tekrar Dene
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 pt-2 space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Barkodu kamera görüş alanına getirin
          </p>

          <div className="flex justify-center gap-2">
            {cameras.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchCamera}
                className="gap-2"
              >
                <SwitchCamera className="w-4 h-4" />
                Kamera Değiştir
              </Button>
            )}

            {hasFlash && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFlash}
                className={cn("gap-2", flashOn && "bg-yellow-500/20 border-yellow-500")}
              >
                {flashOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                {flashOn ? 'Flaşı Kapat' : 'Flaş Aç'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
