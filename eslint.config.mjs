import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: ["design_handoff_glucodose/**"],
  },
];

export default config;
