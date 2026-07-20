import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout.jsx'
import { RoleLayout } from '../layouts/RoleLayout.jsx'
import { HomePage } from '../pages/HomePage.jsx'
import { NotFoundPage } from '../pages/NotFoundPage.jsx'
import { RolePlaceholderPage } from '../pages/RolePlaceholderPage.jsx'
import { roleRouteGroups } from './routeGroups.js'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
        </Route>

        {roleRouteGroups.map(({ path, role }) => (
          <Route key={role} element={<RoleLayout role={role} />} path={path}>
            <Route index element={<RolePlaceholderPage />} />
          </Route>
        ))}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
