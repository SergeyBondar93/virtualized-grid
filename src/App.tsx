import clsx from "clsx";
import { createContext, CSSProperties, useEffect, useState } from "react";
import { COLUMNS_COUNT, createBgc, rows, ROWS_COUNT } from "./data";
import { Grid } from "./Grid";
// @ts-ignore
import styles from "./Grid.module.css";


export const App = () => {
  const _cellRenderer = ({ columnIndex, key, rowIndex, style }: any) => {
    return (
      <div key={key} style={style}>
        {rows[rowIndex][`column-${columnIndex}`]}
      </div>
    );
  };

  return (
    <Grid
      cellRenderer={_cellRenderer}
      className={styles.BodyGrid}
      rowCount={ROWS_COUNT}
      columnCount={COLUMNS_COUNT}
      columnWidth={150}
      rowHeight={100}
      // noContentRenderer={this._noContentRenderer}
      // overscanColumnCount={overscanColumnCount}
      // overscanRowCount={overscanRowCount}
      // scrollToColumn={scrollToColumn}
      // scrollToRow={scrollToRow}
      height={750}
      width={750}
    />
  );
};
