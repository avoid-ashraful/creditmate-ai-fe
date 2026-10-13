// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toBeInTheDocument();
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

/**
 * Handle React.lazy components in tests by resolving them synchronously.
 * This replaces the dynamic import with a component that immediately renders
 * the resolved module.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(React as any).lazy = (importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
  // In tests, resolve the import immediately
  const module = importFn();
  if (module && typeof module.then === 'function') {
    // It's a promise, return a component that renders the resolved module
    const TestComponent = (props: any) => {
      const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
      React.useEffect(() => {
        module.then((resolved: { default: React.ComponentType<any> }) => {
          setComponent(() => resolved.default);
        });
      }, []);
      return Component ? React.createElement(Component, props) : null;
    };
    TestComponent.displayName = 'TestLazyComponent';
    return TestComponent;
  }
  // It's already resolved
  return importFn;
};
