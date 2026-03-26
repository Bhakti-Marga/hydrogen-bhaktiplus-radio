/**
 * Tests for resolveCtaState - the pure CTA decision function.
 *
 * These tests verify that given specific content data and user state,
 * the correct CTA button type is resolved. The fixtures file serves as
 * living documentation of all CTA states.
 *
 * To add a new test case, add a fixture to fixtures.ts - it will
 * automatically be picked up by the parameterized tests below.
 */

import { describe, it, expect } from "vitest";
import { resolveCtaState } from "../resolveCtaState";
import {
  accessFixtures,
  noAccessFixtures,
  accessEdgeCaseFixtures,
  realWorldFixtures,
  allFixtures,
  makeInput,
  makeContent,
  makeUser,
} from "./fixtures";

// ---------------------------------------------------------------------------
// Parameterized tests from fixtures
// ---------------------------------------------------------------------------

describe("resolveCtaState", () => {
  describe("Access path: user has access", () => {
    it.each(accessFixtures.map((f) => [f.name, f]))(
      "%s",
      (_name, fixture) => {
        const result = resolveCtaState(fixture.input);
        expect(result).toEqual(fixture.expected);
      },
    );
  });

  describe("No-access path: user needs to subscribe/purchase", () => {
    it.each(noAccessFixtures.map((f) => [f.name, f]))(
      "%s",
      (_name, fixture) => {
        const result = resolveCtaState(fixture.input);
        expect(result).toEqual(fixture.expected);
      },
    );
  });

  describe("Access edge cases: free live, PPV, prelaunch, tier hierarchy", () => {
    it.each(accessEdgeCaseFixtures.map((f) => [f.name, f]))(
      "%s",
      (_name, fixture) => {
        const result = resolveCtaState(fixture.input);
        expect(result).toEqual(fixture.expected);
      },
    );
  });

  describe("Real-world scenarios (based on actual API responses)", () => {
    it.each(realWorldFixtures.map((f) => [f.name, f]))(
      "%s",
      (_name, fixture) => {
        const result = resolveCtaState(fixture.input);
        expect(result).toEqual(fixture.expected);
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Specific regression/edge-case tests
  // ---------------------------------------------------------------------------

  describe("Regression tests", () => {
    it("watch progress of 0 seconds should not count as progress", () => {
      const result = resolveCtaState(
        makeInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          watchProgressSeconds: 0,
        }),
      );
      expect(result).toEqual({
        type: "play",
        variant: "watch",
        isStartingSoon: false,
      });
    });

    it("negative watch progress should not count as progress", () => {
      const result = resolveCtaState(
        makeInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          watchProgressSeconds: -1,
        }),
      );
      expect(result).toEqual({
        type: "play",
        variant: "watch",
        isStartingSoon: false,
      });
    });

    it("series marker takes precedence over watch progress", () => {
      const result = resolveCtaState(
        makeInput({
          content: makeContent({ subscriptionTiers: ["Premium"] }),
          subscriptionTier: "premium",
          watchProgressSeconds: 500,
          seriesFeaturedVideoMarker: "watch-next",
        }),
      );
      // Series marker wins over watch progress
      expect(result).toEqual({
        type: "play",
        variant: "series-watch",
        isStartingSoon: false,
      });
    });

    it("liveStatus takes precedence over series marker", () => {
      const result = resolveCtaState(
        makeInput({
          content: makeContent({
            liveStatus: "live-now",
            isLiveContent: true,
            isLiveFree: true,
          }),
          seriesFeaturedVideoMarker: "continue",
        }),
      );
      // Live status wins
      expect(result).toEqual({
        type: "play",
        variant: "live",
        isStartingSoon: false,
      });
    });

    it("empty subscriptionTiers array is treated same as null (no access path)", () => {
      const resultEmpty = resolveCtaState(
        makeInput({
          content: makeContent({
            subscriptionTiers: [],
            isLiveFree: false,
          }),
          user: makeUser(),
          subscriptionTier: "unsubscribed",
        }),
      );
      const resultNull = resolveCtaState(
        makeInput({
          content: makeContent({
            subscriptionTiers: null,
            isLiveFree: false,
          }),
          user: makeUser(),
          subscriptionTier: "unsubscribed",
        }),
      );
      expect(resultEmpty).toEqual(resultNull);
    });
  });

  // ---------------------------------------------------------------------------
  // Exhaustiveness check
  // ---------------------------------------------------------------------------

  describe("Coverage check", () => {
    it("all fixtures produce valid CtaState types", () => {
      const validTypes = new Set([
        "play",
        "upcoming-live",
        "replay-coming-soon",
        "no-video",
        "cta-choose-plan",
        "cta-upgrade-plan",
        "cta-choose-plan-and-ppv",
        "cta-upgrade-plan-and-ppv",
        "cta-ppv-only",
        "cta-none",
      ]);

      for (const fixture of allFixtures) {
        const result = resolveCtaState(fixture.input);
        expect(validTypes.has(result.type)).toBe(true);
      }
    });

    it("fixtures cover all CTA state types", () => {
      const coveredTypes = new Set<string>();
      for (const fixture of allFixtures) {
        const result = resolveCtaState(fixture.input);
        if (result.type === "play") {
          coveredTypes.add(`play/${result.variant}`);
        } else {
          coveredTypes.add(result.type);
        }
      }

      // Every CTA state type should be covered by at least one fixture
      const expectedTypes = [
        "play/live",
        "play/starting-soon",
        "play/replay",
        "play/series-continue",
        "play/series-watch",
        "play/continue-watching",
        "play/watch",
        "upcoming-live",
        "replay-coming-soon",
        "no-video",
        "cta-choose-plan",
        "cta-upgrade-plan",
        "cta-choose-plan-and-ppv",
        "cta-upgrade-plan-and-ppv",
        "cta-ppv-only",
        "cta-none",
      ];

      for (const expectedType of expectedTypes) {
        expect(
          coveredTypes.has(expectedType),
          `Missing fixture for CTA state: ${expectedType}`,
        ).toBe(true);
      }
    });
  });
});
