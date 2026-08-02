import { QUESTION_DIFFICULTIES, QUESTION_TYPES } from '../../../utils/teacherQuestionValidation.js'

const controlClassName =
  'focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-sm text-white transition outline-none placeholder:text-slate-600 focus:ring-4'

export function QuestionFilters({
  filters,
  onClear,
  onFilterChange,
  onSearch,
  searchDraft,
  setSearchDraft,
  subjectIds,
}) {
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
            Search question text
          </label>
          <input
            className={controlClassName}
            id="teacher-question-search"
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search question text"
            type="search"
            value={searchDraft}
          />
        </div>
        <button
          className="bg-brand-500 hover:bg-brand-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <div>
          <label
            className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase"
            htmlFor="teacher-question-subject-filter"
          >
            Subject ID
          </label>
          <input
            autoComplete="off"
            className={controlClassName}
            id="teacher-question-subject-filter"
            list="teacher-question-filter-subjects"
            maxLength={100}
            onChange={(event) => onFilterChange('subjectId', event.target.value)}
            placeholder="All subjects"
            value={filters.subjectId}
          />
          <datalist id="teacher-question-filter-subjects">
            {subjectIds.map((subjectId) => (
              <option key={subjectId} value={subjectId} />
            ))}
          </datalist>
        </div>

        <div>
          <label
            className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase"
            htmlFor="teacher-question-type-filter"
          >
            Type
          </label>
          <select
            className={controlClassName}
            id="teacher-question-type-filter"
            onChange={(event) => onFilterChange('type', event.target.value)}
            value={filters.type}
          >
            <option value="">All types</option>
            {QUESTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase"
            htmlFor="teacher-question-difficulty-filter"
          >
            Difficulty
          </label>
          <select
            className={controlClassName}
            id="teacher-question-difficulty-filter"
            onChange={(event) => onFilterChange('difficulty', event.target.value)}
            value={filters.difficulty}
          >
            <option value="">All difficulties</option>
            {QUESTION_DIFFICULTIES.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            className="w-full rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 xl:w-auto"
            disabled={!hasFilters}
            onClick={onClear}
            type="button"
          >
            Clear filters
          </button>
        </div>
      </div>

      {filters.search ? (
        <p className="text-sm text-slate-400">
          Showing text matches for{' '}
          <span className="font-medium text-slate-200">“{filters.search}”</span>.
        </p>
      ) : null}
    </div>
  )
}
