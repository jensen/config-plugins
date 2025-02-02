import { XcodeProject } from "@bacons/xcode";
import * as xcodeParse from "@bacons/xcode/json";
import {
  BaseMods,
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  Mod,
  withMod,
} from "expo/config-plugins";
import * as fs from "fs";

const customModName = "xcodeProjectBeta-apple-settings";

export const withXcodeProjectBeta: ConfigPlugin<Mod<XcodeProject>> = (
  config,
  action
) => {
  return withMod(config, {
    platform: "ios",
    mod: customModName,
    action,
  });
};

const withXcodeProjectBetaBaseModInternal: ConfigPlugin = (config) => {
  return BaseMods.withGeneratedBaseMods(config, {
    platform: "ios",
    saveToInternal: true,
    skipEmptyMod: false,
    providers: {
      // Append a custom rule to supply AppDelegate header data to mods on `mods.ios.AppClipInfoPlist`
      [customModName]: BaseMods.provider<XcodeProject>({
        isIntrospective: false,
        // isIntrospective: true,
        async getFilePath({ _internal }) {
          return IOSConfig.Paths.getPBXProjectPath(_internal!.projectRoot);
        },
        async read(filePath) {
          try {
            return XcodeProject.open(filePath);
          } catch (error: any) {
            throw new Error(
              `Failed to parse the Xcode project: "${filePath}". ${error.message}}`
            );
          }
        },
        async write(filePath, { modResults, modRequest: { introspect } }) {
          if (introspect) {
            return;
          }
          const contents = xcodeParse.build(modResults.toJSON());
          if (contents.trim().length) {
            await fs.promises.writeFile(filePath, contents);
          }
        },
      }),
    },
  });
};

export const withXcodeProjectBetaBaseMod = createRunOncePlugin(
  withXcodeProjectBetaBaseModInternal,
  "withXcodeProjectBetaBaseMod"
);
