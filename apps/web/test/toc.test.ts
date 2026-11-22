import assert from "node:assert/strict";
import test from "node:test";

import { resolveActiveHeadingId } from "../src/lib/toc.ts";

test("test_resolve_active_heading_id_empty_list_is_null", () => {
  assert.equal(resolveActiveHeadingId([]), null);
});

test("test_resolve_active_heading_id_all_headings_below_offset_picks_first", () => {
  const headings = [
    { id: "intro", top: 260 },
    { id: "middle", top: 700 },
    { id: "outro", top: 1200 },
  ];

  assert.equal(resolveActiveHeadingId(headings, { offset: 96 }), "intro");
});

test("test_resolve_active_heading_id_several_headings_crossed_picks_last_crossed", () => {
  const headings = [
    { id: "intro", top: -640 },
    { id: "middle", top: -180 },
    { id: "outro", top: 40 },
    { id: "closing", top: 520 },
  ];

  assert.equal(resolveActiveHeadingId(headings, { offset: 96 }), "outro");
});

test("test_resolve_active_heading_id_long_section_keeps_current_heading", () => {
  const headings = [
    { id: "intro", top: -820 },
    { id: "middle", top: -310 },
    { id: "outro", top: 180 },
  ];

  assert.equal(resolveActiveHeadingId(headings, { offset: 96 }), "middle");
});

test("test_resolve_active_heading_id_at_bottom_picks_last_heading", () => {
  const headings = [
    { id: "intro", top: -900 },
    { id: "middle", top: -240 },
    { id: "outro", top: 300 },
  ];

  assert.equal(resolveActiveHeadingId(headings, { offset: 96, atBottom: true }), "outro");
});
