"use strict";

const React = require("react");
const tokens = require("./tokens");
const ui = require("./ui");
const charts = require("./charts");
const extras = require("./extras");

function ThemeProvider(props) {
  return React.createElement(ui.ThemeProvider, props);
}

module.exports = {
  ...ui,
  ...charts,
  ...extras,
  ...tokens,
  ThemeProvider,
  useEffect: React.useEffect,
  useMemo: React.useMemo,
  useRef: React.useRef,
  useState: React.useState,
};
