/**
 * Unit tests for resolveModalState - the pure decision function
 * that determines what the SubscriptionModal should display.
 *
 * Tests cover:
 * - plans-only: content with subscription tiers, no PPV
 * - ppv-only: content with PPV, no subscription tiers (THE BUG FIX)
 * - plans-and-ppv: content with both subscription tiers and PPV
 * - no-options: content with neither (broken config)
 * - edge cases: disabled tiers, missing PPV fields
 * - real-world: exact bug scenario from the issue
 */

import { describe, it, expect } from "vitest";
import { resolveModalState } from "../resolveModalState";
import {
  plansOnlyFixtures,
  ppvOnlyFixtures,
  plansAndPpvFixtures,
  noOptionsFixtures,
  edgeCaseFixtures,
  realWorldModalFixtures,
  allModalFixtures,
} from "./fixtures";

describe("resolveModalState", () => {
  describe("plans-only (subscription tiers, no PPV)", () => {
    it.each(plansOnlyFixtures)("$name", ({ input, expected }) => {
      expect(resolveModalState(input)).toEqual(expected);
    });
  });

  describe("ppv-only (PPV content, no subscription tiers)", () => {
    it.each(ppvOnlyFixtures)("$name", ({ input, expected }) => {
      expect(resolveModalState(input)).toEqual(expected);
    });
  });

  describe("plans-and-ppv (both subscription tiers and PPV)", () => {
    it.each(plansAndPpvFixtures)("$name", ({ input, expected }) => {
      expect(resolveModalState(input)).toEqual(expected);
    });
  });

  describe("no-options (no tiers, no PPV)", () => {
    it.each(noOptionsFixtures)("$name", ({ input, expected }) => {
      expect(resolveModalState(input)).toEqual(expected);
    });
  });

  describe("edge cases", () => {
    it.each(edgeCaseFixtures)("$name", ({ input, expected }) => {
      expect(resolveModalState(input)).toEqual(expected);
    });
  });

  describe("real-world bug scenarios", () => {
    it.each(realWorldModalFixtures)("$name", ({ input, expected }) => {
      expect(resolveModalState(input)).toEqual(expected);
    });
  });

  // Sanity check: all fixtures combined
  it(`covers ${allModalFixtures.length} total scenarios`, () => {
    for (const fixture of allModalFixtures) {
      const result = resolveModalState(fixture.input);
      expect(result).toEqual(fixture.expected);
    }
  });
});
