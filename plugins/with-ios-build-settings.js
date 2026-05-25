const fs = require("fs");
const path = require("path");
const { createRunOncePlugin, withDangerousMod, withXcodeProject } = require("expo/config-plugins");

const DEPLOYMENT_TARGET = "16.5";
const PLUGIN_NAME = "with-ios-build-settings";
const PODFILE_MARKER_BEGIN = "# @aicar/with-ios-build-settings begin";
const PODFILE_MARKER_END = "# @aicar/with-ios-build-settings end";

function buildPodfileSnippet() {
  return [
    `    ${PODFILE_MARKER_BEGIN}`,
    `    deployment_target = podfile_properties['ios.deploymentTarget'] || '${DEPLOYMENT_TARGET}'`,
    "    installer.pods_project.targets.each do |target|",
    "      target.build_configurations.each do |config|",
    "        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = deployment_target",
    "      end",
    "    end",
    `    ${PODFILE_MARKER_END}`,
  ].join("\n");
}

function upsertPodfileDeploymentTarget(contents) {
  const platformPattern =
    /platform :ios, podfile_properties\['ios\.deploymentTarget'\] \|\| '\d+\.\d+'/g;

  let nextContents = contents.replace(
    platformPattern,
    `platform :ios, podfile_properties['ios.deploymentTarget'] || '${DEPLOYMENT_TARGET}'`
  );

  const snippet = buildPodfileSnippet();

  if (nextContents.includes(PODFILE_MARKER_BEGIN)) {
    const markerPattern = new RegExp(
      `${PODFILE_MARKER_BEGIN}[\\s\\S]*?${PODFILE_MARKER_END}`
    );
    return nextContents.replace(markerPattern, snippet.trim());
  }

  const reactNativePostInstallPattern =
    /(\n\s*react_native_post_install\(\n[\s\S]*?\n\s*\)\n)/m;

  if (!reactNativePostInstallPattern.test(nextContents)) {
    return nextContents;
  }

  return nextContents.replace(reactNativePostInstallPattern, `$1\n${snippet}\n`);
}

function normalizeLibrarySearchPaths(value) {
  if (!value) {
    return value;
  }

  const serialized = Array.isArray(value) ? value.join(" ") : String(value);

  if (!serialized.includes("usr/lib/swift") && !serialized.includes("$(inherited)")) {
    return value;
  }

  return ['"$(SDKROOT)/usr/lib/swift"', '"$(inherited)"'];
}

function withIosPodBuildSettings(config) {
  return withDangerousMod(config, [
    "ios",
    async (nextConfig) => {
      const podfilePath = path.join(nextConfig.modRequest.platformProjectRoot, "Podfile");

      if (!fs.existsSync(podfilePath)) {
        return nextConfig;
      }

      const contents = fs.readFileSync(podfilePath, "utf8");
      const nextContents = upsertPodfileDeploymentTarget(contents);

      if (nextContents !== contents) {
        fs.writeFileSync(podfilePath, nextContents);
      }

      return nextConfig;
    },
  ]);
}

function withIosXcodeBuildSettings(config) {
  return withXcodeProject(config, (nextConfig) => {
    const buildConfigurations = nextConfig.modResults.pbxXCBuildConfigurationSection();

    for (const [key, buildConfiguration] of Object.entries(buildConfigurations)) {
      if (key.endsWith("_comment") || !buildConfiguration.buildSettings) {
        continue;
      }

      const settings = buildConfiguration.buildSettings;

      if (settings.IPHONEOS_DEPLOYMENT_TARGET) {
        settings.IPHONEOS_DEPLOYMENT_TARGET = DEPLOYMENT_TARGET;
      }

      if (settings.LIBRARY_SEARCH_PATHS) {
        settings.LIBRARY_SEARCH_PATHS = normalizeLibrarySearchPaths(settings.LIBRARY_SEARCH_PATHS);
      }
    }

    return nextConfig;
  });
}

function withIosBuildSettings(config) {
  config = withIosPodBuildSettings(config);
  config = withIosXcodeBuildSettings(config);
  return config;
}

module.exports = createRunOncePlugin(withIosBuildSettings, PLUGIN_NAME, "1.0.0");
