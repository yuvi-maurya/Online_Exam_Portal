import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout.jsx'
import { PublicLayout } from '../layouts/PublicLayout.jsx'
import { RoleLayout } from '../layouts/RoleLayout.jsx'
import { HomePage } from '../pages/HomePage.jsx'
import { NotFoundPage } from '../pages/NotFoundPage.jsx'
import { RolePlaceholderPage } from '../pages/RolePlaceholderPage.jsx'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.jsx'
import { AdminReportsPage } from '../pages/admin/AdminReportsPage.jsx'
import { AdminStudentsPage } from '../pages/admin/AdminStudentsPage.jsx'
import { AdminSubjectsPage } from '../pages/admin/AdminSubjectsPage.jsx'
import { AdminTeachersPage } from '../pages/admin/AdminTeachersPage.jsx'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage.jsx'
import { LoginPage } from '../pages/auth/LoginPage.jsx'
import { RegisterPage } from '../pages/auth/RegisterPage.jsx'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage.jsx'
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage.jsx'
import { ProtectedRoute } from './ProtectedRoute.jsx'
import { roleRouteGroups } from './routeGroups.js'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />} path="/admin">
          <Route element={<RoleLayout role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="students" element={<AdminStudentsPage />} />
              <Route path="teachers" element={<AdminTeachersPage />} />
              <Route path="subjects" element={<AdminSubjectsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
            </Route>
          </Route>
        </Route>

        {roleRouteGroups
          .filter(({ role }) => role !== 'admin')
          .map(({ path, role }) => (
            <Route key={role} element={<ProtectedRoute allowedRoles={[role]} />} path={path}>
              <Route element={<RoleLayout role={role} />}>
                <Route index element={<RolePlaceholderPage />} />
              </Route>
            </Route>
          ))}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
