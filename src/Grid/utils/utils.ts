import {
  Alignment,
  CellCache,
  CellSize,
  CellSizeGetter,
  Props,
  State,
} from "../types";
import {
  SCROLL_DIRECTION_BACKWARD,
  SCROLL_DIRECTION_FORWARD,
  SCROLL_POSITION_CHANGE_REASONS,
} from "./consts";

export const _getEstimatedColumnSize = ({
  columnWidth,
  estimatedColumnSize,
}: {
  columnWidth: CellSize;
  estimatedColumnSize: number;
}) => {
  return typeof columnWidth === "number" ? columnWidth : estimatedColumnSize;
};

export const _getEstimatedRowSize = ({
  rowHeight,
  estimatedRowSize,
}: {
  rowHeight: CellSize;
  estimatedRowSize: number;
}) => {
  return typeof rowHeight === "number" ? rowHeight : estimatedRowSize;
};

export const _getScrollToPositionStateUpdate = ({
  prevState,
  scrollLeft,
  scrollTop,
}: {
  prevState: any;
  scrollLeft?: number;
  scrollTop?: number;
}): any => {
  const newState: any = {
    scrollPositionChangeReason: SCROLL_POSITION_CHANGE_REASONS.REQUESTED,
  };

  if (typeof scrollLeft === "number" && scrollLeft >= 0) {
    newState.scrollDirectionHorizontal =
      scrollLeft > prevState.scrollLeft
        ? SCROLL_DIRECTION_FORWARD
        : SCROLL_DIRECTION_BACKWARD;
    newState.scrollLeft = scrollLeft;
  }

  if (typeof scrollTop === "number" && scrollTop >= 0) {
    newState.scrollDirectionVertical =
      scrollTop > prevState.scrollTop
        ? SCROLL_DIRECTION_FORWARD
        : SCROLL_DIRECTION_BACKWARD;
    newState.scrollTop = scrollTop;
  }

  if (
    (typeof scrollLeft === "number" &&
      scrollLeft >= 0 &&
      scrollLeft !== prevState.scrollLeft) ||
    (typeof scrollTop === "number" &&
      scrollTop >= 0 &&
      scrollTop !== prevState.scrollTop)
  ) {
    return newState;
  }
  return {};
};

export const _wrapSizeGetter = (value: CellSize): CellSizeGetter | any => {
  return typeof value === "function" ? value : () => value;
};
type GetCalculatedScrollLeftArgsFromProps = {
  columnCount: number;
  height: number;
  scrollToAlignment: Alignment;
  scrollToColumn: number;
  width: number;
};

export const _getCalculatedScrollLeft = (
  nextProps: GetCalculatedScrollLeftArgsFromProps,
  prevState: State
) => {
  const { columnCount, height, scrollToAlignment, scrollToColumn, width } =
    nextProps;
  const { scrollLeft, instanceProps } = prevState;

  if (columnCount > 0) {
    const finalColumn = columnCount - 1;
    const targetIndex =
      scrollToColumn < 0 ? finalColumn : Math.min(finalColumn, scrollToColumn);
    const totalRowsHeight =
      instanceProps.rowSizeAndPositionManager.getTotalSize();
    const scrollBarSize =
      instanceProps.scrollbarSizeMeasured && totalRowsHeight > height
        ? instanceProps.scrollbarSize
        : 0;

    return instanceProps.columnSizeAndPositionManager.getUpdatedOffsetForIndex({
      align: scrollToAlignment,
      containerSize: width - scrollBarSize,
      currentOffset: scrollLeft,
      targetIndex,
    });
  }
  return 0;
};

export const _getScrollLeftForScrollToColumnStateUpdate = (
  nextProps: GetCalculatedScrollLeftArgsFromProps,
  prevState: State
): any => {
  const { scrollLeft } = prevState;
  const calculatedScrollLeft = _getCalculatedScrollLeft(nextProps, prevState);

  if (
    typeof calculatedScrollLeft === "number" &&
    calculatedScrollLeft >= 0 &&
    scrollLeft !== calculatedScrollLeft
  ) {
    return _getScrollToPositionStateUpdate({
      prevState,
      scrollLeft: calculatedScrollLeft,
      scrollTop: -1,
    });
  }
  return {};
};

type GetCalculatedScrollTopParamsFromProps = {
  height: number;
  rowCount: number;
  scrollToAlignment: Alignment;
  scrollToRow: number;
  width: number;
}

export const _getCalculatedScrollTop = (nextProps: GetCalculatedScrollTopParamsFromProps, prevState: State) => {
  const { height, rowCount, scrollToAlignment, scrollToRow, width } = nextProps;
  const { scrollTop, instanceProps } = prevState;

  if (rowCount > 0) {
    const finalRow = rowCount - 1;
    const targetIndex =
      scrollToRow < 0 ? finalRow : Math.min(finalRow, scrollToRow);
    const totalColumnsWidth =
      instanceProps.columnSizeAndPositionManager.getTotalSize();
    const scrollBarSize =
      instanceProps.scrollbarSizeMeasured && totalColumnsWidth > width
        ? instanceProps.scrollbarSize
        : 0;

    return instanceProps.rowSizeAndPositionManager.getUpdatedOffsetForIndex({
      align: scrollToAlignment,
      containerSize: height - scrollBarSize,
      currentOffset: scrollTop,
      targetIndex,
    });
  }
  return 0;
};

export const _getScrollTopForScrollToRowStateUpdate = (
  nextProps: GetCalculatedScrollTopParamsFromProps,
  prevState: State
): any => {
  const { scrollTop } = prevState;
  const calculatedScrollTop = _getCalculatedScrollTop(
    nextProps,
    prevState
  );

  if (
    typeof calculatedScrollTop === "number" &&
    calculatedScrollTop >= 0 &&
    scrollTop !== calculatedScrollTop
  ) {
    return _getScrollToPositionStateUpdate({
      prevState,
      scrollLeft: -1,
      scrollTop: calculatedScrollTop,
    });
  }
  return {};
};
