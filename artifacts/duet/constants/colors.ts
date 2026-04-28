/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: "#2C2A29",
    tint: "#C86B5E",
    background: "#FAF6F0",
    foreground: "#2C2A29",
    card: "#F3EDE4",
    cardForeground: "#2C2A29",
    primary: "#C86B5E",
    primaryForeground: "#FAF6F0",
    secondary: "#EEDCA5",
    secondaryForeground: "#2C2A29",
    muted: "#E6DED2",
    mutedForeground: "#857F75",
    accent: "#A3B19B",
    accentForeground: "#FAF6F0",
    destructive: "#C86B5E",
    destructiveForeground: "#ffffff",
    border: "#E6DED2",
    input: "#E6DED2",
  },
  dark: {
    text: "#FAF6F0",
    tint: "#C86B5E",
    background: "#2C2A29",
    foreground: "#FAF6F0",
    card: "#3A3735",
    cardForeground: "#FAF6F0",
    primary: "#C86B5E",
    primaryForeground: "#FAF6F0",
    secondary: "#EEDCA5",
    secondaryForeground: "#2C2A29",
    muted: "#4A4744",
    mutedForeground: "#A39E95",
    accent: "#A3B19B",
    accentForeground: "#2C2A29",
    destructive: "#C86B5E",
    destructiveForeground: "#ffffff",
    border: "#4A4744",
    input: "#4A4744",
  },
  radius: 16,
};

export default colors;
