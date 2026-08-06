import { QUESTION_DIFFICULTIES, QUESTION_TYPES } from '../../../utils/teacherQuestionValidation.js'
import { formatSubjectLabel } from '../../../utils/teacherSubject.js'
import { useTranslation } from 'react-i18next'

const controlClassName =
  'focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 transition outline-none placeholder:text-slate-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-600'

export function QuestionFilters({
  filters,
  onClear,
  onFilterChange,
  onSearch,
  searchDraft,
  setSearchDraft,
  subjects,
  subjectsLoading = false,
  subjectsUnavailable = false,
}) {
  const { t } = useTranslation()
  const hasFilters = Boolean(
    filters.difficulty || filters.search || filters.subjectId || filters.type,
  )

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          onSearch(searchDraft)
        }}
      >
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="teacher-question-search">
            {t('teacher.questions.filters.searchLabel')}
          </label>
          <input
            className={controlClassName}
            id="teacher-question-search"
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={t('teacher.questions.filters.searchPlaceholder')}
            type="search"
            value={searchDraft}
          />
        </div>
        <button
          className="bg-brand-500 hover:bg-brand-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
          type="submit"
        >
          {t('common.search')}
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <div>
          <label
            className="mb-1.5 block text-xs font-medium tracking-wide text-slate-600 uppercase dark:text-slate-400"
            htmlFor="teacher-question-subject-filter"
          >
            {t('common.subject')}
          </label>
          <select
            className={controlClassName}
            disabled={subjectsLoading || subjectsUnavailable}
            id="teacher-question-subject-filter"
            onChange={(event) => onFilterChange('subjectId', event.target.value)}
            value={filters.subjectId}
          >
            <option value="">
              {subjectsLoading
                ? t('common.loadingSubjects')
                : subjectsUnavailable
                  ? t('common.subjectsUnavailable')
                  : t('teacher.questions.filters.allSubjects')}
            </option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {formatSubjectLabel(subject)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="mb-1.5 block text-xs font-medium tracking-wide text-slate-600 uppercase dark:text-slate-400"
            htmlFor="teacher-question-type-filter"
          >
            {t('common.type')}
          </label>
          <select
            className={controlClassName}
            id="teacher-question-type-filter"
            onChange={(event) => onFilterChange('type', event.target.value)}
            value={filters.type}
          >
            <option value="">{t('teacher.questions.filters.allTypes')}</option>
            {QUESTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {t(type.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="mb-1.5 block text-xs font-medium tracking-wide text-slate-600 uppercase dark:text-slate-400"
            htmlFor="teacher-question-difficulty-filter"
          >
            {t('common.difficulty')}
          </label>
          <select
            className={controlClassName}
            id="teacher-question-difficulty-filter"
            onChange={(event) => onFilterChange('difficulty', event.target.value)}
            value={filters.difficulty}
          >
            <option value="">{t('teacher.questions.filters.allDifficulties')}</option>
            {QUESTION_DIFFICULTIES.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {t(difficulty.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 xl:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            disabled={!hasFilters}
            onClick={onClear}
            type="button"
          >
            {t('teacher.questions.filters.clear')}
          </button>
        </div>
      </div>

      {filters.search ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('teacher.questions.filters.showingMatches', { search: filters.search })}
        </p>
      ) : null}
    </div>
  )
}
