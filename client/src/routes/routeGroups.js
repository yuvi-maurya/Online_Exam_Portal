export const roleRouteGroups = [
  {
    description: 'Management, governance, analytics, and reporting modules will live here.',
    path: '/admin',
    role: 'admin',
    to: '/admin',
  },
  {
    description: 'Question bank, exam authoring, and scheduling modules will live here.',
    path: '/teacher',
    role: 'teacher',
    to: '/teacher',
  },
  {
    description: 'Exam delivery, results, rankings, and certificates will live here.',
    path: '/student',
    role: 'student',
    to: '/student',
  },
]
