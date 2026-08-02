export function SubmitButton({ children, isLoading, loadingLabel }) {
  return (
    <button
      className="bg-brand-500 hover:bg-brand-400 focus-visible:outline-brand-400 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-950/30 transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isLoading}
      type="submit"
    >
      {isLoading ? (
        <>
          <span
            aria-hidden="true"
            className="mr-2 size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
