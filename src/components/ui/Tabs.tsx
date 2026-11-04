import React, { useId, useRef, useState } from 'react';

import './Tabs.css';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  /** Initially active tab (uncontrolled). Defaults to the first enabled tab. */
  defaultTabId?: string;
  /** Active tab (controlled). */
  activeTabId?: string;
  onChange?: (tabId: string) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * WAI-ARIA tabs with automatic activation: arrow keys move focus and select,
 * Home/End jump to the first/last enabled tab, and disabled tabs are skipped.
 * Only the active tab is in the tab order (roving tabindex).
 */
const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  activeTabId,
  onChange,
  ariaLabel,
  className,
}) => {
  const baseId = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isControlled = activeTabId !== undefined;
  const firstEnabled = tabs.find(tab => !tab.disabled);
  const [internalActive, setInternalActive] = useState<string | undefined>(
    defaultTabId ?? firstEnabled?.id
  );
  const activeId = isControlled ? activeTabId : internalActive;
  const activeTab = tabs.find(tab => tab.id === activeId) ?? firstEnabled;

  const activate = (tab: TabItem, focus = false) => {
    if (tab.disabled) return;
    if (!isControlled) {
      setInternalActive(tab.id);
    }
    onChange?.(tab.id);
    if (focus) {
      const index = tabs.indexOf(tab);
      tabRefs.current[index]?.focus();
    }
  };

  const enabledTabs = tabs.filter(tab => !tab.disabled);

  const handleKeyDown = (event: React.KeyboardEvent, current: TabItem) => {
    const position = enabledTabs.indexOf(current);
    if (position === -1) return;
    let next: TabItem | undefined;
    switch (event.key) {
      case 'ArrowRight':
        next = enabledTabs[(position + 1) % enabledTabs.length];
        break;
      case 'ArrowLeft':
        next = enabledTabs[(position - 1 + enabledTabs.length) % enabledTabs.length];
        break;
      case 'Home':
        next = enabledTabs[0];
        break;
      case 'End':
        next = enabledTabs[enabledTabs.length - 1];
        break;
      default:
        return;
    }
    if (next) {
      event.preventDefault();
      activate(next, true);
    }
  };

  if (!activeTab) {
    return null;
  }

  const classes = ['cm-tabs', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="cm-tabs-list" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab, index) => {
          const selected = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              ref={el => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              aria-disabled={tab.disabled || undefined}
              disabled={tab.disabled}
              tabIndex={selected ? 0 : -1}
              className="cm-tabs-tab"
              onClick={() => activate(tab)}
              onKeyDown={event => handleKeyDown(event, tab)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeTab.id}`}
        aria-labelledby={`${baseId}-tab-${activeTab.id}`}
        className="cm-tabs-panel"
      >
        {activeTab.content}
      </div>
    </div>
  );
};

export default Tabs;
