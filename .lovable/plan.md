
# خطة تحويل GLORE إلى منصة Marketplace احترافية

## ملخص المشروع
تحويل نظام إدارة المخزون الحالي (GLORE) إلى **منصة تجارة إلكترونية متكاملة** تدعم:
- **تجار متعددين (Marketplace)** - كل تاجر له متجره الخاص
- **زبائن** - تصفح وشراء من جميع التجار
- **موظفين** - إدارة العمليات والدعم
- **شحن متعدد** - شركات شحن + استلام من المحل
- **دفع متعدد** - بطاقات + تحويل بنكي + عند الاستلام

---

## الهيكل المقترح - 3 لوحات تحكم منفصلة

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        GLORE Marketplace                            │
├─────────────────────┬─────────────────────┬─────────────────────────┤
│   ADMIN PANEL       │   MERCHANT PANEL    │   CUSTOMER PORTAL       │
│   (لوحة الإدارة)    │   (لوحة التاجر)     │   (واجهة الزبون)        │
├─────────────────────┼─────────────────────┼─────────────────────────┤
│ • إدارة التجار      │ • منتجاتي           │ • تصفح المنتجات         │
│ • الموافقة على      │ • طلباتي            │ • سلة التسوق            │
│   المنتجات          │ • إحصائياتي         │ • إتمام الطلب           │
│ • شركات الشحن       │ • الدفعات           │ • تتبع الشحنة           │
│ • طرق الدفع         │ • إعدادات المتجر    │ • سجل الطلبات           │
│ • التقارير الشاملة  │                     │ • المفضلة               │
│ • الدعم الفني       │                     │                         │
└─────────────────────┴─────────────────────┴─────────────────────────┘
```

---

## المرحلة 1: البنية التحتية لقاعدة البيانات

### جداول جديدة مطلوبة:

**1. جدول المتاجر (stores)**
```text
stores
├── id (uuid)
├── owner_id (uuid) → profiles
├── store_name
├── store_slug (unique)
├── logo_url
├── description
├── contact_email
├── contact_phone
├── address
├── is_verified (boolean)
├── is_active (boolean)
├── commission_rate (decimal)
├── created_at / updated_at
```

**2. جدول العناوين (addresses)**
```text
addresses
├── id (uuid)
├── user_id (uuid) → profiles
├── label (منزل/عمل/آخر)
├── full_name
├── phone
├── city
├── district
├── street_address
├── postal_code
├── is_default (boolean)
```

**3. جدول الطلبات (orders)**
```text
orders
├── id (uuid)
├── order_number (unique)
├── customer_id (uuid) → profiles
├── shipping_address_id → addresses
├── status (pending/confirmed/shipped/delivered/cancelled)
├── subtotal
├── shipping_fee
├── total_amount
├── payment_method (card/bank_transfer/cod)
├── payment_status (pending/paid/failed)
├── shipping_method (courier/pickup)
├── courier_id → shipping_carriers (nullable)
├── tracking_number
├── notes
├── created_at / updated_at
```

**4. جدول تفاصيل الطلب (order_items)**
```text
order_items
├── id (uuid)
├── order_id → orders
├── product_id → products
├── store_id → stores
├── quantity
├── unit_price
├── total_price
├── status (pending/shipped/delivered)
```

**5. جدول شركات الشحن (shipping_carriers)**
```text
shipping_carriers
├── id (uuid)
├── name (Yurtiçi Kargo, Aras Kargo, etc.)
├── logo_url
├── tracking_url_template
├── is_active (boolean)
├── base_fee
├── per_kg_fee
```

**6. جدول مناطق الشحن (shipping_zones)**
```text
shipping_zones
├── id (uuid)
├── carrier_id → shipping_carriers
├── city
├── delivery_days (أيام التوصيل المتوقعة)
├── fee_override
```

**7. جدول سلة التسوق (cart_items)**
```text
cart_items
├── id (uuid)
├── user_id → profiles
├── product_id → products
├── quantity
├── created_at
```

**8. جدول المفضلة (wishlist)**
```text
wishlist
├── id (uuid)
├── user_id → profiles
├── product_id → products
├── created_at
```

**9. جدول المدفوعات (payments)**
```text
payments
├── id (uuid)
├── order_id → orders
├── method (card/bank_transfer/cod)
├── amount
├── status (pending/completed/failed/refunded)
├── transaction_id (من Stripe أو يدوي)
├── receipt_url
├── created_at
```

**10. جدول التقييمات (reviews)**
```text
reviews
├── id (uuid)
├── product_id → products
├── customer_id → profiles
├── order_id → orders
├── rating (1-5)
├── comment
├── is_verified_purchase
├── created_at
```

### تعديلات على الجداول الحالية:

**جدول products - إضافة أعمدة:**
```text
+ store_id (uuid) → stores
+ price (decimal)
+ sale_price (decimal, nullable)
+ is_published (boolean)
+ images (jsonb - مصفوفة روابط صور)
+ category
+ description
+ weight (للشحن)
```

**جدول profiles - إضافة أعمدة:**
```text
+ phone
+ user_type (admin/merchant/customer/staff)
```

### أدوار جديدة في app_role:
```text
+ 'merchant' (تاجر)
+ 'customer' (زبون)
```

---

## المرحلة 2: واجهات المستخدم

### A. واجهة الزبون (Customer Portal)
**صفحات جديدة:**
- `/store` - الصفحة الرئيسية للمتجر
- `/store/products` - قائمة المنتجات مع فلاتر
- `/store/products/:id` - تفاصيل المنتج
- `/store/cart` - سلة التسوق
- `/store/checkout` - إتمام الطلب
- `/store/orders` - طلباتي
- `/store/orders/:id` - تتبع طلب محدد
- `/store/wishlist` - المفضلة
- `/store/account` - حسابي وعناويني

**مكونات UI:**
- ProductCard (بطاقة منتج)
- ProductGallery (معرض صور)
- CartDrawer (درج سلة التسوق)
- CheckoutForm (نموذج الطلب)
- OrderTracker (متتبع الشحنة)
- AddressSelector (اختيار العنوان)

### B. لوحة التاجر (Merchant Panel)
**صفحات:**
- `/merchant/dashboard` - لوحة تحكم التاجر
- `/merchant/products` - إدارة منتجاتي
- `/merchant/orders` - طلبات متجري
- `/merchant/earnings` - أرباحي ودفعاتي
- `/merchant/settings` - إعدادات المتجر

### C. لوحة الإدارة (Admin - تحديث)
**إضافات:**
- `/admin/stores` - إدارة المتاجر
- `/admin/carriers` - شركات الشحن
- `/admin/payments` - المدفوعات
- `/admin/orders` - جميع الطلبات

---

## المرحلة 3: نظام الدفع

### طرق الدفع المدعومة:

**1. بطاقة ائتمان (Stripe)**
- تفعيل Stripe Integration
- إنشاء Checkout Session
- Webhook لتأكيد الدفع

**2. تحويل بنكي يدوي**
- الزبون يرى معلومات الحساب البنكي
- يرفع إيصال التحويل
- الإدارة تؤكد الدفع يدوياً

**3. الدفع عند الاستلام (COD)**
- الطلب يُرسل مباشرة
- يُحدث الحالة عند التسليم

---

## المرحلة 4: نظام الشحن

### سيناريوهات الشحن:

**1. شركات الشحن المتعددة**
- الزبون يختار شركة الشحن
- حساب تكلفة الشحن تلقائياً حسب المدينة
- إدخال رقم التتبع يدوياً
- رابط تتبع مباشر لموقع شركة الشحن

**2. استلام من المحل**
- الزبون يختار "استلام شخصي"
- لا تُحسب رسوم شحن
- يظهر عنوان المتجر للزبون

---

## المرحلة 5: Edge Functions

### وظائف مطلوبة:

1. **create-checkout** - إنشاء جلسة Stripe
2. **webhook-stripe** - استقبال تأكيدات الدفع
3. **send-order-notification** - إشعارات الطلبات
4. **calculate-shipping** - حساب تكلفة الشحن

---

## تقدير الجهد والمراحل

| المرحلة | الوصف | الأولوية |
|---------|-------|----------|
| 1 | البنية التحتية (DB + Auth) | عالية |
| 2 | واجهة الزبون الأساسية | عالية |
| 3 | لوحة التاجر | عالية |
| 4 | نظام الطلبات والسلة | عالية |
| 5 | الدفع عند الاستلام + تحويل بنكي | متوسطة |
| 6 | تكامل Stripe | متوسطة |
| 7 | نظام الشحن والتتبع | متوسطة |
| 8 | التقييمات والمفضلة | منخفضة |
| 9 | التقارير المتقدمة | منخفضة |

---

## ملاحظات مهمة

**بخصوص الدفع الإلكتروني (Stripe):**
- سأحتاج منك تفعيل Stripe عندما نصل لهذه المرحلة
- Stripe يتطلب حساب تاجر ومفتاح سري

**بخصوص شركات الشحن:**
- سنضيف شركات الشحن التركية الشائعة (Yurtiçi, Aras, MNG, PTT, etc.)
- التتبع سيكون رابط مباشر لموقع الشركة (لا API تلقائي)

**هل هذه الخطة تناسب رؤيتك؟**
