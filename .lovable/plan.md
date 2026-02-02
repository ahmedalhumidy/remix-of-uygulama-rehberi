

# دمج البحث داخل قائمة اختيار المنتج

## الهدف
دمج خاصية البحث مباشرة داخل القائمة المنسدلة "Ürün Seçin" بدلاً من وجود حقل بحث منفصل فوقها.

## الوضع الحالي
حالياً في `MovementForm.tsx`:
- يوجد حقل بحث منفصل (Input) فوق القائمة المنسدلة (Select)
- يجب على المستخدم الكتابة في حقل البحث ثم النقر على القائمة لاختيار المنتج

## التغييرات المطلوبة

### 1. استبدال Select بـ Combobox
سيتم استخدام مكون Combobox (قائمة منسدلة مع بحث مدمج) باستخدام مكونات Popover + Command الموجودة في المشروع.

### 2. تعديل MovementForm.tsx
```
الملف: src/components/movements/MovementForm.tsx
```

**التغييرات:**
- إزالة حقل البحث المنفصل (السطور 234-243)
- استبدال مكون Select بـ Popover + Command
- دمج خاصية البحث داخل القائمة المنسدلة مباشرة
- عرض نتائج البحث مع معلومات المنتج (الاسم، الكود، المخزون)

### 3. المكون الجديد
```
Popover
  └── PopoverTrigger (زر يعرض المنتج المختار أو "Ürün seçin...")
  └── PopoverContent
       └── Command
            └── CommandInput (حقل البحث المدمج)
            └── CommandList
                 └── CommandEmpty ("Ürün bulunamadı")
                 └── CommandGroup
                      └── CommandItem (لكل منتج)
```

---

## التفاصيل التقنية

### الملفات المتأثرة
| الملف | التغيير |
|-------|---------|
| `src/components/movements/MovementForm.tsx` | استبدال Select بـ Combobox مدمج |

### المكونات المطلوبة
جميع المكونات موجودة بالفعل:
- `@/components/ui/popover` (Popover, PopoverTrigger, PopoverContent)
- `@/components/ui/command` (Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem)

### البنية الجديدة للكود
```typescript
// إزالة حقل البحث المنفصل
// استبدال Select بـ:

<Popover open={openCombobox} onOpenChange={setOpenCombobox}>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-between">
      {selectedProduct ? selectedProduct.urunAdi : "Ürün seçin..."}
      <ChevronsUpDown className="opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-full p-0">
    <Command>
      <CommandInput placeholder="Ürün adı veya kodu ara..." />
      <CommandList>
        <CommandEmpty>Ürün bulunamadı</CommandEmpty>
        <CommandGroup>
          {products.map((product) => (
            <CommandItem
              key={product.id}
              value={`${product.urunAdi} ${product.urunKodu}`}
              onSelect={() => {
                setProductId(product.id);
                setOpenCombobox(false);
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1">
                  <div className="font-medium">{product.urunAdi}</div>
                  <div className="text-xs text-muted-foreground">
                    Kod: {product.urunKodu}
                  </div>
                </div>
                <span className="text-xs font-semibold">
                  {product.mevcutStok}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

---

## النتيجة المتوقعة
- واجهة أنظف وأبسط
- البحث مباشرة عند فتح القائمة المنسدلة
- تجربة مستخدم محسنة (نقرة واحدة للبحث والاختيار)
- الحفاظ على جميع الوظائف الحالية (مسح الباركود، عرض معلومات المنتج)

