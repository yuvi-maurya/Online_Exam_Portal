import { useTranslation } from 'react-i18next'

export function TeacherPageHeader({ actions, description, eyebrow, title }) {
  const { t } = useTranslation()

  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-[0.18em] uppercase">
          {eyebrow ?? t('teacher.common.workspace')}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}
