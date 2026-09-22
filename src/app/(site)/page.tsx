import { CategoryChips } from "@/components/cattube/category-chips";
import { VideoGrid } from "@/components/cattube/video-grid";
import { ALL_CATEGORY, listCategories, listFeedVideos } from "@/lib/catalog";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const categoryNames = await listCategories();
  const categoryParam = first(params.category);
  const selected =
    categoryParam && categoryNames.includes(categoryParam)
      ? categoryParam
      : ALL_CATEGORY;
  const query = first(params.q) ?? "";
  const videos = await listFeedVideos({
    category: selected,
    q: query,
    queryEmbedding: await embedSearchQuery(query),
  });

  return (
    <main className="min-h-full w-full px-4 pt-3 pb-12 sm:px-6 xl:pr-8">
      <h1 className="sr-only">CatTube home</h1>
      <CategoryChips categories={categoryNames} selected={selected} query={query} />
      <div className="mt-4">
        <VideoGrid videos={videos} />
      </div>
    </main>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function embedSearchQuery(query: string) {
  if (!query.trim() || process.env.VERCEL) return null;
  try {
    const { embedQuery } = await import("@/lib/clip-embed");
    return await embedQuery(query);
  } catch (error) {
    console.error("CLIP query embedding failed", error);
    return null;
  }
}
