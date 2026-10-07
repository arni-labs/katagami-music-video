# Running it with several agents

Read this when more than one agent works on the film. It applies to both modes. Several agents speed up a film of 40 to
220 scenes or shots, and they add their own failures.

## 1. Owners and the lead

- **One owner per file set:** a section's scene files, the shared plates, the type layer, the page. Nobody edits
  another owner's files; they message the owner. Shared library files only gain exports. Reason: on a past film an
  owner pruned a helper before another owner's import changed, and a dozen scenes rendered as placeholder cards.
- **One lead** routes every request and decision, and commits. Owners report to the lead.
- **The lead ships the shared pieces first:** the looks registry, the layout and QA helpers, the language API. The
  others work on other notes until those land. On a past film the language API landed within 45 minutes this way.
- **Give every owner:** one brief file (the bar, the hard rules, the APIs, the test commands, the deadline as a clock
  time), one finished reference scene or shot to copy, and its own ids. Reason: a binding brief and a reference to copy
  is what let eight builders work in parallel on a past film.
- **A review agent** renders the whole film every 60 to 90 minutes and ranks problems against the bar. Reviewers score
  contact sheets, not descriptions ([qa.md](qa.md), "The review pass").

## 2. Sign-offs and renders

- An owner signs off a file by its modification time ("section-4.js at 09:26:05"). The lead renders from a frozen copy of
  the app taken at that sign-off, never from the live folder. Reason: an owner edited again three minutes after signing
  off; a render from the live folder would have mixed two versions across its chunks.
- Before rejoining a render, compare the newest freeze with the live folder (`diff -rq`), and prove every chunk kept
  from an older render with a pixel diff of stills against the joined film.
- To try a change inside another owner's scene, make a shadow copy: a folder of symlinks to the project with one
  patched file, then build or shoot from it (a canvas engine's shooter takes it as `--app <dir>`; for HyperFrames run
  the build inside it). The owner's file is never touched.
- Give each version of an output a new name. Reason: messages arrive late (below), and a reviewer reading the old name
  reviews the wrong film.
- Read every pending message before you rename a final into place. Reason: a vetoed change was locked into a final
  over the good picture because the veto was still unread.

## 3. Messages arrive late

Teammates read messages between their own turns. On past films orders landed 30 to 90 minutes late, and notices of a
finished background job reached an agent one to two hours late.

- Before a long render, ask the owner for a one-line plan reply, so a stale order is caught before it costs a render.
- For an urgent stop, ask for an acknowledgement.
- Check a job's state directly (its output file, its PID) instead of waiting for its notice.
- Report a finished film in the same turn its job ends, with paths and frame counts. Reason: twice a joined film sat
  finished and unreported for one to two hours.
- Run `date` before writing any time into a message or report. Reason: agents wrote wrong clock times more than once
  after a long turn.

## 4. The machine

- Run four or five headless browsers at once, not eight. Reason: eight restarted the container. A slot lock (a script
  that waits for a free slot before it starts a browser) keeps parallel owners under the limit.
- Wait on a process by its PID. Reason: a wait loop on `pgrep -f "node render/x"` never ends, because the loop's own
  command line contains the pattern.
- Stop only processes you started. Never kill by name. Reason: other owners' renders share the machine.
- In zsh (the macOS default shell), an unquoted variable is one word: `F="--frame tall"; node shoot.mjs $F` passes one
  argument, and the shooter ignored it and rendered the wrong shape. Write render loops in a `#!/bin/bash` script, and
  check one output's size before trusting a batch.
- Under heavy load, timings swing two to three times. Compare a before and after interleaved, keep the fastest of three,
  and prove correctness with frame hashes, not with timing.
- A usage limit stops every agent at once. Before resuming one, check what it was writing: a capture it was writing
  was left truncated (check the frame count with `ffprobe`).

## 5. Paid generation

- Send every paid call through one small runner that writes a ledger line per call (prompt, inputs, output file, cost,
  time) and skips work whose output already exists. Reason: the account balance ran out mid-run twice on a past video;
  with the ledger and the output folder as the cache, the run resumed where it stopped.
- Keep one list of take name prefixes in one file. Reason: four copies of the list drifted, and new takes with a
  missing prefix silently vanished from the edit.
- Write a resume file (what is done, what is next) after every step, so any agent can pick the run up.

## Done when

- [ ] Every file set has one owner, and the lead holds the brief, the bar and the reference scene.
- [ ] Every render came from a frozen copy at a recorded sign-off, and kept chunks were proved by a pixel diff.
- [ ] Every paid call is in the ledger.
