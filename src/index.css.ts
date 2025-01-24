import { globalStyle } from "@vanilla-extract/css";

globalStyle(":root", {
  margin: 0,
  fontFamily: "Noto Sans JP",
  backgroundColor: "#0E0E10",
  color: "#CDCDCF",
});

globalStyle("body", {
  margin: 0,
  display: "flex",
  placeItems: "center",
  minWidth: "320px",
  textAlign: "center",
  justifyContent: "center",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
});

globalStyle("img", {
  height: "4rem",
  width: "4rem",
  borderRadius: "100%",
});

globalStyle("button", {
  border: "medium",
  borderRadius: "0.4rem",
  fontWeight: "bold",
  color: "#ffffff",
  backgroundColor: "#772CE8",
  margin: "0.5rem",
  padding: "0.5rem",
});

globalStyle("button:hover", {
  cursor: "pointer",
});
