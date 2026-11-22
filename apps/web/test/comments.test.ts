import assert from "node:assert/strict";
import test from "node:test";

import {
  discussionsUrl,
  giscusThemeFor,
  isCommentsEnabled,
  resolveDiscussionTerm,
  type GiscusConfig,
} from "../src/lib/comments.ts";

const complete: GiscusConfig = {
  repo: "owner/repo",
  repoId: "R_kgDOabcd",
  category: "Comments",
  categoryId: "DIC_kwDOabcd",
  strict: "1",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "top",
  themes: { light: "noborder_light", dark: "noborder_dark" },
};

test("test_is_comments_enabled_false_when_ids_missing", () => {
  assert.equal(isCommentsEnabled({ ...complete, repoId: "", categoryId: "" }), false);
});

test("test_is_comments_enabled_true_when_config_complete", () => {
  assert.equal(isCommentsEnabled(complete), true);
});

test("test_resolve_discussion_term_uses_translation_key_when_present", () => {
  assert.equal(
    resolveDiscussionTerm({ translationKey: "hello-world", slug: "xin-chao-the-gioi" }),
    "hello-world",
  );
});

test("test_resolve_discussion_term_falls_back_to_slug", () => {
  assert.equal(
    resolveDiscussionTerm({ translationKey: "   ", slug: "xin-chao-the-gioi" }),
    "xin-chao-the-gioi",
  );
});

test("test_giscus_theme_for_maps_light_and_dark", () => {
  assert.equal(giscusThemeFor("light"), "noborder_light");
  assert.equal(giscusThemeFor("dark"), "noborder_dark");
});

test("test_discussions_url_builds_github_discussions_link", () => {
  assert.equal(discussionsUrl("owner/repo"), "https://github.com/owner/repo/discussions");
});
