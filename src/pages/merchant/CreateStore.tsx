 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Store, ArrowLeft } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { useAuth } from '@/hooks/useAuth';
 import { supabase } from '@/integrations/supabase/client';
 import { useMutation } from '@tanstack/react-query';
 import { toast } from 'sonner';
 
 export default function CreateStore() {
   const { user } = useAuth();
   const navigate = useNavigate();
   
   const [formData, setFormData] = useState({
     store_name: '',
     store_slug: '',
     description: '',
     contact_email: user?.email || '',
     contact_phone: '',
     city: '',
     address: '',
   });
 
   const createStore = useMutation({
     mutationFn: async () => {
       if (!user) throw new Error('User not authenticated');
 
       // Create slug from store name
       const slug = formData.store_slug || formData.store_name
         .toLowerCase()
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/(^-|-$)/g, '');
 
       const { data, error } = await supabase
         .from('stores')
         .insert({
           owner_id: user.id,
           store_name: formData.store_name,
           store_slug: slug,
           description: formData.description,
           contact_email: formData.contact_email,
           contact_phone: formData.contact_phone,
           city: formData.city,
           address: formData.address,
         })
         .select()
         .single();
 
       if (error) throw error;
 
       // Update user role to merchant
       await supabase
         .from('user_roles')
         .upsert({
           user_id: user.id,
           role: 'merchant',
         }, { onConflict: 'user_id' });
 
       return data;
     },
     onSuccess: () => {
       toast.success('Mağazanız oluşturuldu!');
       navigate('/merchant');
     },
     onError: (error: any) => {
       if (error.message?.includes('duplicate')) {
         toast.error('Bu mağaza adı veya URL zaten kullanılıyor');
       } else {
         toast.error('Mağaza oluşturulurken hata oluştu');
       }
     },
   });
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.store_name.trim()) {
       toast.error('Mağaza adı gerekli');
       return;
     }
     createStore.mutate();
   };
 
   return (
     <div className="min-h-screen bg-muted/30 py-8">
       <div className="container max-w-2xl">
         <Button 
           variant="ghost" 
           className="mb-4"
           onClick={() => navigate(-1)}
         >
           <ArrowLeft className="mr-2 h-4 w-4" />
           Geri
         </Button>
 
         <Card>
           <CardHeader className="text-center">
             <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
               <Store className="h-6 w-6 text-primary" />
             </div>
             <CardTitle>Mağaza Oluştur</CardTitle>
             <CardDescription>
               GLORE Marketplace'te satışa başlamak için mağazanızı oluşturun
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-4">
                 <div>
                   <Label htmlFor="store_name">Mağaza Adı *</Label>
                   <Input
                     id="store_name"
                     value={formData.store_name}
                     onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                     placeholder="Örn: Ahmet'in Dükkanı"
                     required
                   />
                 </div>
 
                 <div>
                   <Label htmlFor="store_slug">Mağaza URL'i</Label>
                   <div className="flex items-center">
                     <span className="text-sm text-muted-foreground mr-2">glore.com/</span>
                     <Input
                       id="store_slug"
                       value={formData.store_slug}
                       onChange={(e) => setFormData(prev => ({ 
                         ...prev, 
                         store_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                       }))}
                       placeholder="ahmetin-dukkani"
                     />
                   </div>
                   <p className="text-xs text-muted-foreground mt-1">
                     Boş bırakırsanız mağaza adından otomatik oluşturulur
                   </p>
                 </div>
 
                 <div>
                   <Label htmlFor="description">Mağaza Açıklaması</Label>
                   <Textarea
                     id="description"
                     value={formData.description}
                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                     placeholder="Mağazanız hakkında kısa bir açıklama..."
                     rows={3}
                   />
                 </div>
 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="contact_email">İletişim E-postası</Label>
                     <Input
                       id="contact_email"
                       type="email"
                       value={formData.contact_email}
                       onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                     />
                   </div>
                   <div>
                     <Label htmlFor="contact_phone">Telefon</Label>
                     <Input
                       id="contact_phone"
                       value={formData.contact_phone}
                       onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                       placeholder="+90 5XX XXX XX XX"
                     />
                   </div>
                 </div>
 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="city">Şehir</Label>
                     <Input
                       id="city"
                       value={formData.city}
                       onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                       placeholder="İstanbul"
                     />
                   </div>
                   <div>
                     <Label htmlFor="address">Adres</Label>
                     <Input
                       id="address"
                       value={formData.address}
                       onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                       placeholder="Mahalle, Sokak, No"
                     />
                   </div>
                 </div>
               </div>
 
               <div className="bg-muted/50 rounded-lg p-4 text-sm">
                 <p className="font-medium mb-2">Bilgilendirme:</p>
                 <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                   <li>Mağazanız oluşturulduktan sonra onay sürecine alınacaktır</li>
                   <li>Onay beklerken ürün ekleyebilirsiniz</li>
                   <li>Komisyon oranı varsayılan olarak %10'dur</li>
                 </ul>
               </div>
 
               <Button 
                 type="submit" 
                 className="w-full" 
                 size="lg"
                 disabled={createStore.isPending}
               >
                 {createStore.isPending ? 'Oluşturuluyor...' : 'Mağaza Oluştur'}
               </Button>
             </form>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }