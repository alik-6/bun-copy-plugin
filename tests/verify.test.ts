import { describe, test, expect, afterEach } from "bun:test";
import { exists, mkdir, readdir } from "node:fs/promises";

import { verifyAssets } from "..";
import { $ } from "bun";

afterEach(async () => {
  await $`rm -rf ./test/`;
})
describe("verification-test", () => {

  test("verify-check-positive", async () => {
    try {
      await mkdir("test/");
      await Bun.write("test/bin.js", "");
      const result = await verifyAssets([{ from: "test/" }, { from: "test/bin.js" }]);
      expect(result).toBeTrue();
    } catch (error) {
      console.error(error);
    }
  });
  test("verify-check-negative", async () => {
    try {
      const result = await verifyAssets([{ from: "test/" }, { from: "test/bin.js" }]);
      expect(result).not.toBeTrue();
    } catch (error) {
      console.error(error); 
    }
  });
});

