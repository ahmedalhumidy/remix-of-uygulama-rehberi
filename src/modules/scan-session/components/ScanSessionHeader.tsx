import { MapPin, Camera, Keyboard, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScanSessionState, ScanTarget, ScanInputMethod } from '../types';
import { cn } from '@/lib/utils';

interface ScanSessionHeaderProps {
  session: ScanSessionState;
  onScanTargetChange: (t: ScanTarget) => void;
  onInputMethodChange: (m: ScanInputMethod) => void;
  onOpenShelfPicker: () => void;
  onTransferStepChange: (step: 'from' | 'scan' | 'to') => void;
}

export function ScanSessionHeader({
  session,
  onScanTargetChange,
  onInputMethodChange,
  onOpenShelfPicker,
  onTransferStepChange,
}: ScanSessionHeaderProps) {
  const targetOptions: { value: ScanTarget; label: string }[] = [
    { value: 'units', label: 'Adet' },
    { value: 'sets', label: 'Set' },
    { value: 'both', label: 'Her İkisi' },
  ];

  const inputOptions: { value: ScanInputMethod; label: string; icon: typeof Camera }[] = [
    { value: 'camera', label: 'Kamera', icon: Camera },
    { value: 'hardware', label: 'Donanım', icon: Keyboard },
    { value: 'both', label: 'Her İkisi', icon: Wifi },
  ];

  return (
    <div className="px-3 py-2 border-b bg-muted/30 space-y-2 shrink-0">
      {/* Scan target toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium shrink-0">Hedef:</span>
        <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
          {targetOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onScanTargetChange(opt.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                session.scanTarget === opt.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input method + shelf */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
          {inputOptions.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => onInputMethodChange(opt.value)}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1',
                  session.inputMethod === opt.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-3 h-3" />
                {opt.label}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={onOpenShelfPicker}
        >
          <MapPin className="w-3 h-3" />
          {session.mode === 'transfer'
            ? session.transferStep === 'from' ? 'Kaynak Raf' : 'Hedef Raf'
            : 'Raf Seç'
          }
        </Button>
      </div>

      {/* Transfer step indicator */}
      {session.mode === 'transfer' && (
        <div className="flex gap-1">
          {(['from', 'scan', 'to'] as const).map(step => (
            <button
              key={step}
              onClick={() => onTransferStepChange(step)}
              className={cn(
                'flex-1 py-1 text-xs font-medium rounded transition-all text-center',
                session.transferStep === step
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {step === 'from' ? '1. Kaynak' : step === 'scan' ? '2. Tara' : '3. Hedef'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
