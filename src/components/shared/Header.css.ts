import { style } from "@vanilla-extract/css";

export const header = style({
  display: "flex",
  justifyContent: "space-between",
});

export const headerLogo = style({
  padding: "0.5rem",
  borderRadius: "0%",
  height: "5vh",
  width: "5vh",
});
