import { useState } from "react";
import { useDebug } from "~/contexts/DebugProvider";
import { USER_TIER_OPTIONS } from "~/lib/debug/mockUsers";
import type { UserTierOverride } from "~/lib/debug/mockUsers";
import type { ComponentFilterMode } from "~/contexts/DebugProvider";
import { useUser } from "~/hooks/useUser";
import { Z_INDEX } from "~/lib/constants";

export function DebugMenu() {
  const { debug, localeInfo, updateDebugState } = useDebug();
  const { isLoggedIn, user, subscriptionTier } = useUser();
  const [componentInput, setComponentInput] = useState("");

  console.log('🐛 [DebugMenu] Rendering with user data:', {
    isLoggedIn,
    user,
    subscriptionTier,
  });

  if (!debug.isEnabled) return null;

  const handleAddComponent = () => {
    const trimmed = componentInput.trim();
    if (!trimmed) return;

    // Split by comma or space and filter out empty strings
    const newComponents = trimmed
      .split(/[,\s]+/)
      .map(c => c.trim())
      .filter(c => c && !debug.componentFilters.includes(c));

    if (newComponents.length > 0) {
      updateDebugState({
        componentFilters: [...debug.componentFilters, ...newComponents],
      });
      setComponentInput("");
    }
  };

  const handleRemoveComponent = (component: string) => {
    updateDebugState({
      componentFilters: debug.componentFilters.filter(c => c !== component),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddComponent();
    }
  };

  return (
    <div className={`fixed top-16 right-16 ${Z_INDEX.header} bg-black/80 backdrop-blur-md text-white p-16 rounded-lg shadow-xl border border-white/20 min-w-[280px] max-h-[80vh] overflow-y-auto`}>
      <h3 className="font-bold mb-12 text-14">🐛 Debug Tools</h3>

      {/* Current User State */}
      <div className="mb-12 pb-12 border-b border-white/20">
        <div className="text-12 font-medium mb-8">Current User State</div>
        <div className="space-y-4 text-10 font-mono">
          <div>
            <span className="text-white/60">Logged In:</span>{" "}
            <span className={isLoggedIn ? "text-green-400" : "text-red-400"}>
              {isLoggedIn ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <span className="text-white/60">Tier:</span>{" "}
            <span className="text-cyan-400">{subscriptionTier || "none"}</span>
          </div>
          {user && (
            <>
              <div>
                <span className="text-white/60">Customer ID:</span>{" "}
                <span className="text-white">{user.shopifyCustomerId || "null"}</span>
              </div>
              <div>
                <span className="text-white/60">Email:</span>{" "}
                <span className="text-white">{user.email || "null"}</span>
              </div>
              <div>
                <span className="text-white/60">PPV Tags:</span>{" "}
                <span className="text-white">{user.ppv?.join("|") || "none"}</span>
              </div>
            </>
          )}
          {!user && (
            <div className="text-white/60 italic">No user data</div>
          )}
        </div>
      </div>

      {/* Locale Info */}
      <div className="mb-12 pb-12 border-b border-white/20">
        <div className="text-12 font-medium mb-8">Locale</div>
        <div className="space-y-4 text-10 font-mono">
          <div>
            <span className="text-white/60">Language:</span>{" "}
            <span className="text-cyan-400">{localeInfo.language}</span>
          </div>
          <div>
            <span className="text-white/60">Country:</span>{" "}
            <span className="text-cyan-400">{localeInfo.country}</span>
          </div>
          <div>
            <span className="text-white/60">Source:</span>{" "}
            <span className={
              localeInfo.languageSource === 'user_preferences' ? 'text-green-400' :
              localeInfo.languageSource === 'url' ? 'text-yellow-400' :
              localeInfo.languageSource === 'cookie' ? 'text-purple-400' :
              localeInfo.languageSource === 'user_selection' ? 'text-blue-400' :
              'text-white/80'
            }>
              {localeInfo.languageSource}
            </span>
          </div>
          {localeInfo.serverPreferredLanguage && (
            <div>
              <span className="text-white/60">Server Pref:</span>{" "}
              <span className="text-green-400">{localeInfo.serverPreferredLanguage}</span>
            </div>
          )}
          {localeInfo.cookieLanguage && (
            <div>
              <span className="text-white/60">Cookie:</span>{" "}
              <span className="text-purple-400">{localeInfo.cookieLanguage}</span>
            </div>
          )}
        </div>
      </div>

      {/* User Tier Override */}
      <div className="mb-12 pb-12 border-b border-white/20">
        <label className="block mb-8">
          <span className="text-12 font-medium block mb-4">User Tier Override</span>
          <select
            value={debug.userTierOverride}
            onChange={(e) => {
              const newTier = e.target.value as UserTierOverride;
              // Update URL param
              const url = new URL(window.location.href);
              if (newTier === 'real-user') {
                url.searchParams.delete('debugTier');
              } else {
                url.searchParams.set('debugTier', newTier);
              }
              // Navigate to new URL (causes reload)
              window.location.href = url.toString();
            }}
            className="w-full bg-white/10 text-white text-12 px-8 py-6 rounded cursor-pointer hover:bg-white/20 border border-white/20"
          >
            {USER_TIER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-black">
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {debug.userTierOverride !== "real-user" && (
          <div className="mt-6 text-10 text-yellow-400">
            ⚠️ Using mock user data
          </div>
        )}
      </div>

      {/* Debug Options */}
      <div className="space-y-8">
        <label className="flex items-center gap-8 cursor-pointer hover:bg-white/10 p-4 rounded">
          <input
            type="checkbox"
            checked={debug.showVideoIds}
            onChange={(e) => updateDebugState({ showVideoIds: e.target.checked })}
            className="w-16 h-16 cursor-pointer"
          />
          <span className="text-12">Show Video IDs</span>
        </label>
        <label className="flex items-center gap-8 cursor-pointer hover:bg-white/10 p-4 rounded">
          <input
            type="checkbox"
            checked={debug.showBoxes}
            onChange={(e) => updateDebugState({ showBoxes: e.target.checked })}
            className="w-16 h-16 cursor-pointer"
          />
          <span className="text-12">Show Boxes</span>
        </label>

        {/* Component Filters - Only show when boxes are enabled */}
        {debug.showBoxes && (
          <div className="mt-12 pt-12 border-t border-white/20 space-y-8">
            <div className="text-12 font-medium">Component Filters</div>

            {/* Filter Mode */}
            <div className="space-y-4">
              <label className="flex items-center gap-6 cursor-pointer text-11">
                <input
                  type="radio"
                  name="filterMode"
                  value="show-all"
                  checked={debug.componentFilterMode === "show-all"}
                  onChange={(e) => updateDebugState({ componentFilterMode: e.target.value as ComponentFilterMode })}
                  className="w-12 h-12 cursor-pointer"
                />
                <span>Show All Components</span>
              </label>
              <label className="flex items-center gap-6 cursor-pointer text-11">
                <input
                  type="radio"
                  name="filterMode"
                  value="show-only"
                  checked={debug.componentFilterMode === "show-only"}
                  onChange={(e) => updateDebugState({ componentFilterMode: e.target.value as ComponentFilterMode })}
                  className="w-12 h-12 cursor-pointer"
                />
                <span>Show Only (whitelist)</span>
              </label>
              <label className="flex items-center gap-6 cursor-pointer text-11">
                <input
                  type="radio"
                  name="filterMode"
                  value="ignore"
                  checked={debug.componentFilterMode === "ignore"}
                  onChange={(e) => updateDebugState({ componentFilterMode: e.target.value as ComponentFilterMode })}
                  className="w-12 h-12 cursor-pointer"
                />
                <span>Ignore (blacklist)</span>
              </label>
            </div>

            {/* Add Component Input */}
            {debug.componentFilterMode !== "show-all" && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={componentInput}
                    onChange={(e) => setComponentInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ComponentName"
                    className="flex-1 bg-white/10 text-white text-11 px-6 py-4 rounded border border-white/20 focus:outline-none focus:border-white/40"
                  />
                  <button
                    onClick={handleAddComponent}
                    disabled={!componentInput.trim()}
                    className="px-8 py-4 bg-white/20 hover:bg-white/30 disabled:bg-white/5 disabled:text-white/30 text-11 rounded border border-white/20 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <div className="text-9 text-white/50">
                  Tip: Check console for available components. Separate multiple with spaces or commas.
                </div>

                {/* Current Filters */}
                {debug.componentFilters.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-10 text-white/60">
                      Current {debug.componentFilterMode === "show-only" ? "whitelist" : "blacklist"}:
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {debug.componentFilters.map((component) => (
                        <button
                          key={component}
                          onClick={() => handleRemoveComponent(component)}
                          className="px-6 py-2 bg-white/10 hover:bg-red-500/20 text-10 rounded border border-white/20 hover:border-red-500/40 flex items-center gap-4 cursor-pointer group"
                        >
                          <span className="font-mono">{component}</span>
                          <span className="text-white/40 group-hover:text-red-400">×</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 pt-12 border-t border-white/20 text-10 text-white/60">
        Press Ctrl+Shift+D to close
      </div>
    </div>
  );
}
