/**
 * SiteTabs — Webflow `w-tabs` (guide 2.8).
 * Source: reference/components/tabs.html (tab-link---location pattern).
 * Base UI Tabs manages selection — no useEffect.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TabItem {
  value: string;
  label: string;
  content: string;
}

export default function SiteTabs({ items }: { items: TabItem[] }) {
  return (
    <Tabs defaultValue={items[0]?.value} className="w-full">
      <TabsList className="mb-6 flex flex-wrap gap-2">
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} className="rounded-full px-5 py-2">
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="text-base leading-[1.5em] text-neutral-600">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
