import { ManagedUsersPage } from './ManagedUsersPage.jsx'
import { useTranslation } from 'react-i18next'

export function AdminTeachersPage() {
  const { t } = useTranslation()

  return (
    <ManagedUsersPage
      description={t('admin.teachers.description')}
      entityLabel={t('roles.TEACHER')}
      resource="teachers"
      title={t('common.teachers')}
    />
  )
}
