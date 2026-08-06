import { ManagedUsersPage } from './ManagedUsersPage.jsx'
import { bulkImportStudents } from '../../services/adminApi.js'
import { useTranslation } from 'react-i18next'

export function AdminStudentsPage() {
  const { t } = useTranslation()

  return (
    <ManagedUsersPage
      description={t('admin.students.description')}
      entityLabel={t('roles.STUDENT')}
      bulkImport={{
        description: t('admin.students.bulkImport.description'),
        expectedColumns: t('admin.students.bulkImport.expectedColumns'),
        importFile: bulkImportStudents,
        title: t('admin.students.bulkImport.title'),
      }}
      resource="students"
      title={t('common.students')}
    />
  )
}
