import { globalStyle } from "@vanilla-extract/css";

globalStyle(":root", {
  margin: 0,
  fontFamily: "Noto Sans JP",
  backgroundColor: "#030030",
  color: "#5994ce",
});

globalStyle("body", {
  margin: 0,
  display: "flex",
  placeItems: "center",
  minWidth: "320px",
  textAlign: "center",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
});

globalStyle("img", {
  height: "4rem",
  width: "4rem",
  borderRadius: "100%",
});
