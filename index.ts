import { type BunPlugin, type PluginBuilder } from "bun";
import { exists, mkdir, readdir } from "node:fs/promises";
import { join, parse } from "node:path";
import type { Dirent } from "node:fs";
export type CopyPluginConfig = {
  assets: { from: string; to?: string }[];
  verify: boolean;
};

const verifyAssets = async (config: CopyPluginConfig) => {
  const assetChecks = config.assets.map(
    async (asset) => asset.from && (await exists(asset.from))
  );

  const results = await Promise.all(assetChecks);
  return results.every((result) => result);
};

const handleFile = (asset: { to: string; from: string }) => {
  const file = parse(asset.from);
  if (asset.to.endsWith("/")) asset.to += `/${file.base}`;
  Bun.write(asset.to, Bun.file(asset.from)).catch((e) => console.error(e));
};

const handleDir = (asset: { to: string; from: string }) =>
  exists(asset.to).then(async (exists) => {
    if (!exists) await mkdir(asset.to!, { recursive: true });
    readdir(asset.from, { withFileTypes: true }).then((files: Dirent[]) => {
      const promises: readonly Promise<void>[] = files.map(async (file) => {
        const to = join(asset.to, file.name);
        const from = join(asset.from!, file.name);
        if (file.isDirectory()) {
          await handleDir({ to, from });
        } else {
          handleFile({ to, from });
        }
      });
      Promise.all(promises).then(() => {});
    });
  });

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
      if (config.verify) {
        const isVerified = await verifyAssets(config);
        if (!isVerified) throw Error(`[${this.name}] Failed to verify assets.`);
      }
      config.assets.forEach((asset) => {
        const to = asset.to ? asset.to : build.config.outdir ?? "dist/";
        if (!asset.from.endsWith("/")) {
          handleFile({ from: asset.from, to: to });
        } else {
          handleDir({
            to: to,
            from: asset.from,
          });
        }
      });
    },
  };
};

export { CopyPlugin as Copy };
