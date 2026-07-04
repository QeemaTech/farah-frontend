import Swal from 'sweetalert2'
import { useTranslation } from 'react-i18next'

export function useConfirmDelete() {
  const { t } = useTranslation()

  return function confirmDelete(options = {}) {
    const {
      title = t('confirm.delete_title'),
      text = t('confirm.delete_text'),
      confirmButtonText = t('confirm.yes_delete'),
      cancelButtonText = t('cancel'),
    } = options

    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText,
      cancelButtonText,
    })
  }
}
