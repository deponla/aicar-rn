const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;
const reactNativeShimPath = path.resolve(__dirname, "shims/react-native.js");

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (
        moduleName === "react-native" &&
        context.originModulePath !== reactNativeShimPath
    ) {
        return {
            type: "sourceFile",
            filePath: reactNativeShimPath,
        };
    }

    if (defaultResolveRequest) {
        return defaultResolveRequest(context, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
