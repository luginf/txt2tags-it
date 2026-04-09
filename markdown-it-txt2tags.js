/*! markdown-it-txt2tags - txt2tags syntax support for markdown-it */
(function (f) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }
    g.markdownitTxt2tags = f();
  }
})(function () {
  "use strict";

  /**
   * txt2tags heading syntax for markdown-it
   *
   * Headings use equal signs on both sides:
   *   = Heading 1 =
   *   == Heading 2 ==
   *   === Heading 3 ===
   *   ==== Heading 4 ====
   *   ===== Heading 5 =====
   *
   * Rules:
   * - The number of = signs must match on both sides (1–5)
   * - There must be at least one space between the = signs and the title text
   * - Trailing spaces after the closing = signs are allowed
   */
  function txt2tagsPlugin(md) {
    md.block.ruler.before(
      "heading",
      "txt2tags_heading",
      function (state, startLine, endLine, silent) {
        var pos = state.bMarks[startLine] + state.tShift[startLine];
        var max = state.eMarks[startLine];

        // Quick fail: line must start with '='
        if (state.src.charCodeAt(pos) !== 0x3d /* = */) return false;

        var line = state.src.slice(pos, max);

        // Match: (={1,5}) <space> title <space> \1 (optional trailing spaces)
        var match = /^(={1,5}) +(.+?) +\1\s*$/.exec(line);
        if (!match) return false;

        var level = match[1].length;
        var title = match[2];

        if (silent) return true;

        var token;

        token = state.push("heading_open", "h" + level, 1);
        token.markup = match[1];
        token.map = [startLine, startLine + 1];

        token = state.push("inline", "", 0);
        token.content = title;
        token.map = [startLine, startLine + 1];
        token.children = [];

        token = state.push("heading_close", "h" + level, -1);
        token.markup = match[1];

        state.line = startLine + 1;
        return true;
      },
    );
  }

  return txt2tagsPlugin;
});
