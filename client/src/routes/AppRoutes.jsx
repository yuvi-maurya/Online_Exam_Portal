import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout.jsx'
import { PublicLayout } from '../layouts/PublicLayout.jsx'
import { RoleLayout } from '../layouts/RoleLayout.jsx'
import { StudentLayout } from '../layouts/StudentLayout.jsx'
import { TeacherLayout } from '../layouts/TeacherLayout.jsx'
import { HomePage } from '../pages/HomePage.jsx'
import { NotFoundPage } from '../pages/NotFoundPage.jsx'
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
import { StudentAttemptPage } from '../pages/student/StudentAttemptPage.jsx'
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage.jsx'
import { StudentHistoryPage } from '../pages/student/StudentHistoryPage.jsx'
import { StudentProfilePage } from '../pages/student/StudentProfilePage.jsx'
import { StudentResultPage } from '../pages/student/StudentResultPage.jsx'
import { TeacherDashboardPage } from '../pages/teacher/TeacherDashboardPage.jsx'
import { TeacherExamBuilderPage } from '../pages/teacher/TeacherExamBuilderPage.jsx'
import { TeacherExamReportPage } from '../pages/teacher/TeacherExamReportPage.jsx'
import { TeacherExamsPage } from '../pages/teacher/TeacherExamsPage.jsx'
import { TeacherGradingPage } from '../pages/teacher/TeacherGradingPage.jsx'
import { TeacherQuestionsPage } from '../pages/teacher/TeacherQuestionsPage.jsx'
import { TeacherReportsPage } from '../pages/teacher/TeacherReportsPage.jsx'
import { ProtectedRoute } from './ProtectedRoute.jsx'

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

        <Route element={<ProtectedRoute allowedRoles={['teacher']} />} path="/teacher">
          <Route element={<RoleLayout role="teacher" />}>
            <Route element={<TeacherLayout />}>
              <Route index element={<TeacherDashboardPage />} />
              <Route path="questions" element={<TeacherQuestionsPage />} />
              <Route path="exams" element={<TeacherExamsPage />} />
              <Route path="exams/:id" element={<TeacherExamBuilderPage />} />
              <Route path="exams/:id/report" element={<TeacherExamReportPage />} />
              <Route path="grading" element={<TeacherGradingPage />} />
              <Route path="reports" element={<TeacherReportsPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['student']} />} path="/student">
          <Route element={<RoleLayout role="student" />}>
            <Route element={<StudentLayout />}>
              <Route index element={<StudentDashboardPage />} />
              <Route path="history" element={<StudentHistoryPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
              <Route path="attempts/:id" element={<StudentAttemptPage />} />
              <Route path="attempts/:id/result" element={<StudentResultPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
