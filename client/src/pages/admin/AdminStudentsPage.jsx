import { ManagedUsersPage } from './ManagedUsersPage.jsx'

export function AdminStudentsPage() {
  return (
    <ManagedUsersPage
      description="Create student accounts, find existing students, and control access without removing exam history."
      entityLabel="Student"
      resource="students"
      title="Students"
    />
  )
}
