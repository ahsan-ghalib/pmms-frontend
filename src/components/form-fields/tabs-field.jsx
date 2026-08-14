import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function TabsField({ tabs = [], defaultValue, activeTab, onTabChange }) {
  if (!tabs.length) return null;
  
  // Use controlled behavior if activeTab and onTabChange are provided
  const isControlled = activeTab !== undefined && onTabChange !== undefined;
  
  return (
    <div className="flex w-full max-w-auto flex-col gap-6">
      <Tabs 
        value={isControlled ? activeTab : undefined}
        defaultValue={!isControlled ? (defaultValue || tabs[0].value) : undefined}
        onValueChange={isControlled ? onTabChange : undefined}
      >
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
