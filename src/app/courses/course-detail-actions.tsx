type CourseDetailActionsProps = {
  enrollmentStatus: "available" | "enrolled" | "completed";
  enrolling: boolean;
  completing: boolean;
  actionError: string | null;
  onEnroll: () => void;
  onComplete: () => void;
};

export function CourseDetailActions({
  enrollmentStatus,
  enrolling,
  completing,
  actionError,
  onEnroll,
  onComplete,
}: CourseDetailActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {actionError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
      ) : null}

      {enrollmentStatus === "available" ? (
        <button
          type="button"
          onClick={onEnroll}
          disabled={enrolling}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {enrolling ? "Enrolling…" : "Enroll in course"}
        </button>
      ) : null}

      {enrollmentStatus === "enrolled" ? (
        <>
          <button
            type="button"
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Continue learning
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={completing}
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-300 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {completing ? "Saving…" : "Mark course complete"}
          </button>
        </>
      ) : null}

      {enrollmentStatus === "completed" ? (
        <div className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          Completed
        </div>
      ) : null}
    </div>
  );
}
