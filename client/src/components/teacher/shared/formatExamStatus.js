export function formatExamStatus(status) {
  if (!status) {
    return 'Unknown'
  }

  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
