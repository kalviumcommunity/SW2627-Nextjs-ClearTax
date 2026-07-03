export async function useFetch(url: string) {
  const res = await fetch(url);
  return res.json();
}
