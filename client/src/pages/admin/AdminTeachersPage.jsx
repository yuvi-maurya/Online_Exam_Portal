import { ManagedUsersPage } from './ManagedUsersPage.jsx'

export function AdminTeachersPage() {
  return (
    <ManagedUsersPage
      description="Create teacher accounts, search the directory, and manage each teacher's access to Exam Portal."
      entityLabel="Teacher"
      resource="teachers"
      title="Teachers"
    />
  )
}
