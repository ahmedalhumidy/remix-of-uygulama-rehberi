import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, CreditCard, Check, Plus, Tag, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StoreHeader } from '@/components/store/StoreHeader';
import { useCartContext } from '@/contexts/CartContext';
import { useCustomerOrders, useAddresses } from '../hooks/useOrders';
import { usePromotions } from '../hooks/usePromotions';
import { useToast } from '@/hooks/use-toast';
import type { MarketplaceProduct } from '@/types/marketplace';
import type { AppliedPromotion } from '../types';
import { cn } from '@/lib/utils';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cart, cartTotal, clearCart } = useCartContext();
  const { addresses, addAddress } = useAddresses();
  const { createOrder } = useCustomerOrders();
  const { validateCoupon, calculateDiscount, getAutoPromotions } = usePromotions();

  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderNotes, setOrderNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedPromotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New address form
  const [newAddr, setNewAddr] = useState({ full_name: '', phone: '', city: '', district: '', street_address: '', postal_code: '', label: 'ev' });
  const [showAddrForm, setShowAddrForm] = useState(false);

  const autoPromotions = getAutoPromotions(cartTotal);
  const totalDiscount = (appliedCoupon?.discount_amount ?? 0) + autoPromotions.reduce((s, p) => s + p.discount_amount, 0);
  const shippingFee = cartTotal >= 200 ? 0 : 29.90;
  const finalTotal = cartTotal - totalDiscount + shippingFee;

  const handleApplyCoupon = async () => {
    try {
      const rule = await validateCoupon.mutateAsync({ code: couponCode, cartTotal });
      setAppliedCoupon(calculateDiscount(rule, cartTotal));
      toast({ title: 'Kupon uygulandı!' });
    } catch (err: any) {
      toast({ title: 'Kupon hatası', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddAddress = async () => {
    try {
      const addr = await addAddress.mutateAsync(newAddr);
      setSelectedAddress(addr.id);
      setShowAddrForm(false);
      toast({ title: 'Adres eklendi' });
    } catch {
      toast({ title: 'Adres eklenemedi', variant: 'destructive' });
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({ title: 'Lütfen bir adres seçin', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const items = cart.map(item => {
        const product = item.product as MarketplaceProduct | undefined;
        return {
          product_id: item.product_id || '',
          store_id: product?.store_id || undefined,
          quantity: item.quantity,
          unit_price: product?.sale_price ?? product?.price ?? 0,
        };
      });

      await createOrder.mutateAsync({
        address_id: selectedAddress,
        items,
        subtotal: cartTotal,
        shipping_fee: shippingFee,
        total_amount: finalTotal,
        payment_method: paymentMethod,
        notes: orderNotes || undefined,
      });

      clearCart();
      toast({ title: 'Siparişiniz alındı!', description: 'Sipariş detaylarını hesabınızdan takip edebilirsiniz.' });
      navigate('/store/orders');
    } catch (err: any) {
      toast({ title: 'Sipariş oluşturulamadı', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Sepetiniz Boş</h1>
          <p className="text-muted-foreground mb-4">Alışverişe başlamak için ürün ekleyin.</p>
          <Button onClick={() => navigate('/store')}>Mağazaya Dön</Button>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Adres', icon: MapPin },
    { num: 2, label: 'Kargo', icon: Truck },
    { num: 3, label: 'Ödeme', icon: CreditCard },
    { num: 4, label: 'Onay', icon: Check },
  ];

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main className="container py-6">
        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <button
                onClick={() => s.num < step && setStep(s.num)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                  step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                <s.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && <div className={cn('w-8 h-0.5 mx-1', step > s.num ? 'bg-primary' : 'bg-border')} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Address */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Teslimat Adresi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length > 0 ? (
                    <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                      {addresses.map(addr => (
                        <div key={addr.id} className={cn('flex items-start gap-3 border rounded-lg p-4 cursor-pointer', selectedAddress === addr.id && 'border-primary bg-primary/5')}>
                          <RadioGroupItem value={addr.id} id={addr.id} />
                          <label htmlFor={addr.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{addr.full_name}</span>
                              {addr.is_default && <Badge variant="secondary" className="text-xs">Varsayılan</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{addr.street_address}</p>
                            <p className="text-sm text-muted-foreground">{addr.district && `${addr.district}, `}{addr.city}</p>
                            <p className="text-sm text-muted-foreground">{addr.phone}</p>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Henüz adres eklenmemiş</p>
                  )}

                  <Dialog open={showAddrForm} onOpenChange={setShowAddrForm}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full"><Plus className="h-4 w-4 mr-2" /> Yeni Adres Ekle</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Yeni Adres</DialogTitle></DialogHeader>
                      <div className="grid gap-3 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Ad Soyad</Label><Input value={newAddr.full_name} onChange={e => setNewAddr(p => ({ ...p, full_name: e.target.value }))} /></div>
                          <div><Label>Telefon</Label><Input value={newAddr.phone} onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Şehir</Label><Input value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} /></div>
                          <div><Label>İlçe</Label><Input value={newAddr.district} onChange={e => setNewAddr(p => ({ ...p, district: e.target.value }))} /></div>
                        </div>
                        <div><Label>Adres</Label><Textarea value={newAddr.street_address} onChange={e => setNewAddr(p => ({ ...p, street_address: e.target.value }))} rows={2} /></div>
                        <Button onClick={handleAddAddress} disabled={addAddress.isPending}>Kaydet</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button className="w-full" onClick={() => setStep(2)} disabled={!selectedAddress}>Devam Et</Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Shipping */}
            {step === 2 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Kargo Seçimi</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value="standard" className="space-y-3">
                    <div className="flex items-center gap-3 border rounded-lg p-4 border-primary bg-primary/5">
                      <RadioGroupItem value="standard" />
                      <div className="flex-1">
                        <p className="font-medium">Standart Kargo</p>
                        <p className="text-sm text-muted-foreground">1-3 iş günü</p>
                      </div>
                      <span className="font-medium">{shippingFee > 0 ? `₺${shippingFee.toFixed(2)}` : 'Ücretsiz'}</span>
                    </div>
                  </RadioGroup>

                  {/* Order Notes */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2"><MessageSquare className="h-4 w-4" /> Sipariş Notu</Label>
                    <Textarea
                      placeholder="Sipariş ile ilgili notlarınız (isteğe bağlı)..."
                      value={orderNotes}
                      onChange={e => setOrderNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)}>Geri</Button>
                    <Button className="flex-1" onClick={() => setStep(3)}>Devam Et</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Ödeme Yöntemi</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    {[
                      { value: 'card', label: 'Kredi / Banka Kartı', desc: 'Güvenli ödeme' },
                      { value: 'bank_transfer', label: 'Havale / EFT', desc: 'Banka havalesi ile ödeme' },
                      { value: 'cod', label: 'Kapıda Ödeme', desc: 'Teslimatta nakit veya kart' },
                    ].map(pm => (
                      <div key={pm.value} className={cn('flex items-center gap-3 border rounded-lg p-4', paymentMethod === pm.value && 'border-primary bg-primary/5')}>
                        <RadioGroupItem value={pm.value} />
                        <div>
                          <p className="font-medium">{pm.label}</p>
                          <p className="text-sm text-muted-foreground">{pm.desc}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)}>Geri</Button>
                    <Button className="flex-1" onClick={() => setStep(4)}>Devam Et</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Check className="h-5 w-5" /> Sipariş Onayı</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Sipariş detaylarını kontrol edin ve onaylayın.</p>

                  {/* Cart Items Summary */}
                  <div className="space-y-3">
                    {cart.map(item => {
                      const p = item.product as MarketplaceProduct | undefined;
                      if (!p) return null;
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                            <img src={(p.images as string[])?.[0] || '/placeholder.svg'} alt={p.urun_adi} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.urun_adi}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} adet × ₺{(p.sale_price ?? p.price).toFixed(2)}</p>
                          </div>
                          <span className="text-sm font-medium">₺{((p.sale_price ?? p.price) * item.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(3)}>Geri</Button>
                    <Button className="flex-1" size="lg" onClick={handlePlaceOrder} disabled={isSubmitting}>
                      {isSubmitting ? 'İşleniyor...' : `Siparişi Onayla (₺${finalTotal.toFixed(2)})`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: Order Summary */}
          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardHeader><CardTitle className="text-base">Sipariş Özeti</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam ({cart.reduce((s, i) => s + i.quantity, 0)} ürün)</span>
                  <span>₺{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kargo</span>
                  <span className={shippingFee === 0 ? 'text-success' : ''}>
                    {shippingFee === 0 ? 'Ücretsiz' : `₺${shippingFee.toFixed(2)}`}
                  </span>
                </div>

                {/* Auto promotions */}
                {autoPromotions.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm text-success">
                    <span>{p.rule.name}</span>
                    <span>-₺{p.discount_amount.toFixed(2)}</span>
                  </div>
                ))}

                {/* Applied coupon */}
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-success">
                    <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {appliedCoupon.rule.code}</span>
                    <span>-₺{appliedCoupon.discount_amount.toFixed(2)}</span>
                  </div>
                )}

                {/* Coupon input */}
                {!appliedCoupon && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kupon kodu"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      className="h-9"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || validateCoupon.isPending}
                    >
                      Uygula
                    </Button>
                  </div>
                )}

                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Toplam</span>
                  <span>₺{finalTotal.toFixed(2)}</span>
                </div>

                {cartTotal < 200 && (
                  <p className="text-xs text-muted-foreground text-center">
                    ₺{(200 - cartTotal).toFixed(2)} daha ekleyin, ücretsiz kargo kazanın!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
