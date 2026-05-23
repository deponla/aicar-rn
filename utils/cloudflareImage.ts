export function extractCloudflareImageId(photoUrl: string): string | null {
  const match = photoUrl.match(/\/images\/([^/]+)\//i);
  return match?.[1] ?? null;
}
