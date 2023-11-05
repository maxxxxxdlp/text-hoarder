/**
 * Based on the element that is currently at the top of the viewport, find the
 * equivalent element in simple document, and scroll to it
 */
const id = 'text-hoarder-current-position-element';
export function scrollToMatchingNode():
  | undefined
  | (() => (containerElement: Element, mode: 'smooth' | 'instant') => void) {
  const node = getTextNearTopOfViewport();
  const element =
    node instanceof Element ? node : node?.parentElement ?? undefined;

  if (element === undefined) return undefined;

  const previousId = element.getAttribute('id') ?? undefined;
  const markerId = previousId || id;
  element.setAttribute('id', markerId);
  const restoreId = (element: Element): void =>
    previousId === undefined
      ? element.removeAttribute('id')
      : element.setAttribute('id', previousId);

  // Could probably have used a yield here, but this seems more commonplace
  return () => {
    restoreId(element);

    return (containerElement, mode): void => {
      // LOW: only scroll down if element is more than 1 screen down?
      const markedElement = containerElement.querySelector(
        `#${escapeUnsafeId(markerId)}`,
      );
      if (markedElement !== null) restoreId(markedElement);
      markedElement?.scrollIntoView({
        behavior: mode,
        block: 'center',
      });
    };
  };
}

function getTextNearTopOfViewport(): Node | undefined {
  // Middle of the screen width
  const x = window.innerWidth / 2;
  // A small offset from the top of the viewport (enough to account for sticky menus)
  const y = window.innerHeight * 0.4;

  if (document.caretPositionFromPoint)
    return document.caretPositionFromPoint(x, y).offsetNode;
  else if (document.caretRangeFromPoint)
    return document.caretRangeFromPoint(x, y)?.startContainer;
  else return undefined;
}

const escapeUnsafeId = (id: string): string => id.replace(/([^\w-])/g, '\\$1');
