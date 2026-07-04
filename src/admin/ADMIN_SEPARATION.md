# Admin Dashboard Separation

## Overview

تم فصل لوحة التحكم الإدارية (Admin Dashboard) عن التطبيق الرئيسي بشكل كامل. الآن Admin Dashboard هو تطبيق منفصل تماماً مع نظام authentication خاص به.

## البنية الجديدة

### Admin Routes Structure

```
/admin/login          → صفحة تسجيل الدخول للـ admin
/admin/dashboard      → لوحة التحكم الرئيسية
/admin/users          → إدارة المستخدمين
/admin/venues         → إدارة القاعات
/admin/services       → إدارة الخدمات
/admin/bookings       → إدارة الحجوزات
/admin/categories     → إدارة الفئات
/admin/reviews        → إدارة التقييمات
/admin/payments       → إدارة المدفوعات
/admin/reports        → التقارير
```

## الملفات الرئيسية

### 1. `AdminApp.jsx`
- ملف منفصل يحتوي على جميع routes الخاصة بالـ admin
- يستخدم Router منفصل
- جميع routes تبدأ بـ `/admin/*`

### 2. `AdminLogin.jsx`
- صفحة تسجيل دخول منفصلة للـ admin
- لا تستخدم AuthContext الرئيسي
- تستخدم `admin_token` و `admin_user` في localStorage

### 3. `AdminRoute.jsx`
- Component لحماية routes الـ admin
- يتحقق من `admin_token` و `admin_user` في localStorage
- يتحقق من أن المستخدم لديه role = 'ADMIN'
- يعيد التوجيه إلى `/admin/login` إذا لم يكن مسجلاً

### 4. `AdminLayout.jsx`
- Layout منفصل للـ admin pages
- لا يعتمد على AuthContext الرئيسي
- يقرأ بيانات المستخدم من localStorage مباشرة

## Authentication System

### Admin Authentication
- **Token Storage**: `localStorage.getItem('admin_token')`
- **User Data**: `localStorage.getItem('admin_user')`
- **Login Endpoint**: `/api/auth/login` (نفس endpoint لكن مع role check)
- **Logout**: يمسح `admin_token` و `admin_user` من localStorage

### Main App Authentication
- **Token Storage**: `localStorage.getItem('token')`
- **User Data**: `localStorage.getItem('user')`
- **Context**: `AuthContext` (منفصل تماماً عن admin)

## الفصل بين التطبيقين

### في `App.jsx` الرئيسي:
```jsx
// Admin routes منفصلة تماماً
<Route path="/admin/*" element={<AdminApp />} />
```

### في `AdminApp.jsx`:
```jsx
// جميع admin routes هنا
<Route path="/admin/login" element={<AdminLogin />} />
<Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
// ... إلخ
```

## الوصول إلى Admin Dashboard

### من التطبيق الرئيسي:
- في صفحة Profile، إذا كان المستخدم admin، يظهر رابط "لوحة التحكم"
- الرابط يفتح `/admin/login` في نافذة جديدة أو نفس النافذة

### مباشرة:
- زيارة `/admin/login` مباشرة
- تسجيل الدخول باستخدام credentials الـ admin

## المميزات

1. **فصل كامل**: Admin Dashboard منفصل تماماً عن التطبيق الرئيسي
2. **Authentication منفصل**: نظام authentication خاص بالـ admin
3. **Routes منفصلة**: جميع admin routes في ملف منفصل
4. **لا تداخل**: لا يوجد تداخل بين التطبيق الرئيسي والـ admin dashboard
5. **Security**: كل نظام له authentication خاص به

## Migration Notes

- تم إزالة جميع admin routes من `App.jsx`
- تم إنشاء `AdminApp.jsx` منفصل
- تم تحديث `AdminRoute` لاستخدام admin authentication
- تم تحديث `AdminLayout` لقراءة البيانات من localStorage مباشرة
- تم تحديث Profile page لفتح admin dashboard في نافذة منفصلة

## Testing

1. زيارة `/admin/login` - يجب أن تظهر صفحة تسجيل الدخول
2. تسجيل الدخول كـ admin - يجب أن يتم التوجيه إلى `/admin/dashboard`
3. محاولة الوصول إلى `/admin/dashboard` بدون تسجيل دخول - يجب إعادة التوجيه إلى `/admin/login`
4. تسجيل الخروج - يجب مسح البيانات وإعادة التوجيه إلى `/admin/login`



