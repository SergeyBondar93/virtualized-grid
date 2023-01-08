/**
 * Controls whether the Grid updates the DOM element's scrollLeft/scrollTop based on the current state or just observes it.
 * This prevents Grid from interrupting mouse-wheel animations (see issue #2).
 */
export const SCROLL_POSITION_CHANGE_REASONS = {
    OBSERVED: 'observed',
    REQUESTED: 'requested',
  } as const;

  export const SCROLL_DIRECTION_BACKWARD = -1;
export const SCROLL_DIRECTION_FORWARD = 1;

export const SCROLL_DIRECTION_HORIZONTAL = 'horizontal';
export const SCROLL_DIRECTION_VERTICAL = 'vertical';