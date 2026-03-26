const shopifyPrettierConfig = require("@shopify/prettier-config");

/** @type {import("prettier").Config} */
module.exports = {
  ...shopifyPrettierConfig,
  bracketSpacing: true,
  singleQuote: false,
};
