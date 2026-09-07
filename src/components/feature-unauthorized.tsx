type FeatureUnauthorizedProps = {
  title?: string;
  message: string;
};

export function FeatureUnauthorized({
  title = "Not authorized",
  message,
}: FeatureUnauthorizedProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}
