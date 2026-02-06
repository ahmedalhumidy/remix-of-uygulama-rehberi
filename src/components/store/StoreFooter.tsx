import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, Phone, MapPin, CreditCard, Shield, Truck, RotateCcw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function StoreFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Trust Badges */}
      <div className="border-b border-primary-foreground/10">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Ücretsiz Kargo', desc: '200₺ üzeri siparişlerde' },
              { icon: Shield, title: 'Güvenli Ödeme', desc: '256-bit SSL şifreleme' },
              { icon: RotateCcw, title: '14 Gün İade', desc: 'Koşulsuz iade garantisi' },
              { icon: CreditCard, title: 'Taksit İmkanı', desc: '12 aya varan taksit' },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="shrink-0 h-10 w-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-primary-foreground/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/store" className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">G</span>
              </div>
              <span className="font-bold text-xl tracking-tight">GLORE</span>
            </Link>
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              Türkiye'nin en güvenilir e-ticaret platformu. Binlerce ürün, yüzlerce satıcı ile güvenli alışveriş deneyimi.
            </p>
            <div className="flex flex-col gap-2 mt-4 text-sm text-primary-foreground/60">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>destek@glore.com.tr</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>0850 123 45 67</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>İstanbul, Türkiye</span>
              </div>
            </div>
          </div>

          {/* Kurumsal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Kurumsal</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Hakkımızda</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Kariyer</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Basın</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">İletişim</a></li>
            </ul>
          </div>

          {/* Yardım */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Yardım</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">SSS</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Kargo Takip</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">İade Koşulları</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Gizlilik Politikası</a></li>
            </ul>
          </div>

          {/* Satıcılar */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Satıcılar</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              <li><Link to="/merchant/create-store" className="hover:text-primary-foreground transition-colors">Satıcı Ol</Link></li>
              <li><Link to="/merchant" className="hover:text-primary-foreground transition-colors">Satıcı Girişi</Link></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Komisyon Oranları</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Satıcı Sözleşmesi</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-primary-foreground/50">
          <span>© 2025 GLORE. Tüm hakları saklıdır.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-primary-foreground transition-colors">Kullanım Koşulları</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">KVKK</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Çerez Politikası</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
