import {ScalingCellSizeAndPositionManager} from "./utils/ScalingCellSizeAndPositionManager";

export type Alignment = "auto" | "end" | "start" | "center";
export type CellRenderer = (props: CellRendererParams) => REACT_ELEMENT;

export type CellRendererParams = {
  columnIndex: number;
  isScrolling: boolean;
  isVisible: boolean;
  key: string;
  parent: Object;
  rowIndex: number;
  style: Object;
};

export type VisibleCellRange = {
  start?: number;
  stop?: number;
};

type REACT_ELEMENT = any;

export type CellSize = CellSizeGetter | number;

export type CellSizeGetter = (params: { index: number }) => number;

export type CellRangeRenderer = (
  params: CellRangeRendererParams
) => REACT_ELEMENT[];

type DeferredMeasurementCache = any;

export type CellRangeRendererParams = {
  
  cellCache: CellCache;
  cellRenderer: CellRenderer;
  columnSizeAndPositionManager: ScalingCellSizeAndPositionManager;
  columnStartIndex: number;
  columnStopIndex: number;
  deferredMeasurementCache?: DeferredMeasurementCache;
  horizontalOffsetAdjustment: number;
  isScrolling: boolean;
  isScrollingOptOut: boolean;
  parent?: Object;
  rowSizeAndPositionManager: ScalingCellSizeAndPositionManager;
  rowStartIndex: number;
  rowStopIndex: number;
  scrollLeft: number;
  scrollTop: number;
  styleCache: StyleCache;
  verticalOffsetAdjustment: number;
  visibleColumnIndices: {
    start: number;
    stop: number;
  };
  visibleRowIndices: {
    start: number;
    stop: number;
  };
};

export type ScrollbarPresenceChange = {
  horizontal: boolean;
  vertical: boolean;
  size: number;
};

export type Scroll = {
  clientHeight: number;
  clientWidth: number;
  scrollHeight: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
};

export type RenderedSection = {
  columnOverscanStartIndex: number;
  columnOverscanStopIndex: number;
  columnStartIndex: number;
  columnStopIndex: number;
  rowOverscanStartIndex: number;
  rowOverscanStopIndex: number;
  rowStartIndex: number;
  rowStopIndex: number;
};

export type NoContentRenderer = () => REACT_ELEMENT | null;

export type StyleCache = { [key: string]: Object };
export type CellCache = { [key: string]: REACT_ELEMENT };

export type OverscanIndicesGetterParams = {
  // One of SCROLL_DIRECTION_HORIZONTAL or SCROLL_DIRECTION_VERTICAL
  direction: "horizontal" | "vertical";

  // One of SCROLL_DIRECTION_BACKWARD or SCROLL_DIRECTION_FORWARD
  scrollDirection: -1 | 1;

  // Number of rows or columns in the current axis
  cellCount: number;

  // Maximum number of cells to over-render in either direction
  overscanCellsCount: number;

  // Begin of range of visible cells
  startIndex: number;

  // End of range of visible cells
  stopIndex: number;
};

export type OverscanIndices = {
  overscanStartIndex: number;
  overscanStopIndex: number;
};

export type OverscanIndicesGetter = (
  params: OverscanIndicesGetterParams
) => OverscanIndices;

export type CellPosition = {columnIndex?: number, rowIndex?: number};

export type Props = {
  ariaLabel?: string;
  ariaReadonly?: boolean;

  /**
   * Set the width of the inner scrollable container to 'auto'.
   * This is useful for single-column Grids to ensure that the column doesn't extend below a vertical scrollbar.
   */
  autoContainerWidth?: boolean;

  /**
   * Removes fixed height from the scrollingContainer so that the total height of rows can stretch the window.
   * Intended for use with WindowScroller
   */
  autoHeight?: boolean;

  /**
   * Removes fixed width from the scrollingContainer so that the total width of rows can stretch the window.
   * Intended for use with WindowScroller
   */
  autoWidth?: boolean;

  /** Responsible for rendering a cell given an row and column index.  */
  cellRenderer: CellRenderer;

  /** Responsible for rendering a group of cells given their index ranges.  */
  cellRangeRenderer?: CellRangeRenderer;

  /** Optional custom CSS class name to attach to root Grid element.  */
  className?: string;

  /** Number of columns in grid.  */
  columnCount: number;

  /** Either a fixed column width (number) or a function that returns the width of a column given its index.  */
  columnWidth: CellSize;

  /** Unfiltered props for the Grid container. */
  containerProps?: Object;

  /** ARIA role for the cell-container.  */
  containerRole?: string;

  /** Optional inline style applied to inner cell-container */
  containerStyle?: Object;

  /**
   * If CellMeasurer is used to measure this Grid's children, this should be a pointer to its CellMeasurerCache.
   * A shared CellMeasurerCache reference enables Grid and CellMeasurer to share measurement data.
   */
  deferredMeasurementCache?: DeferredMeasurementCache;

  /**
   * Used to estimate the total width of a Grid before all of its columns have actually been measured.
   * The estimated total width is adjusted as columns are rendered.
   */
  estimatedColumnSize?: number;

  /**
   * Used to estimate the total height of a Grid before all of its rows have actually been measured.
   * The estimated total height is adjusted as rows are rendered.
   */
  estimatedRowSize?: number;

  /** Exposed for testing purposes only.  */
  getScrollbarSize?: () => number;

  /** Height of Grid; this property determines the number of visible (vs virtualized) rows.  */
  height: number;

  /** Optional custom id to attach to root Grid element.  */
  id?: string;

  /**
   * Override internal is-scrolling state tracking.
   * This property is primarily intended for use with the WindowScroller component.
   */
  isScrolling?: boolean;

  /**
   * Opt-out of isScrolling param passed to cellRangeRenderer.
   * To avoid the extra render when scroll stops.
   */
  isScrollingOptOut?: boolean;

  /** Optional renderer to be used in place of rows when either :rowCount or :columnCount is 0.  */
  noContentRenderer?: NoContentRenderer;

  /**
   * Callback invoked whenever the scroll offset changes within the inner scrollable region.
   * This callback can be used to sync scrolling between lists, tables, or grids.
   */
  onScroll?: (params: Scroll) => void;

  /**
   * Called whenever a horizontal or vertical scrollbar is added or removed.
   * This prop is not intended for end-user use;
   * It is used by MultiGrid to support fixed-row/fixed-column scroll syncing.
   */
  onScrollbarPresenceChange?: (params: ScrollbarPresenceChange) => void;

  /** Callback invoked with information about the section of the Grid that was just rendered.  */
  onSectionRendered?: (params: RenderedSection) => void;

  /**
   * Number of columns to render before/after the visible section of the grid.
   * These columns can help for smoother scrolling on touch devices or browsers that send scroll events infrequently.
   */
  overscanColumnCount?: number;

  /**
   * Calculates the number of cells to overscan before and after a specified range.
   * This function ensures that overscanning doesn't exceed the available cells.
   */
  overscanIndicesGetter?: OverscanIndicesGetter;

  /**
   * Number of rows to render above/below the visible section of the grid.
   * These rows can help for smoother scrolling on touch devices or browsers that send scroll events infrequently.
   */
  overscanRowCount?: number;

  /** ARIA role for the grid element.  */
  role?: string;

  /**
   * Either a fixed row height (number) or a function that returns the height of a row given its index.
   * Should implement the following interface: ({ index: number }): number
   */
  rowHeight: CellSize;

  /** Number of rows in grid.  */
  rowCount: number;

  /** Wait this amount of time after the last scroll event before resetting Grid `pointer-events`. */
  scrollingResetTimeInterval?: number;

  /** Horizontal offset. */
  scrollLeft?: number;

  /**
   * Controls scroll-to-cell behavior of the Grid.
   * The default ("auto") scrolls the least amount possible to ensure that the specified cell is fully visible.
   * Use "start" to align cells to the top/left of the Grid and "end" to align bottom/right.
   */
  scrollToAlignment?: Alignment;

  /** Column index to ensure visible (by forcefully scrolling if necessary) */
  scrollToColumn?: number;

  /** Vertical offset. */
  scrollTop?: number;

  /** Row index to ensure visible (by forcefully scrolling if necessary) */
  scrollToRow?: number;

  /** Optional inline style */
  style?: Object;

  /** Tab index for focus */
  tabIndex?: number;

  /** Width of Grid; this property determines the number of visible (vs virtualized) columns.  */
  width: number;
};


export type InstanceProps = {
  prevColumnWidth: CellSize,
  prevRowHeight: CellSize,

  prevColumnCount: number,
  prevRowCount: number,
  prevIsScrolling: boolean,
  prevScrollToColumn: number,
  prevScrollToRow: number,

  columnSizeAndPositionManager: ScalingCellSizeAndPositionManager,
  rowSizeAndPositionManager: ScalingCellSizeAndPositionManager,

  scrollbarSize: number,
  scrollbarSizeMeasured: boolean,
};

export type State = {
  instanceProps: InstanceProps,
  isScrolling: boolean,
  scrollDirectionHorizontal: -1 | 1,
  scrollDirectionVertical: -1 | 1,
  scrollLeft: number,
  scrollTop: number,
  scrollPositionChangeReason: 'observed' | 'requested' | null,
  needToResetStyleCache: boolean,
};

export type AnimationTimeoutId = {
  id: number,
};