import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Layers, Package, Plus, Trash2, Star, Loader2 } from 'lucide-react'
import AdminFormShell from '../components/AdminFormShell'
import { useLanguage } from '../../contexts/LanguageContext'
import { getSlaughterApiMode } from '../utils/adminSession'

const token = () => localStorage.getItem('admin_token')
const headers = () => ({ Authorization: `Bearer ${token()}` })

const emptyVariant = {
  label: '',
  ageMonths: '',
  weightKg: '',
  servesMin: '',
  servesMax: '',
  price: '',
  isActive: true,
  sortOrder: 0,
}

export default function AddSlaughterProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const isEdit = !!id
  const rtl = language === 'ar'
  const L = (ar, en) => (language === 'ar' ? ar : en)

  const [pageLoading, setPageLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const [form, setForm] = useState({
    categoryId: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    ageMonths: '',
    region: '',
    isFeatured: false,
    isActive: true,
    weightKg: '',
    servesMin: '',
    servesMax: '',
    price: '',
  })
  const [variants, setVariants] = useState([{ ...emptyVariant }])

  useEffect(() => {
    const run = async () => {
      try {
        const { origin, headers: hdr, useVendorProductApi, usePublicCategoriesAndCalculate } = getSlaughterApiMode()
        const catUrl = usePublicCategoriesAndCalculate
          ? `${origin}/api/mobile/slaughter/categories`
          : `${origin}/api/admin/slaughter/categories`
        const { data: catData } = usePublicCategoriesAndCalculate
          ? await axios.get(catUrl)
          : await axios.get(catUrl, { headers: hdr })
        setCategories(catData.categories || [])

        if (isEdit) {
          const pUrl = useVendorProductApi
            ? `${origin}/api/mobile/vendor/slaughter/products/${id}`
            : `${origin}/api/admin/slaughter/products/${id}`
          const { data: prodData } = await axios.get(pUrl, { headers: hdr })
          const p = prodData.product || prodData
          setForm({
            categoryId: p.categoryId || '',
            name: p.name || '',
            nameAr: p.nameAr || '',
            description: p.description || '',
            descriptionAr: p.descriptionAr || '',
            ageMonths: p.ageMonths || '',
            region: p.region || '',
            isFeatured: !!p.isFeatured,
            isActive: !!p.isActive,
            weightKg: p.weightKg || '',
            servesMin: p.servesMin || '',
            servesMax: p.servesMax || '',
            price: p.price || '',
          })
          if (p.variants?.length) {
            setVariants(
              p.variants.map((v) => ({
                label: v.label || '',
                ageMonths: v.ageMonths || '',
                weightKg: v.weightKg || '',
                servesMin: v.servesMin || '',
                servesMax: v.servesMax || '',
                price: v.price || '',
                isActive: v.isActive !== false,
                sortOrder: v.sortOrder || 0,
                id: v.id,
              })),
            )
          }
        } else if ((catData.categories || []).length) {
          setForm((prev) => ({ ...prev, categoryId: prev.categoryId || catData.categories[0].id }))
        }
      } catch {
        toast.error(L('تعذر تحميل البيانات', 'Could not load data'))
      } finally {
        setPageLoading(false)
      }
    }
    run()
  }, [id, isEdit])

  const canSubmit = useMemo(() => {
    const hasBase = form.categoryId && form.name && form.nameAr
    const validVariants = variants.every((v) => v.weightKg && v.servesMin && v.servesMax && v.price)
    return hasBase && validVariants
  }, [form, variants])

  const updateVariant = (idx, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)))
  }

  const addVariant = () => {
    setVariants((prev) => [...prev, { ...emptyVariant, sortOrder: prev.length }])
  }

  const removeVariant = (idx) => {
    setVariants((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((v, i) => ({ ...v, sortOrder: i })),
    )
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) {
      toast.error(L('يرجى استكمال البيانات المطلوبة', 'Please complete all required fields'))
      return
    }
    try {
      setSaving(true)
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (imageFile) fd.append('image', imageFile)

      const preparedVariants = variants.map((v, i) => ({
        ...(v.id ? { id: v.id } : {}),
        label: v.label || null,
        ageMonths: v.ageMonths ? Number(v.ageMonths) : null,
        weightKg: Number(v.weightKg),
        servesMin: Number(v.servesMin),
        servesMax: Number(v.servesMax),
        price: Number(v.price),
        isActive: !!v.isActive,
        sortOrder: i,
      }))
      fd.append('variants', JSON.stringify(preparedVariants))

      const first = preparedVariants[0]
      fd.set('weightKg', String(first.weightKg))
      fd.set('servesMin', String(first.servesMin))
      fd.set('servesMax', String(first.servesMax))
      fd.set('price', String(first.price))

      const { origin, headers: hdr, useVendorProductApi } = getSlaughterApiMode()
      if (isEdit) {
        const url = useVendorProductApi
          ? `${origin}/api/mobile/vendor/slaughter/products/${id}`
          : `${origin}/api/admin/slaughter/products/${id}`
        await axios.patch(url, fd, {
          headers: { ...hdr, 'Content-Type': 'multipart/form-data' },
        })
        toast.success(L('تم تحديث الذبيحة بنجاح', 'Product updated'))
      } else {
        const url = useVendorProductApi
          ? `${origin}/api/mobile/vendor/slaughter/products`
          : `${origin}/api/admin/slaughter/products`
        await axios.post(url, fd, {
          headers: { ...hdr, 'Content-Type': 'multipart/form-data' },
        })
        toast.success(L('تمت إضافة الذبيحة مع متغيرات الوزن', 'Product added with variants'))
      }
      navigate('/admin/slaughter/products')
    } catch (err) {
      toast.error(err.response?.data?.error || L('تعذر حفظ المنتج', 'Could not save product'))
    } finally {
      setSaving(false)
    }
  }

  const pageTitle = isEdit ? L('تعديل الذبيحة', 'Edit slaughter product') : L('إضافة ذبيحة', 'Add slaughter product')

  if (pageLoading) {
    return (
      <AdminFormShell title={pageTitle} backTo="/admin/slaughter/products" backLabel={L('المنتجات', 'Products')} loading />
    )
  }

  return (
    <AdminFormShell
      title={pageTitle}
      subtitle={L('البيانات الأساسية ومتغيرات الوزن والسعر', 'Basic details and weight/price variants')}
      breadcrumbs={[
        { label: L('الرئيسية', 'Home'), path: '/admin/dashboard' },
        { label: L('منتجات الذبائح', 'Slaughter products'), path: '/admin/slaughter/products' },
        { label: pageTitle },
      ]}
      backTo="/admin/slaughter/products"
      backLabel={L('المنتجات', 'Products')}
      footer={
        <button type="submit" form="slaughter-product-form" disabled={saving || !canSubmit} className="ads-btn ads-btn-primary min-w-[160px] gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? L('جاري الحفظ…', 'Saving…') : isEdit ? L('تحديث', 'Update') : L('حفظ', 'Save')}
        </button>
      }
    >
        <form id="slaughter-product-form" onSubmit={onSubmit} className="space-y-6" dir={rtl ? 'rtl' : 'ltr'}>
          <section className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-card)]">
            <div className="mb-5 flex items-center gap-2 border-b border-[var(--admin-border)] pb-4">
              <Package className="h-5 w-5 text-[var(--admin-accent)]" />
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                {L('البيانات الأساسية', 'Basic details')}
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{L('التصنيف', 'Category')} *</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="admin-input"
                >
                  <option value="">{L('اختر التصنيف', 'Select category')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr || c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{L('الاسم بالعربي', 'Arabic name')} *</label>
                <input
                  required
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  placeholder={L('مثال: ذبيحة حري', 'e.g. Harri slaughter')}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{L('الاسم بالإنجليزي', 'English name')} *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Harri lamb"
                  className="admin-input"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{L('عمر (شهور)', 'Age (months)')}</label>
                <input
                  value={form.ageMonths}
                  onChange={(e) => setForm({ ...form, ageMonths: e.target.value })}
                  type="number"
                  min="1"
                  className="admin-input"
                  placeholder="12"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{L('المنطقة', 'Region')}</label>
                <input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder={L('اختياري', 'Optional')}
                  className="admin-input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{L('الوصف بالعربي', 'Arabic description')}</label>
                <textarea
                  value={form.descriptionAr}
                  onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                  rows={3}
                  className="min-h-[5rem] w-full rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-sm text-[var(--admin-text)] outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/30"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{L('الوصف بالإنجليزي', 'English description')}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="min-h-[5rem] w-full rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-sm text-[var(--admin-text)] outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/30"
                  dir="ltr"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{L('صورة المنتج', 'Product image')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full rounded-[var(--admin-radius-control)] border border-dashed border-[var(--admin-border)] bg-[var(--admin-bg)]/50 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--admin-accent)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-bg)]/40 px-4 py-3 sm:col-span-1">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
                />
                <Star className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="text-sm text-[var(--admin-text)]">{L('منتج مميز', 'Featured product')}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-bg)]/40 px-4 py-3 sm:col-span-1">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
                />
                <span className="text-sm text-[var(--admin-text)]">{L('نشط', 'Active')}</span>
              </label>
            </div>
          </section>

          <section className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-card)]">
            <div className="mb-5 flex flex-col gap-3 border-b border-[var(--admin-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--admin-accent)]" />
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">{L('متغيرات الوزن والسعر', 'Weight & price variants')}</h2>
              </div>
              <button type="button" onClick={addVariant} className="admin-toolbar-btn-accent gap-2 self-start sm:self-auto">
                <Plus className="h-4 w-4" />
                {L('إضافة متغير', 'Add variant')}
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-bg)]/30 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--admin-text)]">
                      {L(`متغير #${idx + 1}`, `Variant #${idx + 1}`)}
                    </p>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--admin-danger)] hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {L('حذف', 'Remove')}
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      value={v.label}
                      onChange={(e) => updateVariant(idx, 'label', e.target.value)}
                      placeholder={L('اسم المتغير (اختياري)', 'Variant label (optional)')}
                      className="admin-input sm:col-span-3"
                    />
                    <input
                      type="number"
                      min="1"
                      value={v.ageMonths}
                      onChange={(e) => updateVariant(idx, 'ageMonths', e.target.value)}
                      placeholder={L('العمر بالشهور', 'Age (months)')}
                      className="admin-input"
                    />
                    <input
                      required
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={v.weightKg}
                      onChange={(e) => updateVariant(idx, 'weightKg', e.target.value)}
                      placeholder={L('الوزن (كجم)', 'Weight (kg)')}
                      className="admin-input"
                    />
                    <input
                      required
                      type="number"
                      min="1"
                      value={v.servesMin}
                      onChange={(e) => updateVariant(idx, 'servesMin', e.target.value)}
                      placeholder={L('يكفي من (أشخاص)', 'Serves min')}
                      className="admin-input"
                    />
                    <input
                      required
                      type="number"
                      min="1"
                      value={v.servesMax}
                      onChange={(e) => updateVariant(idx, 'servesMax', e.target.value)}
                      placeholder={L('يكفي إلى (أشخاص)', 'Serves max')}
                      className="admin-input"
                    />
                    <input
                      required
                      type="number"
                      min="1"
                      value={v.price}
                      onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                      placeholder={L('السعر', 'Price')}
                      className="admin-input"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

        </form>
    </AdminFormShell>
  )
}
