---
name: TiPunch Labs — Xavier GUERET
description: Monochrome one-page portfolio and blog, black ground, white type, one lime accent
colors:
  black: "#000000"
  white: "#ffffff"
  lime: "#a8cf3e"
  line-18: "rgba(255,255,255,0.18)"
  line-22: "rgba(255,255,255,0.22)"
  line-30: "rgba(255,255,255,0.30)"
  line-35: "rgba(255,255,255,0.35)"
  line-50: "rgba(255,255,255,0.50)"
  surface: "#0a0a0a"
typography:
  display:
    fontFamily: "'Space Grotesk', Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.9rem, min(7.6vw, 9vh), 6.4rem)"
    fontWeight: 500
    lineHeight: 0.94
    letterSpacing: "0.005em"
    textTransform: uppercase
  headline:
    fontFamily: "'Space Grotesk', Helvetica, Arial, sans-serif"
    fontSize: "clamp(2rem, 5.6vw, 4.6rem)"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "0.01em"
    textTransform: uppercase
  title:
    fontFamily: "'Space Grotesk', Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.15rem, 1.9vw, 1.6rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.005em"
  body:
    fontFamily: "'Space Grotesk', Helvetica, Arial, sans-serif"
    fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)"
    fontWeight: 300
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.3em"
    textTransform: uppercase
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
rounded:
  sm: "0"
  md: "0"
  lg: "0"
---

# Design system

Monochrome system ported from the "TiPunch Labs v5" mockup. Pure black ground,
white type, a single lime accent, hairline rules in white alpha. Space Grotesk
carries display and body; JetBrains Mono carries labels, HUD, navigation,
buttons and code. No border radius anywhere. Motion: split-text blur reveals,
custom cursor, Lenis smooth scroll, three.js backdrop and cards on home pages.

`src/styles/global.css` is the implementation; this file and
`.impeccable/design.json` are the contract. Change a token in all three.
