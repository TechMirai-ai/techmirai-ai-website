/**
 * Runs a database-backed generateStaticParams loader. If the database cannot be
 * reached at build time (e.g. ETIMEDOUT from the build host) it returns [] so the
 * build does not fail; with dynamicParams = true those pages render on first
 * request and are cached by revalidate instead.
 */
export async function staticParamsOrEmpty<T>(
  label: string,
  load: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await load()
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error)
    console.warn(`[static-params] ${label}: database unavailable at build time, skipping prerender (${reason})`)
    return []
  }
}
