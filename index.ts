import { exists, mkdir, readdir } from "node:fs/promises";
import { join, parse } from "node:path";
import type { Dirent } from "node:fs";
import type { BunPlugin } from "bun";

export interface AssetConfig {
  from: string;
  to?: string;
}

export interface CopyPluginConfig {
  assets: AssetConfig[];
  verify: boolean;
  verbose: boolean;
}

let verbose = false;

const verboseLog = (message: any) => {
  if (verbose) {
    console.log(message);
  }
};

export const verifyAssets = async (assets: AssetConfig[]): Promise<boolean> => {
  const assetChecks = assets.map(async (asset) => ({
    verified: asset.from && (await exists(asset.from)),
    asset: asset,
  }));

  const results = await Promise.all(assetChecks);
  return results.every((result) => {
    if (!result.verified) verboseLog(`Failed to verify ${result.asset.from}`);
    return result.verified;
  });
};

export const handleFile = async (asset: AssetConfig): Promise<void> => {
  const file = parse(asset.from);
  const to = asset.to?.endsWith("/") ? asset.to + file.base : asset.to ?? "";
  try {
    await Bun.write(to, Bun.file(asset.from));
    verboseLog(`Copied file ${file.base} ${asset.from} => ${to}`);
  } catch (error) {
    console.error(error);
  }
};

export const handleDir = async (asset: AssetConfig): Promise<void> => {
  try {
    const doesExists = await exists(asset.to);
    if (!doesExists) await mkdir(asset.to!, { recursive: true });
    const files = await readdir(asset.from, { withFileTypes: true });
    await Promise.all(
      files.map(async (file: Dirent) => {
        const to = join(asset.to!, file.name);
        const from = join(asset.from, file.name);
        if (file.isDirectory()) {
          await handleDir({ to, from });
        } else {
          await handleFile({ to, from });
        }
      })
    );
  } catch (error) {
    console.error(error);
  }
};
/**
 * @description A utility plugin for copying files and directories during the build process using Bun.
 * @param {CopyPluginConfig} config - The configuration object for the Copy Plugin.
 * @returns {BunPlugin} - The Bun plugin instance.
 */
const CopyPlugin = (config: CopyPluginConfig): BunPlugin => {
  return {
    target: undefined,
    name: "@alik6/bun-copy-plugin",
    async setup(build) {
      if (config.verbose) {
        verbose = true;
      }
      if (config.verify) {
        const isVerified = await verifyAssets(config.assets);
        if (!isVerified) {
          console.log(`Failed to verify assets.`);
          return
        }
      }
      for (const asset of config.assets) {
        const to = asset.to ? asset.to : build.config.outdir ?? "dist/";
        if (!asset.from.endsWith("/")) {
          await handleFile({ from: asset.from, to });
        } else {
          await handleDir({
            to,
            from: asset.from,
          });
        }
      }

    },
  };
};

export { CopyPlugin as Copy };
