import { useEffect, useState } from "react";
import { getBg } from "./backgrouns";
import { useBGContext } from "./BGContext";

export const COLUMNS_COUNT = 500;
export const ROWS_COUNT = 500;

const colors = ["lightblue", "green", "yellow"];

export const columns = new Array(COLUMNS_COUNT).fill(0).map((_, i) => ({
  width: 150,
  title: (
    <span style={{ fontFamily: "cursive" }}>
      <span style={{ fontSize: "18px" }}>This is </span>{" "}
      <p style={{ color: colors[i % 3] }}>A loooot</p>{" "}
      <b style={{ background: colors[i % 3] }}> styles</b>{" "}
    </span>
  ),
  name: `column-${i}`,
}));

const Cell = ({ rowIdx, colIdx }: any) => {
  const bgs = useBGContext();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: bgs[rowIdx][colIdx],
        transition: "1s",
      }}
    >
      This is Row Number: {rowIdx}. Column number {colIdx}
    </div>
  );
};

export const rows = new Array(ROWS_COUNT).fill(0).map((_, rowIdx) => {
  const row = new Array(COLUMNS_COUNT).fill(0).reduce((acc, _, colIdx) => {
    acc[`column-${colIdx}`] = <Cell rowIdx={rowIdx} colIdx={colIdx} />;
    return acc;
  }, {});
  return row;
});

export const createBgc = () => {
  return new Array(ROWS_COUNT).fill(0).map((_, rowIdx) => {
    return new Array(COLUMNS_COUNT).fill(0).map((_) => getBg());
  });
};
