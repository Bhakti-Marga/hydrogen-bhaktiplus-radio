/**
 * Tests for hasAccessToContent — the pure access-check functions.
 *
 * Two versions are tested:
 *   1. Client-side (content.ts) — used by hooks/components
 *   2. Server-side (server.utils.ts) — used by the video route loader
 *
 * The fixtures file serves as living documentation of the access matrix.
 * To add a new test case, add a fixture to fixtures.ts — it will
 * automatically be picked up by the parameterized tests below.
 */

import { describe, it, expect } from "vitest";
import { hasAccessToContent } from "../content";
import { hasAccessToContent as serverHasAccessToContent } from "../server.utils";
import {
  freeContentFixtures,
  noUserFixtures,
  ppvFixtures,
  tierHierarchyFixtures,
  noTiersFixtures,
  disabledTierFixtures,
  prelaunchFixtures,
  serverFixtures,
  allClientFixtures,
  makeContent,
  makeUser,
  makeVideo,
} from "./fixtures";

// ---------------------------------------------------------------------------
// Client-side hasAccessToContent (content.ts)
// ---------------------------------------------------------------------------

describe("hasAccessToContent (client-side, content.ts)", () => {
  describe("Free content: isLiveFree bypass", () => {
    it.each(freeContentFixtures.map((f) => [f.name, f]))(
      "%s",
      (_name, fixture) => {
        const result = hasAccessToContent(
          fixture.user,
          fixture.subscriptionTier,
          fixture.content,
          fixture.options,
        );
        expect(result).toBe(fixture.expected);
      },
    );
  });

  describe("No user: anonymous access denied", () => {
    it.each(noUserFixtures.map((f) => [f.name, f]))(
      "%s",
      (_name, fixture) => {
        const result = hasAccessToContent(
          fixture.user,
          fixture.subscriptionTier,
          fixture.content,
          fixture.options,
        );
        expect(result).toBe(fixture.expected);
      },
    );
  });

  describe("PPV access: pay-per-view tag matching", () => {
    it.each(ppvFixtures.map((f) => [f.name, f]))("%s", (_name, fixture) => {
      const result = hasAccessToContent(
        fixture.user,
        fixture.subscriptionTier,
        fixture.content,
        fixture.options,
      );
      expect(result).toBe(fixture.expected);
    });
  });

  describe("Subscription tier hierarchy: live(1) < premium(2) < supporter(3)", () => {
    it.each(tierHierarchyFixtures.map((f) => [f.name, f]))(
      "%s",
      (_name, fixture) => {
        const result = hasAccessToContent(
          fixture.user,
          fixture.subscriptionTier,
          fixture.content,
          fixture.options,
        );
        expect(result).toBe(fixture.expected);
      },
    );
  });

  describe("No subscription tiers on content", () => {
    it.each(noTiersFixtures.map((f) => [f.name, f]))(
      "%s",
      (_name, fixture) => {
        const result = hasAccessToContent(
          fixture.user,
          fixture.subscriptionTier,
          fixture.content,
          fixture.options,
        );
        expect(result).toBe(fixture.expected);
      },
    );
  });

  describe("Disabled tiers: supporter tier filtered out", () => {
    it.each(disabledTierFixtures.map((f) => [f.name, f]))(
      "%s",
      (_name, fixture) => {
        const result = hasAccessToContent(
          fixture.user,
          fixture.subscriptionTier,
          fixture.content,
          fixture.options,
        );
        expect(result).toBe(fixture.expected);
      },
    );
  });

  describe("Prelaunch bypass: logged-in users get free Lives access", () => {
    it.each(prelaunchFixtures.map((f) => [f.name, f]))(
      "%s",
      (_name, fixture) => {
        const result = hasAccessToContent(
          fixture.user,
          fixture.subscriptionTier,
          fixture.content,
          fixture.options,
        );
        expect(result).toBe(fixture.expected);
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Server-side hasAccessToContent (server.utils.ts)
// ---------------------------------------------------------------------------

describe("hasAccessToContent (server-side, server.utils.ts)", () => {
  it.each(serverFixtures.map((f) => [f.name, f]))("%s", (_name, fixture) => {
    const result = serverHasAccessToContent(
      fixture.user,
      fixture.subscriptionTier,
      fixture.video,
      fixture.content,
    );
    expect(result).toBe(fixture.expected);
  });
});

// ---------------------------------------------------------------------------
// Regression / edge-case tests
// ---------------------------------------------------------------------------

describe("Regression tests", () => {
  it("PPV takes precedence over insufficient subscription tier", () => {
    const result = hasAccessToContent(
      makeUser({ ppv: ["talk-special-2026"] }),
      "unsubscribed",
      makeContent({
        ppvTag: "talk-special-2026",
        subscriptionTiers: ["Premium"],
      }),
    );
    expect(result).toBe(true);
  });

  it("isLiveFree takes precedence over everything (even null user)", () => {
    const result = hasAccessToContent(
      null,
      undefined,
      makeContent({ isLiveFree: true, subscriptionTiers: ["Supporter"] }),
    );
    expect(result).toBe(true);
  });

  it("tier comparison is case-insensitive", () => {
    // Content tiers from API may come as "Premium", "LIVE", etc.
    const result = hasAccessToContent(
      makeUser(),
      "premium",
      makeContent({ subscriptionTiers: ["PREMIUM"] }),
    );
    expect(result).toBe(true);
  });

  it("content with only disabled tiers + PPV tag → PPV still grants access", () => {
    const result = hasAccessToContent(
      makeUser({ ppv: ["pilgrimage-2026"] }),
      "unsubscribed",
      makeContent({
        subscriptionTiers: ["Supporter"], // disabled, will be filtered out
        ppvTag: "pilgrimage-2026",
      }),
    );
    expect(result).toBe(true);
  });

  it("undefined subscription tier → deny (no tier to compare)", () => {
    const result = hasAccessToContent(
      makeUser(),
      undefined,
      makeContent({ subscriptionTiers: ["Live"] }),
    );
    expect(result).toBe(false);
  });

  it("server-side: both video and content null → deny", () => {
    const result = serverHasAccessToContent(
      makeUser(),
      "premium",
      null as any,
      null as any,
    );
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Coverage check
// ---------------------------------------------------------------------------

describe("Coverage check", () => {
  it("all client-side fixtures produce boolean results", () => {
    for (const fixture of allClientFixtures) {
      const result = hasAccessToContent(
        fixture.user,
        fixture.subscriptionTier,
        fixture.content,
        fixture.options,
      );
      expect(typeof result).toBe("boolean");
    }
  });

  it("fixtures cover both grant and deny outcomes", () => {
    const grants = allClientFixtures.filter((f) => f.expected === true);
    const denies = allClientFixtures.filter((f) => f.expected === false);
    expect(grants.length).toBeGreaterThan(0);
    expect(denies.length).toBeGreaterThan(0);
  });

  it("fixtures cover all access paths", () => {
    const coveredPaths = new Set<string>();

    for (const fixture of allClientFixtures) {
      if (fixture.content.isLiveFree) coveredPaths.add("isLiveFree");
      if (!fixture.user) coveredPaths.add("no-user");
      if (fixture.content.ppvTag && fixture.user?.ppv?.length)
        coveredPaths.add("ppv");
      if (fixture.options?.isPrelaunch) coveredPaths.add("prelaunch");
      if (fixture.subscriptionTier && fixture.subscriptionTier !== "unsubscribed")
        coveredPaths.add("subscription-tier");
      if (
        !fixture.content.subscriptionTiers ||
        fixture.content.subscriptionTiers.length === 0
      )
        coveredPaths.add("no-tiers");
    }

    const expectedPaths = [
      "isLiveFree",
      "no-user",
      "ppv",
      "prelaunch",
      "subscription-tier",
      "no-tiers",
    ];

    for (const path of expectedPaths) {
      expect(
        coveredPaths.has(path),
        `Missing fixture coverage for access path: ${path}`,
      ).toBe(true);
    }
  });
});
