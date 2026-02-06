import { CheckCircle2, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScanSessionResult, ScanSessionMode } from '../types';

interface ScanSessionSummaryProps {
  result: ScanSessionResult;
  onDone: () => void;
}

export function ScanSessionSummary({ result, onDone }: ScanSessionSummaryProps) {
  const modeLabels: Record<ScanSessionMode, string> = {
    in: 'Stok Girişi',
    out: 'Stok Çıkışı',
    transfer: 'Transfer',
    count: 'Sayım',
  };

  const duration = Math.round((result.processedAt - Date.now()) / 1000);
  const allSuccess = result.errorCount === 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
      <div className={`rounded-full p-4 ${allSuccess ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
        {allSuccess ? (
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
        ) : (
          <AlertCircle className="w-16 h-16 text-amber-500" />
        )}
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">
          {allSuccess ? 'Tüm İşlemler Tamamlandı!' : 'İşlem Tamamlandı'}
        </h2>
        <p className="text-sm text-muted-foreground">{modeLabels[result.mode]} oturumu</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        <StatBox label="Toplam Satır" value={result.totalLines} icon={Package} />
        <StatBox label="Başarılı" value={result.successCount} icon={CheckCircle2} color="text-emerald-500" />
        <StatBox label="Toplam Adet" value={result.totalUnits} icon={Package} />
        <StatBox label="Toplam Set" value={result.totalSets} icon={Package} />
        {result.errorCount > 0 && (
          <StatBox label="Hata" value={result.errorCount} icon={AlertCircle} color="text-destructive" />
        )}
      </div>

      <Button size="lg" className="w-full max-w-xs mt-4" onClick={onDone}>
        Tamam
      </Button>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon: Icon,
  color = 'text-foreground',
}: {
  label: string;
  value: number;
  icon: typeof Package;
  color?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
