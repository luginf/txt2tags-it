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
   * txt2tags syntax support for markdown-it
   *
   * Block rules:
   *   = Heading 1 =  /  == Heading 2 ==  /  …  /  ===== Heading 5 =====
   *   % This is a comment (line ignored in output)
   *
   * Inline rules:
   *   //italic//     →  <em>italic</em>
   *   __underline__  →  <u>underline</u>
   *   --strikethrough--  →  <del>strikethrough</del>
   */
  function txt2tagsPlugin(md) {

    // ── Block: headings ──────────────────────────────────────────────────────
    // = H1 =   == H2 ==   === H3 ===   ==== H4 ====   ===== H5 =====
    // Rules:
    //   - The number of = signs must match on both sides (1–5)
    //   - At least one space between the = signs and the title text
    //   - Trailing spaces after the closing = signs are allowed
    md.block.ruler.before(
      "heading",
      "txt2tags_heading",
      function (state, startLine, endLine, silent) {
        var pos = state.bMarks[startLine] + state.tShift[startLine];
        var max = state.eMarks[startLine];

        if (state.src.charCodeAt(pos) !== 0x3d /* = */) return false;

        var line = state.src.slice(pos, max);
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
      }
    );

    // ── Block: % comments ────────────────────────────────────────────────────
    // A line whose very first character is % is silently consumed.
    md.block.ruler.before(
      "paragraph",
      "txt2tags_comment",
      function (state, startLine, endLine, silent) {
        // Use bMarks (not bMarks + tShift) to require % at column 0
        var pos = state.bMarks[startLine];
        if (state.src.charCodeAt(pos) !== 0x25 /* % */) return false;
        if (silent) return true;
        state.line = startLine + 1;
        return true;
      }
    );

    // ── Inline: //italic// ───────────────────────────────────────────────────
    // Avoid matching inside URLs (e.g. http://)
    md.inline.ruler.push(
      "txt2tags_italic",
      function (state, silent) {
        var pos = state.pos;
        var src = state.src;
        if (src.charCodeAt(pos) !== 0x2F || src.charCodeAt(pos + 1) !== 0x2F) return false;
        if (pos > 0 && src.charCodeAt(pos - 1) === 0x3A /* : */) return false;
        var start = pos + 2;
        var end = src.indexOf("//", start);
        if (end < 0 || end === start) return false;
        if (!silent) {
          state.push("em_open", "em", 1).markup = "//";
          state.push("text", "", 0).content = src.slice(start, end);
          state.push("em_close", "em", -1).markup = "//";
        }
        state.pos = end + 2;
        return true;
      }
    );

    // ── Inline: __underline__ ────────────────────────────────────────────────
    // Registered BEFORE 'emphasis' so that __ is consumed here instead of
    // being treated as markdown bold.
    md.inline.ruler.before(
      "emphasis",
      "txt2tags_underline",
      function (state, silent) {
        var pos = state.pos;
        var src = state.src;
        if (src.charCodeAt(pos) !== 0x5F || src.charCodeAt(pos + 1) !== 0x5F) return false;
        var start = pos + 2;
        var end = src.indexOf("__", start);
        if (end < 0 || end === start) return false;
        if (!silent) {
          state.push("txt2tags_u_open", "u", 1);
          state.push("text", "", 0).content = src.slice(start, end);
          state.push("txt2tags_u_close", "u", -1);
        }
        state.pos = end + 2;
        return true;
      }
    );

    // ── Inline: --strikethrough-- ─────────────────────────────────────────────
    md.inline.ruler.push(
      "txt2tags_strike",
      function (state, silent) {
        var pos = state.pos;
        var src = state.src;
        if (src.charCodeAt(pos) !== 0x2D || src.charCodeAt(pos + 1) !== 0x2D) return false;
        var start = pos + 2;
        var end = src.indexOf("--", start);
        if (end < 0 || end === start) return false;
        if (!silent) {
          state.push("txt2tags_del_open", "del", 1);
          state.push("text", "", 0).content = src.slice(start, end);
          state.push("txt2tags_del_close", "del", -1);
        }
        state.pos = end + 2;
        return true;
      }
    );
  }

  return txt2tagsPlugin;
});
