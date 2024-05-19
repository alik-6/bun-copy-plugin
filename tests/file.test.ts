import { expect, afterEach, describe, test } from "bun:test";
import { handleFile } from "..";
import * as fs from "node:fs/promises";
import { $ } from "bun";
afterEach(async () => {
  await $`rm -rf test/`;
});

describe("file-test", () => {
  test("same-directory-file-copy-test", async () => {
    await $`mkdir test`;
    await $`touch test/out.ts`;
    await handleFile({ to: "test/app.ts", from: "test/out.ts" });
    expect(await fs.exists("test/out.ts")).toBeTrue();
  });
  test("different-directory-file-copy-test", async () => {
    await $`mkdir test`;
    await $`mkdir test/2/`;
    await $`touch test/out.ts`;
    await handleFile({ to: "test/2/", from: "test/out.ts" });
    expect(await fs.exists("test/2/out.ts")).toBeTrue();
  });
});
