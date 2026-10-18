import { RefObject, useEffect } from 'react';

/** Contain modal interaction and restore the opener when the dialog unmounts. */
export function useDialogFocus(
  dialogRef: RefObject<HTMLElement>,
  initialFocusRef: RefObject<HTMLElement>
): void {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const opener = document.activeElement as HTMLElement | null;
    const background: Array<{ element: Element; inert: string | null }> = [];

    // The dialogs are nested in routed content. Make siblings inert at every
    // ancestor level so neither pointer nor assistive navigation escapes them.
    let ancestor: Element = dialog;
    while (ancestor.parentElement && ancestor !== document.body) {
      for (const sibling of Array.from(ancestor.parentElement.children)) {
        if (sibling !== ancestor) {
          background.push({ element: sibling, inert: sibling.getAttribute('inert') });
          sibling.setAttribute('inert', '');
        }
      }
      ancestor = ancestor.parentElement;
    }
    initialFocusRef.current?.focus();
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) {
        (initialFocusRef.current ?? dialog).focus();
      }
    };
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('focusin', containFocus);
      background.forEach(({ element, inert }) => {
        if (inert === null) element.removeAttribute('inert');
        else element.setAttribute('inert', inert);
      });
      if (opener?.isConnected) opener.focus();
    };
  }, [dialogRef, initialFocusRef]);
}
