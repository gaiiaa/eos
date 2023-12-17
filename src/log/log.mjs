const gradients = {
  purple: [
    [247, 81, 172],
    [55, 0, 231]
  ],
  sunset: [
    [231, 0, 187],
    [255, 244, 20]
  ],
  gray: [
    [235, 244, 245],
    [181, 198, 224]
  ],
  orange: [
    [255, 147, 15],
    [255, 249, 91]
  ],
  lime: [
    [89, 209, 2],
    [243, 245, 32]
  ],
  blue: [
    [31, 126, 161],
    [111, 247, 232]
  ],
  red: [
    [244, 7, 82],
    [249, 171, 143]
  ],
  orangeRed: [
    [233, 208, 34],
    [230, 11, 9]
  ]
};
const lerp = (start, end, factor) => start + factor * (end - start);
function interpolateRGB(startColor, endColor, t) {
  if (t < 0) {
    return startColor;
  }
  if (t > 1) {
    return endColor;
  }
  return [
    Math.round(lerp(startColor[0], endColor[0], t)),
    Math.round(lerp(startColor[1], endColor[1], t)),
    Math.round(lerp(startColor[2], endColor[2], t))
  ];
}

function isBrowser() {
  return (
    // @ts-ignore
    typeof window !== "undefined" && globalThis.Deno === void 0
  );
}
function formatAnsi(string, styles = {}) {
  let c = "";
  if (styles.bold) {
    c += "1;";
  }
  if (styles.italic) {
    c += "3;";
  }
  if (styles.underline) {
    c += "4;";
  }
  if (styles.foreground) {
    c += `38;2;${styles.foreground.join(";")};`;
  }
  if (styles.background) {
    c += `48;2;${styles.background.join(";")};`;
  }
  while (c.endsWith(";")) {
    c = c.slice(0, -1);
  }
  return {
    content: `\x1B[${c}m${string}\x1B[0m\x1B[0m`,
    styles: []
  };
}
function formatBrowser(string, options = {}) {
  const styles = [];
  if (options.bold) {
    styles.push("font-weight: bold;");
  }
  if (options.italic) {
    styles.push("font-style: italic;");
  }
  if (options.underline) {
    styles.push("text-decoration: underline;");
  }
  if (options.foreground) {
    styles.push(`color: rgb(${options.foreground.join(", ")});`);
  }
  if (options.background) {
    styles.push(`background-color: rgb(${options.background.join(", ")});`);
  }
  if (options.size > 0) {
    styles.push(`font-size: ${options.size}px;`);
  }
  return {
    content: `%c${string}`,
    styles: [styles.join("")]
  };
}
function format(string, options = {}) {
  if (isBrowser()) {
    return formatBrowser(string, options);
  }
  return formatAnsi(string, options);
}
function stringGradient(str, gradient, options) {
  const result = {
    content: "",
    styles: []
  };
  if (isBrowser()) {
    result.content = "%c" + str.split("").join("%c");
    for (let i = 0; i < str.length; i++) {
      const g = interpolateRGB(gradient[0], gradient[1], i / str.length);
      result.styles.push(
        formatBrowser(str[i], { ...options, foreground: g }).styles[0]
      );
    }
    return result;
  }
  for (let i = 0; i < str.length; i++) {
    result.content += formatAnsi(str[i], {
      ...options,
      foreground: interpolateRGB(gradient[0], gradient[1], i / str.length)
    }).content;
  }
  return result;
}

var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  LogLevel2[LogLevel2["CRITICAL"] = 4] = "CRITICAL";
  LogLevel2[LogLevel2["FATAL"] = 5] = "FATAL";
  LogLevel2[LogLevel2["PRODUCTION"] = 6] = "PRODUCTION";
  return LogLevel2;
})(LogLevel || {});
const env = globalThis.process?.env || // @ts-expect-error
import.meta.env || // @ts-expect-error
globalThis.Deno?.env.toObject() || // @ts-expect-error
globalThis.__env__;
const isColorSupported = !env.NO_COLOR && !env.FORCE_COLOR || !(env.TERM === "dumb") || !env.CI;
const colorfulWriter = (name, color) => {
  const formattedName = stringGradient(`[ ${name} ]`, color);
  const levels = {
    DEBUG: stringGradient("DEBUG", gradients.gray, { size: 12 }),
    INFO: stringGradient("INFO", gradients.blue),
    WARN: stringGradient("WARN", gradients.orange),
    SUCCESS: stringGradient("SUCCESS", gradients.lime),
    FAIL: stringGradient("FAIL", gradients.orangeRed),
    ERROR: stringGradient("ERROR", gradients.red),
    CRITICAL: stringGradient("CRITICAL ERROR", gradients.red, { bold: true }),
    FATAL: format("  FATAL  ", {
      background: [255, 0, 0],
      size: 20
    })
  };
  return (msg, _, timestamp, name2) => {
    const ts = timestamp && format(performance.now().toFixed(0), {
      foreground: [100, 100, 100]
    });
    console.log(
      (timestamp ? ts.content + " " : "") + formattedName.content + // @ts-ignore
      (name2 ? " " + levels[name2].content : ""),
      ...timestamp ? ts.styles : [],
      ...formattedName.styles,
      ...name2 ? levels[name2].styles : [],
      ...msg
    );
  };
};
const simpleWriter = (name) => {
  return (msg, level, timestamp, logName) => void console.log(
    `${timestamp ? performance.now().toFixed(0) + " " : ""}${name} <${logName}>`,
    ...msg
  );
};
function createLogger(config) {
  const writer = isColorSupported ? colorfulWriter(config.name, config.color ?? gradients.sunset) : simpleWriter(config.name);
  let lvl = config.level;
  const ts = config.timestamp ?? false;
  function _log(msg, level, name) {
    if (level < lvl) {
      return;
    }
    writer(msg, level, ts, name);
  }
  const fn = (...msg) => _log(msg, 6 /* PRODUCTION */);
  fn.debug = (...msg) => _log(msg, 0 /* DEBUG */, "DEBUG");
  fn.info = (...msg) => _log(msg, 1 /* INFO */, "INFO");
  fn.success = (...msg) => _log(msg, 1 /* INFO */, "SUCCESS");
  fn.fail = (...msg) => _log(msg, 1 /* INFO */, "FAIL");
  fn.warn = (...msg) => _log(msg, 2 /* WARN */, "WARN");
  fn.error = (...msg) => _log(msg, 3 /* ERROR */, "ERROR");
  fn.critical = (...msg) => _log(msg, 4 /* CRITICAL */, "CRITICAL");
  fn.fatal = (...msg) => _log(msg, 5 /* FATAL */, "FATAL");
  fn.whisper = (...msg) => _log(msg, 0 /* DEBUG */);
  fn.say = (...msg) => _log(msg, 1 /* INFO */);
  fn.shout = (...msg) => _log(msg, 6 /* PRODUCTION */);
  return fn;
}

export { LogLevel, colorfulWriter, createLogger, gradients, isColorSupported, simpleWriter };
