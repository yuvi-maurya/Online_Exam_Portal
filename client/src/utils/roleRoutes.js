const ROLE_HOME_ROUTES = {
  ADMIN: '/admin',
  STUDENT: '/student',
  TEACHER: '/teacher',
}

export function getRoleHomeRoute(role) {
  return ROLE_HOME_ROUTES[String(role).toUpperCase()] ?? '/'
}
