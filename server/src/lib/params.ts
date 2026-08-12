export function routeParam(req: { params: unknown }, key: string): string {
  const value = (req.params as Record<string, string | undefined>)[key]
  if (!value) throw new Error(`Missing route param: ${key}`)
  return value
}
