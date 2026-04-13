import { task, fs, process, git, artifact } from "@aosl/sdk-ts";

export default task({
  name: "repo.test",
  requires: [
    fs.read("package.json", "src/**"),
    process.run(["npm"], 30_000),
    git.read("."),
    artifact.emit("log"),
  ],
  async run({ git, process, artifact }) {
    const status = await git.status(".");
    if (status.modified.length > 0) {
      throw new Error("working tree dirty");
    }

    const result = await process.run("npm", ["test", "--json"], {
      cwd: ".",
      timeoutMs: 30_000,
    });

    const report = await artifact.emit({
      kind: "log",
      content: result.stdout,
    });

    return {
      ok: result.exitCode === 0,
      report,
    };
  },
});
