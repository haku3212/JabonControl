import { ReactNode, useState } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  return (
    <div>
      {/* Los tabs pueden desplazarse horizontalmente en movil para no encimar texto. */}
      <div className="flex gap-0 border-b border-dark-border mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-accent-yellow text-accent-yellow'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{activeContent}</div>
    </div>
  );
}
