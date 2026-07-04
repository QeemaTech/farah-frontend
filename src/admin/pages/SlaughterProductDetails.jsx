import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Tag, User, MapPin, CircleCheck, CircleX } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import AdminDetailShell from '../components/AdminDetailShell'
import { Badge, UiCard, UiTable } from '../design-system'
import { formatImageSrc } from '../../utils/imageUtils'
import { getSlaughterApiMode } from '../utils/adminSession'

export default function SlaughterProductDetails() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const rtl = i18n.language === 'ar'
  const cur = t('slaughter.currencyShort')

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const { origin, headers: hdr, useVendorProductApi } = getSlaughterApiMode()
        const url = useVendorProductApi
          ? `${origin}/api/mobile/vendor/slaughter/products/${id}`
          : `${origin}/api/admin/slaughter/products/${id}`
        const { data } = await axios.get(url, { headers: hdr })
        setProduct(data.product || null)
      } catch (err) {
        toast.error(err.response?.data?.error || t('slaughterDetail.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id, t])

  return (
    <AdminDetailShell
      title={product?.nameAr || product?.name || t('slaughterDetail.pageTitle')}
      subtitle={t('slaughterDetail.pageTitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('slaughter.productsTitle'), path: '/admin/slaughter/products' },
        { label: t('slaughterDetail.pageTitle') },
      ]}
      backTo="/admin/slaughter/products"
      backLabel={t('slaughterDetail.back')}
      loading={loading}
      empty={!loading && !product}
      emptyTitle={t('slaughterDetail.notFound')}
      noCard
    >
      {product ? (
        <div className="grid gap-6 lg:grid-cols-3" dir={rtl ? 'rtl' : 'ltr'}>
          <UiCard className="lg:col-span-1">
            {product.image ? (
              <img src={formatImageSrc(product.image)} alt={product.nameAr} className="h-72 w-full rounded-xl object-cover" />
            ) : (
              <div className="flex h-72 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)]">
                {t('slaughterDetail.noImage')}
              </div>
            )}
          </UiCard>

          <div className="space-y-6 lg:col-span-2">
            <UiCard>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Tag className="h-5 w-5 text-[var(--admin-accent)]" aria-hidden />
                <h2 className="text-lg font-bold text-[var(--admin-text)]">{product.nameAr}</h2>
                {product.isApproved ? (
                  <Badge variant="success">{t('slaughterDetail.approved')}</Badge>
                ) : (
                  <Badge variant="warning">{t('slaughterDetail.pending')}</Badge>
                )}
              </div>
              <p className="text-sm text-[var(--admin-text-muted)]">{product.name}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  [t('slaughterDetail.price'), `${product.price} ${cur}`],
                  [t('slaughterDetail.weight'), `${product.weightKg} kg`],
                  [t('slaughterDetail.serves'), `${product.servesMin} - ${product.servesMax}`],
                  [t('slaughterDetail.region'), product.region || '—'],
                  [t('slaughterDetail.ageMonths'), product.ageMonths || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[var(--admin-surface-muted)] p-3 text-sm">
                    <p className="text-[var(--admin-text-muted)]">{label}</p>
                    <p className="font-bold text-[var(--admin-text)]">{value}</p>
                  </div>
                ))}
              </div>
            </UiCard>

            {!!product.variants?.length && (
              <UiCard ariaLabel={t('slaughterDetail.variantsTitle')}>
                <h3 className="mb-3 text-base font-bold text-[var(--admin-text)]">{t('slaughterDetail.variantsTitle')}</h3>
                <UiTable minWidth={600}>
                  <thead>
                    <tr>
                      <th>{t('slaughterDetail.colVariant')}</th>
                      <th>{t('slaughterDetail.colAge')}</th>
                      <th>{t('slaughterDetail.colWeight')}</th>
                      <th>{t('slaughterDetail.colServes')}</th>
                      <th>{t('slaughterDetail.colPrice')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id}>
                        <td>{v.label || '—'}</td>
                        <td>{v.ageMonths || '—'}</td>
                        <td>{v.weightKg} kg</td>
                        <td>
                          {v.servesMin} - {v.servesMax}
                        </td>
                        <td>
                          {v.price} {cur}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </UiTable>
              </UiCard>
            )}

            <UiCard>
              <h3 className="mb-3 text-base font-bold text-[var(--admin-text)]">{t('slaughterDetail.statusTitle')}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--admin-surface-muted)] p-3 text-sm text-[var(--admin-text)]">
                  <Tag className="h-4 w-4 text-[var(--admin-text-muted)]" aria-hidden />
                  <span>
                    {t('slaughterDetail.category')}: {product.category?.nameAr || '—'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--admin-surface-muted)] p-3 text-sm text-[var(--admin-text)]">
                  <User className="h-4 w-4 text-[var(--admin-text-muted)]" aria-hidden />
                  <span>
                    {t('slaughterDetail.vendor')}: {product.vendor?.name || t('slaughterDetail.adminProduct')}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--admin-surface-muted)] p-3 text-sm text-[var(--admin-text)]">
                  <MapPin className="h-4 w-4 text-[var(--admin-text-muted)]" aria-hidden />
                  <span>
                    {t('slaughterDetail.featured')}: {product.isFeatured ? t('slaughterDetail.yes') : t('slaughterDetail.no')}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--admin-surface-muted)] p-3 text-sm text-[var(--admin-text)]">
                  {product.isApproved ? (
                    <CircleCheck className="h-4 w-4 text-emerald-600" aria-hidden />
                  ) : (
                    <CircleX className="h-4 w-4 text-amber-600" aria-hidden />
                  )}
                  <span>
                    {t('slaughterDetail.approval')}:{' '}
                    {product.isApproved ? t('slaughterDetail.approved') : t('slaughterDetail.pending')}
                  </span>
                </div>
              </div>
            </UiCard>
          </div>
        </div>
      ) : null}
    </AdminDetailShell>
  )
}
