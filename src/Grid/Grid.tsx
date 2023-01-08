import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import scrollbarSize from "dom-helpers/scrollbarSize";

import { defaultCellRangeRenderer } from "./defaultCellRangeRenderer";
import {
  AnimationTimeoutId,
  CellPosition,
  CellSize,
  NoContentRenderer,
  Props,
  State,
} from "./types";
import {
  defaultOverscanIndicesGetter,
  SCROLL_DIRECTION_FORWARD,
} from "./defaultOverscanIndicesGetter";
import {
  ScalingCellSizeAndPositionManager,
  _getEstimatedColumnSize,
  _getEstimatedRowSize,
  _getScrollLeftForScrollToColumnStateUpdate,
  _getScrollTopForScrollToRowStateUpdate,
  _getScrollToPositionStateUpdate,
  _wrapSizeGetter,
  cancelAnimationTimeout,
  requestAnimationTimeout,
  SCROLL_DIRECTION_BACKWARD,
  SCROLL_POSITION_CHANGE_REASONS,
  useForceUpdate,
  createCallbackMemoizer,
} from "./utils";

type ScrollPosition = {
  scrollTop?: number;
  scrollLeft?: number;
};
/**
 * Specifies the number of milliseconds during which to disable pointer events while a scroll is in progress.
 * This improves performance and makes scrolling smoother.
 */
export const DEFAULT_SCROLLING_RESET_TIME_INTERVAL = 150;
const renderNull: NoContentRenderer = () => null;
export const Grid = ({
  ariaLabel = "grid",
  ariaReadonly = true,
  autoContainerWidth = false,
  autoHeight = false,
  autoWidth = false,
  cellRangeRenderer = defaultCellRangeRenderer,
  containerRole = "row",
  containerStyle = {},
  estimatedColumnSize = 100,
  estimatedRowSize = 30,
  getScrollbarSize = scrollbarSize,
  noContentRenderer = renderNull,
  onScroll = () => {},
  onScrollbarPresenceChange = () => {},
  onSectionRendered = () => {},
  overscanColumnCount = 0,
  overscanIndicesGetter = defaultOverscanIndicesGetter,
  overscanRowCount = 10,
  role = "grid",
  scrollingResetTimeInterval = DEFAULT_SCROLLING_RESET_TIME_INTERVAL,
  scrollToAlignment = "auto",
  scrollToColumn = -1,
  scrollToRow = -1,
  style = {},
  tabIndex = 0,
  isScrollingOptOut = false,
  columnWidth,
  rowHeight,
  columnCount,
  rowCount,
  isScrolling,
  height,
  scrollLeft,
  scrollTop,
  width,
  cellRenderer,
  deferredMeasurementCache,
  containerProps,
}: Props) => {
  const forceUpdate = useForceUpdate();

  /**
   * TODO сделать
   */
  const _initialScrollTop = useRef(0);
  const _initialScrollLeft = useRef(0);

  const _recomputeScrollLeftFlag = useRef(false);
  const _recomputeScrollTopFlag = useRef(false);

  const _scrollbarPresenceChanged = useRef(false);

  const _styleCache = useRef({});
  const _cellCache = useRef({});

  const _deferredInvalidateColumnIndex = useRef(null);
  const _deferredInvalidateRowIndex = useRef(null);

  const _columnStartIndex = useRef<number | null>(null);
  const _columnStopIndex = useRef<number | null>(null);
  const _rowStartIndex = useRef<number | null>(null);
  const _rowStopIndex = useRef<number | null>(null);
  const _renderedColumnStartIndex = useRef(0);
  const _renderedColumnStopIndex = useRef(0);
  const _renderedRowStartIndex = useRef(0);
  const _renderedRowStopIndex = useRef(0);

  const _horizontalScrollBarSize = useRef(0);
  const _verticalScrollBarSize = useRef(0);
  const _disablePointerEventsTimeoutId = useRef<AnimationTimeoutId | any>(null);
  const _onGridRenderedMemoizer = useRef(createCallbackMemoizer());
  const _onScrollMemoizer = useRef(createCallbackMemoizer(false));

  const _debounceScrollEndedCallback = useCallback(() => {
    _disablePointerEventsTimeoutId.current = null;
    // isScrolling is used to determine if we reset styleCache
    setState((prevState) => ({
      ...prevState,
      isScrolling: false,
      needToResetStyleCache: false,
    }));
  }, []);

  /**
   * Sets an :isScrolling flag for a small window of time.
   * This flag is used to disable pointer events on the scrollable portion of the Grid.
   * This prevents jerky/stuttery mouse-wheel scrolling.
   */
  const _debounceScrollEnded = useCallback(() => {
    if (_disablePointerEventsTimeoutId.current) {
      cancelAnimationTimeout(_disablePointerEventsTimeoutId.current);
    }

    _disablePointerEventsTimeoutId.current = requestAnimationTimeout(
      _debounceScrollEndedCallback,
      scrollingResetTimeInterval
    );
  }, [scrollingResetTimeInterval, _debounceScrollEndedCallback]);

  const [state, setState] = useState<State>(() => {
    const columnSizeAndPositionManager = new ScalingCellSizeAndPositionManager({
      cellCount: columnCount,
      cellSizeGetter: (params) => _wrapSizeGetter(columnWidth)(params),
      estimatedCellSize: _getEstimatedColumnSize({
        columnWidth,
        estimatedColumnSize,
      }),
    });
    const rowSizeAndPositionManager = new ScalingCellSizeAndPositionManager({
      cellCount: rowCount,
      cellSizeGetter: (params) => _wrapSizeGetter(rowHeight)(params),
      estimatedCellSize: _getEstimatedRowSize({ rowHeight, estimatedRowSize }),
    });

    return {
      instanceProps: {
        columnSizeAndPositionManager,
        rowSizeAndPositionManager,

        prevColumnWidth: columnWidth,
        prevRowHeight: rowHeight,
        prevColumnCount: columnCount,
        prevRowCount: rowCount,
        prevIsScrolling: isScrolling === true,
        prevScrollToColumn: scrollToColumn,
        prevScrollToRow: scrollToRow,

        scrollbarSize: 0,
        scrollbarSizeMeasured: false,
      },
      isScrolling: false,
      scrollDirectionHorizontal: SCROLL_DIRECTION_FORWARD,
      scrollDirectionVertical: SCROLL_DIRECTION_FORWARD,
      scrollLeft: 0,
      scrollTop: 0,
      scrollPositionChangeReason: null,

      needToResetStyleCache: false,
    };
  });

  const _invokeOnScrollMemoizer = ({
    scrollLeft,
    scrollTop,
    totalColumnsWidth,
    totalRowsHeight,
  }: {
    scrollLeft: number;
    scrollTop: number;
    totalColumnsWidth: number;
    totalRowsHeight: number;
  }) => {
    _onScrollMemoizer.current({
      callback: ({ scrollLeft, scrollTop }: any) => {
        onScroll({
          clientHeight: height,
          clientWidth: width,
          scrollHeight: totalRowsHeight,
          scrollLeft,
          scrollTop,
          scrollWidth: totalColumnsWidth,
        });
      },
      indices: {
        scrollLeft,
        scrollTop,
      },
    });
  };

  /**
   * This method handles a scroll event originating from an external scroll control.
   * It's an advanced method and should probably not be used unless you're implementing a custom scroll-bar solution.
   */
  const handleScrollEvent = useCallback(
    ({
      scrollLeft: scrollLeftParam = 0,
      scrollTop: scrollTopParam = 0,
    }: ScrollPosition) => {
      // On iOS, we can arrive at negative offsets by swiping past the start.
      // To prevent flicker here, we make playing in the negative offset zone cause nothing to happen.
      if (scrollTopParam < 0) {
        return;
      }

      // Prevent pointer events from interrupting a smooth scroll
      _debounceScrollEnded();

      const { instanceProps } = state;

      // When this component is shrunk drastically, React dispatches a series of back-to-back scroll events,
      // Gradually converging on a scrollTop that is within the bounds of the new, smaller height.
      // This causes a series of rapid renders that is slow for long lists.
      // We can avoid that by doing some simple bounds checking to ensure that scroll offsets never exceed their bounds.
      const scrollbarSize = instanceProps.scrollbarSize;
      const totalRowsHeight =
        instanceProps.rowSizeAndPositionManager.getTotalSize();
      const totalColumnsWidth =
        instanceProps.columnSizeAndPositionManager.getTotalSize();
      const scrollLeft = Math.min(
        Math.max(0, totalColumnsWidth - width + scrollbarSize),
        scrollLeftParam
      );
      const scrollTop = Math.min(
        Math.max(0, totalRowsHeight - height + scrollbarSize),
        scrollTopParam
      );

      // Certain devices (like Apple touchpad) rapid-fire duplicate events.
      // Don't force a re-render if this is the case.
      // The mouse may move faster then the animation frame does.
      // Use requestAnimationFrame to avoid over-updating.
      if (state.scrollLeft !== scrollLeft || state.scrollTop !== scrollTop) {
        // Track scrolling direction so we can more efficiently overscan rows to reduce empty space around the edges while scrolling.
        // Don't change direction for an axis unless scroll offset has changed.
        const scrollDirectionHorizontal =
          scrollLeft !== state.scrollLeft
            ? scrollLeft > state.scrollLeft
              ? SCROLL_DIRECTION_FORWARD
              : SCROLL_DIRECTION_BACKWARD
            : state.scrollDirectionHorizontal;
        const scrollDirectionVertical =
          scrollTop !== state.scrollTop
            ? scrollTop > state.scrollTop
              ? SCROLL_DIRECTION_FORWARD
              : SCROLL_DIRECTION_BACKWARD
            : state.scrollDirectionVertical;

        const newState: State = {
          ...state,
          isScrolling: true,
          scrollDirectionHorizontal,
          scrollDirectionVertical,
          scrollPositionChangeReason: SCROLL_POSITION_CHANGE_REASONS.OBSERVED,
        };

        if (!autoHeight) {
          newState.scrollTop = scrollTop;
        }

        if (!autoWidth) {
          newState.scrollLeft = scrollLeft;
        }

        newState.needToResetStyleCache = false;
        setState(newState);
      }

      _invokeOnScrollMemoizer({
        scrollLeft,
        scrollTop,
        totalColumnsWidth,
        totalRowsHeight,
      });
    },
    [
      state,
      _debounceScrollEnded,
      autoHeight,
      autoWidth,
      height,
      width,
      _invokeOnScrollMemoizer,
    ]
  );
  const _onScroll = useCallback(
    (event: Event | any) => {
      // In certain edge-cases React dispatches an onScroll event with an invalid target.scrollLeft / target.scrollTop.
      // This invalid event can be detected by comparing event.target to this component's scrollable DOM element.
      // See issue #404 for more information.
      if (event.target === _scrollingContainerRef.current) {
        handleScrollEvent(event.target);
      }
    },
    [handleScrollEvent]
  );

  const _scrollingContainerRef = useRef<HTMLDivElement>(null);

  const recomputeGridSize = useCallback(
    ({ columnIndex = 0, rowIndex = 0 }: CellPosition = {}) => {
      const { instanceProps } = state;

      instanceProps.columnSizeAndPositionManager.resetCell(columnIndex);
      instanceProps.rowSizeAndPositionManager.resetCell(rowIndex);

      // Cell sizes may be determined by a function property.
      // In this case the cDU handler can't know if they changed.
      // Store this flag to let the next cDU pass know it needs to recompute the scroll offset.
      _recomputeScrollLeftFlag.current =
        scrollToColumn >= 0 &&
        (state.scrollDirectionHorizontal === SCROLL_DIRECTION_FORWARD
          ? columnIndex <= scrollToColumn
          : columnIndex >= scrollToColumn);
      _recomputeScrollTopFlag.current =
        scrollToRow >= 0 &&
        (state.scrollDirectionVertical === SCROLL_DIRECTION_FORWARD
          ? rowIndex <= scrollToRow
          : rowIndex >= scrollToRow);

      // Clear cell cache in case we are scrolling;
      // Invalid row heights likely mean invalid cached content as well.
      _styleCache.current = {};
      _cellCache.current = {};

      forceUpdate();
    },
    [
      state.instanceProps,
      state.scrollDirectionHorizontal,
      state.scrollDirectionVertical,
      scrollToRow,
      forceUpdate,
    ]
  );

  const _handleInvalidatedGridSize = useCallback(() => {
    if (
      typeof _deferredInvalidateColumnIndex.current === "number" &&
      typeof _deferredInvalidateRowIndex.current === "number"
    ) {
      const columnIndex = _deferredInvalidateColumnIndex.current;
      const rowIndex = _deferredInvalidateRowIndex.current;

      _deferredInvalidateColumnIndex.current = null;
      _deferredInvalidateRowIndex.current = null;

      recomputeGridSize({ columnIndex, rowIndex });
    }
  }, [recomputeGridSize]);

  const _updateScrollLeftForScrollToColumn = useCallback(() => {
    const stateUpdate = _getScrollLeftForScrollToColumnStateUpdate(
      { columnCount, height, scrollToAlignment, scrollToColumn, width },
      state
    );
    if (stateUpdate) {
      stateUpdate.needToResetStyleCache = false;
      setState(stateUpdate);
    }
  }, [state, columnCount, height, scrollToAlignment, scrollToColumn, width]);

  const _updateScrollTopForScrollToRow = () => {
    const stateUpdate = _getScrollTopForScrollToRowStateUpdate(
      {
        height,
        rowCount,
        scrollToAlignment,
        scrollToRow,
        width,
      },
      state
    );
    if (stateUpdate) {
      stateUpdate.needToResetStyleCache = false;
      setState(stateUpdate);
    }
  };

  const _invokeOnGridRenderedHelper = useCallback(() => {
    _onGridRenderedMemoizer.current({
      callback: onSectionRendered,
      indices: {
        columnOverscanStartIndex: _columnStartIndex.current,
        columnOverscanStopIndex: _columnStopIndex.current,
        columnStartIndex: _renderedColumnStartIndex.current,
        columnStopIndex: _renderedColumnStopIndex.current,
        rowOverscanStartIndex: _rowStartIndex.current,
        rowOverscanStopIndex: _rowStopIndex.current,
        rowStartIndex: _renderedRowStartIndex.current,
        rowStopIndex: _renderedRowStopIndex.current,
      },
    });
  }, [onSectionRendered]);

  const _maybeCallOnScrollbarPresenceChange = useCallback(() => {
    if (_scrollbarPresenceChanged.current) {
      _scrollbarPresenceChanged.current = false;

      onScrollbarPresenceChange({
        horizontal: _horizontalScrollBarSize.current > 0,
        size: state.instanceProps.scrollbarSize,
        vertical: _verticalScrollBarSize.current > 0,
      });
    }
  }, [onScrollbarPresenceChange, state.instanceProps.scrollbarSize]);

  useEffect(() => {
    const { instanceProps } = state;

    // If cell sizes have been invalidated (eg we are using CellMeasurer) then reset cached positions.
    // We must do this at the start of the method as we may calculate and update scroll position below.
    _handleInvalidatedGridSize();

    // If this component was first rendered server-side, scrollbar size will be undefined.
    // In that event we need to remeasure.
    if (!instanceProps.scrollbarSizeMeasured) {
      setState((prevState) => {
        const stateUpdate = { ...prevState, needToResetStyleCache: false };
        stateUpdate.instanceProps.scrollbarSize = getScrollbarSize();
        stateUpdate.instanceProps.scrollbarSizeMeasured = true;
        return stateUpdate;
      });
    }

    if (
      (typeof scrollLeft === "number" && scrollLeft >= 0) ||
      (typeof scrollTop === "number" && scrollTop >= 0)
    ) {
      const stateUpdate = _getScrollToPositionStateUpdate({
        prevState: state,
        scrollLeft,
        scrollTop,
      });
      if (stateUpdate) {
        stateUpdate.needToResetStyleCache = false;
        setState((prevState) => ({ ...prevState, ...stateUpdate }));
      }
    }

    // refs don't work in `react-test-renderer`
    if (_scrollingContainerRef.current) {
      // setting the ref's scrollLeft and scrollTop.
      // Somehow in MultiGrid the main grid doesn't trigger a update on mount.
      if (_scrollingContainerRef.current.scrollLeft !== state.scrollLeft) {
        _scrollingContainerRef.current.scrollLeft = state.scrollLeft;
      }
      if (_scrollingContainerRef.current.scrollTop !== state.scrollTop) {
        _scrollingContainerRef.current.scrollTop = state.scrollTop;
      }
    }

    // Don't update scroll offset if the size is 0; we don't render any cells in this case.
    // Setting a state may cause us to later thing we've updated the offce when we haven't.
    const sizeIsBiggerThanZero = height > 0 && width > 0;
    if (scrollToColumn >= 0 && sizeIsBiggerThanZero) {
      _updateScrollLeftForScrollToColumn();
    }
    if (scrollToRow >= 0 && sizeIsBiggerThanZero) {
      _updateScrollTopForScrollToRow();
    }

    // Update onRowsRendered callback
    _invokeOnGridRenderedHelper();

    // Initialize onScroll callback
    _invokeOnScrollMemoizer({
      scrollLeft: scrollLeft || 0,
      scrollTop: scrollTop || 0,
      totalColumnsWidth:
        instanceProps.columnSizeAndPositionManager.getTotalSize(),
      totalRowsHeight: instanceProps.rowSizeAndPositionManager.getTotalSize(),
    });

    _maybeCallOnScrollbarPresenceChange();
  }, [
    state,
    _handleInvalidatedGridSize,
    _updateScrollLeftForScrollToColumn,
    _updateScrollTopForScrollToRow,
    _invokeOnGridRenderedHelper,
    _invokeOnScrollMemoizer,
    _maybeCallOnScrollbarPresenceChange,
  ]);

  const _resetStyleCache = useCallback(() => {
    const styleCache = _styleCache.current;
    const cellCache = _cellCache.current;

    // Reset cell and style caches once scrolling stops.
    // This makes Grid simpler to use (since cells commonly change).
    // And it keeps the caches from growing too large.
    // Performance is most sensitive when a user is scrolling.
    // Don't clear visible cells from cellCache if isScrollingOptOut is specified.
    // This keeps the cellCache to a resonable size.
    _cellCache.current = {};
    _styleCache.current = {};

    // Copy over the visible cell styles so avoid unnecessary re-render.
    for (
      let rowIndex = _rowStartIndex.current!;
      rowIndex <= _rowStopIndex.current!;
      rowIndex++
    ) {
      for (
        let columnIndex = _columnStartIndex.current!;
        columnIndex <= _columnStopIndex.current!;
        columnIndex++
      ) {
        let key = `${rowIndex}-${columnIndex}`;
        // @ts-ignore
        _styleCache.current[key] = styleCache[key];

        if (isScrollingOptOut) {
          // @ts-ignore
          _cellCache.current[key] = cellCache[key];
        }
      }
    }
  }, [isScrollingOptOut]);

  const isScrollingMemo = useMemo((): boolean => {
    // If isScrolling is defined in props, use it to override the value in state
    // This is a performance optimization for WindowScroller + Grid
    return typeof isScrolling !== "undefined"
      ? Boolean(isScrolling)
      : Boolean(state.isScrolling);
  }, [isScrolling, state.isScrolling]);

  useEffect(() => {
    if (state.needToResetStyleCache) {
      _styleCache.current = {};
    }
  }, [state.needToResetStyleCache]);

  useEffect(() => {
    if (!state.isScrolling) {
      _resetStyleCache();
    }
  }, [state.isScrolling]);

  const ChildrenToRender = useMemo(() => {
    const {
      scrollDirectionHorizontal,
      scrollDirectionVertical,
      instanceProps,
    } = state;

    const scrollTop =
      _initialScrollTop.current > 0
        ? _initialScrollTop.current
        : state.scrollTop;
    const scrollLeft =
      _initialScrollLeft.current > 0
        ? _initialScrollLeft.current
        : state.scrollLeft;

    let _childrenToDisplay = [];

    // Render only enough columns and rows to cover the visible area of the grid.
    if (height > 0 && width > 0) {
      const visibleColumnIndices =
        instanceProps.columnSizeAndPositionManager.getVisibleCellRange({
          containerSize: width,
          offset: scrollLeft,
        });
      const visibleRowIndices =
        instanceProps.rowSizeAndPositionManager.getVisibleCellRange({
          containerSize: height,
          offset: scrollTop,
        });

      const horizontalOffsetAdjustment =
        instanceProps.columnSizeAndPositionManager.getOffsetAdjustment({
          containerSize: width,
          offset: scrollLeft,
        });
      const verticalOffsetAdjustment =
        instanceProps.rowSizeAndPositionManager.getOffsetAdjustment({
          containerSize: height,
          offset: scrollTop,
        });

      // Store for _invokeOnGridRenderedHelper()
      _renderedColumnStartIndex.current = visibleColumnIndices.start!;
      _renderedColumnStopIndex.current = visibleColumnIndices.stop!;
      _renderedRowStartIndex.current = visibleRowIndices.start!;
      _renderedRowStopIndex.current = visibleRowIndices.stop!;

      const overscanColumnIndices = overscanIndicesGetter({
        direction: "horizontal",
        cellCount: columnCount,
        overscanCellsCount: overscanColumnCount,
        scrollDirection: scrollDirectionHorizontal,
        startIndex:
          typeof visibleColumnIndices.start === "number"
            ? visibleColumnIndices.start
            : 0,
        stopIndex:
          typeof visibleColumnIndices.stop === "number"
            ? visibleColumnIndices.stop
            : -1,
      });

      const overscanRowIndices = overscanIndicesGetter({
        direction: "vertical",
        cellCount: rowCount,
        overscanCellsCount: overscanRowCount,
        scrollDirection: scrollDirectionVertical,
        startIndex:
          typeof visibleRowIndices.start === "number"
            ? visibleRowIndices.start
            : 0,
        stopIndex:
          typeof visibleRowIndices.stop === "number"
            ? visibleRowIndices.stop
            : -1,
      });

      // Store for _invokeOnGridRenderedHelper()
      let columnStartIndex = overscanColumnIndices.overscanStartIndex;
      let columnStopIndex = overscanColumnIndices.overscanStopIndex;
      let rowStartIndex = overscanRowIndices.overscanStartIndex;
      let rowStopIndex = overscanRowIndices.overscanStopIndex;

      // Advanced use-cases (eg CellMeasurer) require batched measurements to determine accurate sizes.
      if (deferredMeasurementCache) {
        // If rows have a dynamic height, scan the rows we are about to render.
        // If any have not yet been measured, then we need to render all columns initially,
        // Because the height of the row is equal to the tallest cell within that row,
        // (And so we can't know the height without measuring all column-cells first).
        if (!deferredMeasurementCache.hasFixedHeight()) {
          for (
            let rowIndex = rowStartIndex;
            rowIndex <= rowStopIndex;
            rowIndex++
          ) {
            if (!deferredMeasurementCache.has(rowIndex, 0)) {
              columnStartIndex = 0;
              columnStopIndex = columnCount - 1;
              break;
            }
          }
        }

        // If columns have a dynamic width, scan the columns we are about to render.
        // If any have not yet been measured, then we need to render all rows initially,
        // Because the width of the column is equal to the widest cell within that column,
        // (And so we can't know the width without measuring all row-cells first).
        if (!deferredMeasurementCache.hasFixedWidth()) {
          for (
            let columnIndex = columnStartIndex;
            columnIndex <= columnStopIndex;
            columnIndex++
          ) {
            if (!deferredMeasurementCache.has(0, columnIndex)) {
              rowStartIndex = 0;
              rowStopIndex = rowCount - 1;
              break;
            }
          }
        }
      }

      _childrenToDisplay = cellRangeRenderer({
        cellCache: _cellCache.current,
        cellRenderer,
        columnSizeAndPositionManager:
          instanceProps.columnSizeAndPositionManager,
        columnStartIndex,
        columnStopIndex,
        deferredMeasurementCache,
        horizontalOffsetAdjustment,
        isScrolling: isScrollingMemo,
        isScrollingOptOut,
        rowSizeAndPositionManager: instanceProps.rowSizeAndPositionManager,
        rowStartIndex,
        rowStopIndex,
        scrollLeft,
        scrollTop,
        styleCache: _styleCache.current,
        verticalOffsetAdjustment,
        // @ts-ignore
        visibleColumnIndices,
        // @ts-ignore
        visibleRowIndices,
      });

      // update the indices
      _columnStartIndex.current = columnStartIndex!;
      _columnStopIndex.current = columnStopIndex!;
      _rowStartIndex.current = rowStartIndex!;
      _rowStopIndex.current = rowStopIndex!;
    }

    return _childrenToDisplay;
  }, [
    cellRenderer,
    cellRangeRenderer,
    columnCount,
    deferredMeasurementCache,
    height,
    overscanColumnCount,
    overscanIndicesGetter,
    overscanRowCount,
    rowCount,
    width,
    isScrollingOptOut,
    state,
    isScrolling,
  ]);

  const totalColumnsWidth = useMemo(() => {
    return state.instanceProps.columnSizeAndPositionManager.getTotalSize();
  }, [state.instanceProps.columnSizeAndPositionManager.getTotalSize]);
  const totalRowsHeight = useMemo(() => {
    return state.instanceProps.rowSizeAndPositionManager.getTotalSize();
  }, [state.instanceProps.rowSizeAndPositionManager.getTotalSize]);

  const showNoContentRenderer = useMemo(() => {
    return ChildrenToRender.length === 0 && height > 0 && width > 0;
  }, [ChildrenToRender.length, height, width]);

  const gridStyle: CSSProperties = useMemo(() => {
    const styles: CSSProperties = {
      boxSizing: "border-box",
      direction: "ltr",
      height: autoHeight ? "auto" : height,
      position: "relative",
      width: autoWidth ? "auto" : width,
      WebkitOverflowScrolling: "touch",
      willChange: "transform",
    };

    // Force browser to hide scrollbars when we know they aren't necessary.
    // Otherwise once scrollbars appear they may not disappear again.
    // For more info see issue #116
    const verticalScrollBarSize =
      totalRowsHeight > height ? state.instanceProps.scrollbarSize : 0;
    const horizontalScrollBarSize =
      totalColumnsWidth > width ? state.instanceProps.scrollbarSize : 0;

    // Also explicitly init styles to 'auto' if scrollbars are required.
    // This works around an obscure edge case where external CSS styles have not yet been loaded,
    // But an initial scroll index of offset is set as an external prop.
    // Without this style, Grid would render the correct range of cells but would NOT update its internal offset.
    // This was originally reported via clauderic/react-infinite-calendar/issues/23
    styles.overflowX =
      totalColumnsWidth + verticalScrollBarSize <= width ? "hidden" : "auto";
    styles.overflowY =
      totalRowsHeight + horizontalScrollBarSize <= height ? "hidden" : "auto";

    return styles;
  }, [
    totalColumnsWidth,
    totalRowsHeight,
    state.instanceProps.scrollbarSize,
    autoHeight,
    height,
    autoWidth,
    width,
  ]);

  return (
    <div
      ref={_scrollingContainerRef}
      {...containerProps}
      aria-label={ariaLabel}
      aria-readonly={ariaReadonly}
      // className={clsx("ReactVirtualized__Grid", className)}
      // id={id}
      onScroll={_onScroll}
      role={role}
      style={
        {
          ...gridStyle,
          ...style,
        } as any
      }
      tabIndex={tabIndex}
    >
      {ChildrenToRender.length > 0 && (
        <div
          className="ReactVirtualized__Grid__innerScrollContainer"
          role={containerRole}
          style={{
            width: autoContainerWidth ? "auto" : totalColumnsWidth,
            height: totalRowsHeight,
            maxWidth: totalColumnsWidth,
            maxHeight: totalRowsHeight,
            overflow: "hidden",
            pointerEvents: isScrolling ? "none" : "auto",
            position: "relative",
            ...containerStyle,
          }}
        >
          {ChildrenToRender}
        </div>
      )}
      {showNoContentRenderer && noContentRenderer()}
    </div>
  );
};
