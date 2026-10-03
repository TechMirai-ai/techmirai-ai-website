# Pack 1 of 4: Clone into a new repository, then the recon plan

Steps **B0 to B8** and **C1**. The laptop setup (tools, ECC, running the clinic demo) is already done and is not repeated.

**Who runs what.** B0 to B8 are run **by hand, in PowerShell**, on the developer's Windows laptop. ECC is not used for them. The copy step is the one place where an accidental secret or database file would do real damage, so a person runs it and checks it. From **C1** on, ECC works **only inside the new repo folder**, never inside the clinic-demo folder.

Use the **same PowerShell window** from B0 to B7: the variables `$SRC`, `$DST` and `$IN` live only in that window. If she closes it, set them again (B0, B1 and B2 show how).

Commands are written as separate lines on purpose: older Windows PowerShell does not accept `&&`. If she uses Git Bash or WSL instead of PowerShell, tell Jamal before starting. These commands would need changing.

## Before starting (Jamal)

- [ ] The exact clinic-demo branch and commit to clone (decision 4), and the clinic folder has no uncommitted code changes.
- [ ] One folder named `_techmirai_inputs` **inside the clinic-demo folder** containing: the Spec PDF, its Markdown export if there is one, `TECHMIRAI_BROCHURE.html`, the logo SVG and favicon source, `clinic-demo-build-process.md`, `WORK-ORDER-00-RULEBOOK.md` and the four `PACK-*.md` files.
- [ ] A new, empty Neon Postgres database for this site (decision 3). The connection string goes to her through the password manager at B5, never by chat.
- [ ] An empty private GitHub repo named `techmirai-ai-website` (decision 2), created with **no** README, `.gitignore` or licence, and the developer added as collaborator.

**About the `_techmirai_inputs` folder.** Two cautions:

1. Keep everything in that one subfolder. Step B2 skips the whole folder when copying, so nothing from it can slip into the new repo's tracked files. The Spec is then copied in on purpose, to a git-ignored place.
2. Stop the clinic repo from ever committing it. The Spec's Section 1 contains private notes about Jamal, and the clinic repo may have collaborators or a remote. The command below is local to her copy of the clinic repo and is never committed.

---

### B0. Record the source commit and check the clinic folder is clean

```powershell
$SRC = "C:\path\to\clinic-demo-standalone"      # EDIT THIS to where the clinic demo is on her laptop
Add-Content "$SRC\.git\info\exclude" "`n_techmirai_inputs/"
git -C $SRC status --short
git -C $SRC rev-parse --short HEAD
```

Write the commit hash down: it is the "source commit" (you need it in B4).

**Done when:** `git status --short` shows no modified or deleted files (no lines starting with `M` or `D`). Untracked lines (`??`) are fine. If it shows changes to code, stop and ask Jamal. Cloning uncommitted work has caused trouble before.

★ **Checkpoint 1 (two minutes).** Send Jamal: the source commit; which planning command `/` shows in Claude Code inside the clinic folder (`/ecc:plan` or `/plan`); and which shell she uses. Do not wait for a reply unless the shell is not PowerShell.

### B1. Make the destination

```powershell
$DST = Join-Path (Split-Path $SRC -Parent) "techmirai-ai-website"
if (Test-Path $DST) { throw "Destination already exists: $DST" }
New-Item -ItemType Directory -Path $DST | Out-Null
$DST
```

The new folder sits **next to** the clinic folder, never inside it. I am not certain it will matter on her machine, but a short path (for example `C:\dev\...`) avoids Windows' 260-character path limit when `node_modules` is installed. If the clinic folder path is long, set `$DST` by hand to a short one.

### B2. Copy with exclusions

First a **dry run**. `/L` only lists what would be copied and copies nothing. Read the list.

```powershell
robocopy "$SRC" "$DST" /E /L /XD .git node_modules .next .turbo .vercel .data coverage test-results playwright-report _techmirai_inputs /XF .env .env.local .env.development .env.production .env.test .env.*.local *.db *.db-journal *.log .DS_Store settings.local.json
```

If the list looks right, run the real copy: **the same command without `/L`**.

```powershell
robocopy "$SRC" "$DST" /E /XD .git node_modules .next .turbo .vercel .data coverage test-results playwright-report _techmirai_inputs /XF .env .env.local .env.development .env.production .env.test .env.*.local *.db *.db-journal *.log .DS_Store settings.local.json
$LASTEXITCODE
```

`robocopy` exit codes below 8 mean success (0 to 7). 8 or higher means a failure: stop and send the output to Jamal. Folder names after `/XD` are skipped at any depth.

Now look for any environment file that slipped through. **Expect no output.** Anything listed must be deleted from the **copy** (never from the source):

```powershell
Get-ChildItem "$DST" -Recurse -Force -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -like ".env*" -and $_.Name -ne ".env.example" -and $_.FullName -notmatch "\\node_modules\\" }
```

Then bring in the inputs, the rulebook and the packs:

```powershell
$IN = Join-Path $SRC "_techmirai_inputs"
New-Item -ItemType Directory -Force "$DST\docs\_inputs", "$DST\docs\packs" | Out-Null
Get-ChildItem $IN -File | Where-Object { $_.Name -notlike "PACK-*" -and $_.Name -notlike "WORK-ORDER-*" } | Copy-Item -Destination "$DST\docs\_inputs"
Copy-Item "$IN\WORK-ORDER-00-RULEBOOK.md" "$DST\docs\WORK-ORDER.md"
Copy-Item "$IN\PACK-*.md" "$DST\docs\packs"
Add-Content "$DST\.gitignore" "`ndocs/_inputs/"
```

**Do not copy:** `.git` history, any `.env*` except the example, `node_modules`, caches, local databases, anything specific to the clinic's deployment. (The command above already skips them.)

### B3. Verify the copy

```powershell
Test-Path "$DST\.git"
Get-ChildItem "$DST" -Recurse -Force -File -ErrorAction SilentlyContinue | Where-Object { ($_.Extension -in ".db", ".db-journal", ".pdf") -and $_.FullName -notmatch "\\node_modules\\" } | Select-Object -ExpandProperty FullName
git -C $SRC status --short
```

**Expect:** the first line prints `False` (no `.git` in the copy). The second lists only the Spec PDF under `docs\_inputs` and nothing else (no `.db` files). The third shows the same as in B0: the clinic folder is untouched.

### B4. Fresh git history

Create `docs\CLONE-LOG.md` in an editor with: the source commit (from B0), today's date, and the exclusion list from B2. Then:

```powershell
cd $DST
git init -b main
git add -A
git status --short
```

Read the `git status` output. There must be **no** `.env.local`, no stray media, and nothing under `docs/_inputs`. You may see "LF will be replaced by CRLF" warnings on Windows. I believe they are harmless, but if you are unsure, send a screenshot to Jamal before committing.

```powershell
git commit -m "Initial commit: techmirai-ai-website cloned from clinic-demo-standalone @ <SOURCE_COMMIT>"
git tag clone-baseline
```

### B5. Own environment and own database

1. `Copy-Item .env.example .env.local`
2. Jamal sends the new database connection string (decision 3) and the other secrets through the password manager. Paste them into `.env.local` in an editor.
3. Open the new `.env.local` and the clinic folder's `.env.local` side by side. The database address **must be different**. This is the clone summary's rule: never share a database between sites. Do not paste either file into chat.
4. Create the tables on the new database with the repo's bootstrap script. The README documents it (project notes call it `pnpm db:bootstrap`).

### B6. Install the guardrails (by hand)

1. Open `CLAUDE.md` in an editor and **merge in** the block from section 1.5 of `docs\WORK-ORDER.md`. Do not overwrite what is already there.
2. Create or merge `.claude\settings.json` so terminal sessions start in plan mode. Merge, do not overwrite other settings:

```json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

(Per the Claude Code docs this applies to terminal sessions. The VS Code extension's chat panel ignores project settings for this: set `claudeCode.initialPermissionMode` to `plan` in your VS Code user settings.)

3. Create three small files:

```powershell
"# Placeholder register" | Set-Content docs\PLACEHOLDER-REGISTER.md
"# Engine fixes" | Set-Content docs\ENGINE-FIXES.md
"# Findings" | Set-Content docs\FINDINGS.md
```

### B7. Verify it stands alone, then push

```powershell
pnpm install
pnpm typecheck
pnpm dev
```

`pnpm dev` still shows the **clinic** content. That is expected for now. Stop it with Ctrl+C, then check that nothing points back at the clinic folder (the clone summary's "zero hits" check):

```powershell
$pat = @($SRC, $SRC.Replace('\','/'), 'client-work\clinic-demo-standalone', 'client-work/clinic-demo-standalone')
Get-ChildItem "$DST" -Recurse -Force -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\(node_modules|\.next|\.git|docs)\\' } | Select-String -SimpleMatch -Pattern $pat -ErrorAction SilentlyContinue | Select-Object -First 20
```

Any hit is a bug to report to Jamal. Mentions of the folder name in the README or docs are cleaned up later, in D1.

Then commit and push to the empty private repo:

```powershell
git add -A
git commit -m "B: guardrails, plan-mode default, docs scaffolding"
git remote add origin https://github.com/<OWNER>/techmirai-ai-website.git
git push -u origin main --tags
```

If password sign-in fails, use a Personal Access Token with the `repo` scope, as in the clone summary. **Do not** tick "Template repository". This is a real site, not a template.

### B8. ★ Checkpoint 2

Send Jamal: the repo link, `git log --oneline` (two commits), and confirmation that typecheck passes and the clinic folder is untouched (`git -C $SRC status --short` as in B3).

---

## From here, ECC does the work

Open a terminal **inside the new repo folder** (`cd $DST`), start `claude`, and check the status bar says `plan mode on`. Then:

**How to run a pack (every step, every time)**

1. Fresh session for each pack, ideally for each step: type `/clear`, or exit and start `claude` again. (`/clear` should be in the `/` menu; if your version does not list it, exit and restart.) `CLAUDE.md` is re-read each time, so the standing rules are never lost.
2. Check the status bar says `plan mode on`. If it does not, press **Shift+Tab** until it does.
3. Paste the session opener (below) **once per session**.
4. Paste **ONE** step block. Never paste a whole pack.
5. Review the plan with the checklist in section 1.2 of the rulebook. "No, keep planning" if anything is missing.
6. Approve with **"Yes, and use auto mode"** (or "Yes, auto-accept edits" if that is what your account shows). Never bypass permissions.
7. Check every "Done when" item yourself (the browser for anything visual). Then commit by hand: `<step id>: <what changed>`.
8. At every ★, send Jamal: commit hash, a screenshot or two, open questions.

**Session opener** (paste once per session, before the first step block):

```text
Read CLAUDE.md and docs/WORK-ORDER.md sections 1.2, 1.3 and 1.4 (plan checklist, the six common
gates, stop-and-ask triggers). Then wait. I will paste one step at a time. Every step starts in
plan mode: no edits until I approve a written plan. "The six common gates" in a step means
section 1.3.
```

Two things to report at C1:

- Does the plan approval prompt show **"Yes, and use auto mode"**? (Or "Yes, auto-accept edits"?) Tell Jamal which one.
- `docs/_inputs` is git-ignored, so ECC's searches may skip it. Tell ECC to open files there by their exact path.

### C1. Recon and master plan (plan only) ★

```text
Plan only. Make no edits until I approve.
STEP C1 — Recon and master plan. PLAN ONLY. Write no source code and change no files until I approve.
Read: the whole Spec (docs/_inputs; open files there by exact path), the clone summary in docs/_inputs, docs/WORK-ORDER.md, docs/packs/, README,
the app's site config, packages/cms-core (blocks, collections, globals, seed, booking, styles),
packages/reception-engine, package.json scripts, and the existing tests.
Produce, as the plan (I will have you save it as docs/CLONE-PLAN.md after approval):
1. Block inventory: every registered block (shared, clinic-gated, recruitment-gated), one line
   each: what it does and which Spec section could use it.
2. Section map: for each Spec section and sub-section (4 through 19), one of: existing block,
   existing block with changes, new block, or config only. Block names in the Spec are only
   indicative; the Spec's author could not open the live demo.
3. Route map: the 20 public routes, the 3 legal routes, and the redirects in Spec 17.2. For each:
   exists / change / new. List every leftover clinic-template route that must go.
4. Schema changes: each new or changed collection, global and field, and how each is migrated
   additively on Postgres in this repo.
5. Leftover inventory: counts and file lists for Sakura, the Japanese spelling of Sakura,
   sakura-sekkotsu, Sadiatec, .example, .invalid, Demo Blog Post, Demo Service Brochure, clinic-demo,
   and any clinic or medical wording in config and metadata.
6. Placeholder register skeleton: the 21 items in Spec Section 1, plus every other [bracket] or
   CONFIRM found anywhere in the Spec.
7. Truth check for Spec 11.5 (technology table): for each row, what package.json and env usage
   actually prove, and which rows need [CONFIRM].
8. Chat engine check (Spec 16): does the engine already have typed-question matching against
   approved answers (layer 2), an LLM fallback restricted to pages flagged for AI (layer 3), an
   "AI may read" flag, and a hand-off? List what exists and what would have to be built.
9. Risks and questions for Jamal, including every place the Spec contradicts itself or the engine.
10. The step list D1 to O3 (the table "The whole job at a glance" in docs/WORK-ORDER.md and the
    files in docs/packs/), adjusted if you recommend splitting or
    merging steps, with dependencies.
Do not touch the original clinic folder. Do not run seeds or migrations.
```

**You check:** the plan covers all 10 items and every Spec section appears in the section map. Send the plan to Jamal. **Do not approve it until Jamal has answered item 9.** After approval, ECC saves `docs/CLONE-PLAN.md`. You commit.

★ **Checkpoint 3.**

---

**Pack 1 is finished when Checkpoint 3 is signed off by Jamal.** Next: Pack 2.
