/**
 * Reusable Base UI tabs: original Webflow process labels and image panels.
 * Selection is managed by Base UI; no React effects or Webflow runtime.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TabItem {
  value: string;
  label: string;
  content: string;
  image?: string;
}

export default function SiteTabs({ items }: { items: TabItem[] }) {
  const hasImages = items.some((item) => Boolean(item.image));

  return (
    <Tabs defaultValue={items[0]?.value} className="w-full">
      <div className={hasImages ? "grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]" : "w-full"}>
        <TabsList className={hasImages ? "flex h-auto w-full flex-col items-stretch gap-3 bg-transparent p-0" : "mb-6 flex flex-wrap gap-2"}>
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className={hasImages
                ? "w-full justify-start rounded-2xl border border-neutral-300 bg-neutral-100 px-6 py-5 text-left text-xl font-medium whitespace-normal text-neutral-800 data-active:border-brand-primary data-active:bg-brand-secondary-200 sm:text-2xl"
                : "rounded-full px-5 py-2"}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="min-w-0">
          {items.map((item) => (
            <TabsContent key={item.value} value={item.value} className="mt-0 text-base leading-[1.5] text-neutral-600">
              {item.image && (
                <img
                  src={item.image}
                  alt={"Project process: " + item.label}
                  width={760}
                  height={598}
                  loading="lazy"
                  className="mb-6 aspect-[760/598] w-full rounded-3xl object-cover"
                />
              )}
              <p>{item.content}</p>
            </TabsContent>
          ))}
        </div>
      </div>
    </Tabs>
  );
}
