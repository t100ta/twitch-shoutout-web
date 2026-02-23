import { style } from "@vanilla-extract/css";

export const userSettingItemStyle = style({
  fontWeight: "bold",
});

export const shoutoutMessageStyle = style({
  width: "33rem",
  overflowWrap: "break-word",
  minHeight: "1.5rem",
});

export const warningBoxStyle = style({
  border: "1px solid #b45309",
  backgroundColor: "#fffbeb",
  color: "#7c2d12",
  borderRadius: "8px",
  padding: "0.75rem",
  marginBottom: "0.75rem",
});

export const cautionTextStyle = style({
  color: "inherit",
  fontSize: "0.9rem",
  marginTop: "0.5rem",
  marginBottom: 0,
});
