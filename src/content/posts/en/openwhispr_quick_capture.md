---
title: "Capturing an idea by voice on Linux with OpenWhispr, without leaving my IDE"
date: "2026-09-05"
author: "Xavier GUERET"
description: "On Ubuntu 24.04 in a Wayland session: OpenWhispr running fully locally (Whisper for transcription, Mistral Nemo for cleanup), a bash script, ydotool and a GNOME shortcut. F10 opens a popup, I dictate my idea, Enter files it into a sticky note — my IDE never loses focus."
tags:
  - "OpenWhispr"
  - "Whisper"
  - "Mistral"
  - "linux"
  - "Wayland"
  - "bash"
  - "productivity"
categories:
  - "Tutorials"
  - "Personal Projects"
image: "/images/posts/openwhispr_quick_capture.png"
draft: false
toc: true
---

I'm in the middle of coding when something crosses my mind. A bug I've just remembered on a completely different project. An idea for a tool I might write some day. An article to read later, something not to forget before Friday. What they have in common: none of it relates to what I'm doing at that exact moment, and that's precisely what makes it fragile. If I don't write it down right now, it's gone.

But opening an editor, finding the right file, then getting back to my IDE — that's too high a price for one sentence, so I don't do it, and it evaporates. What I needed was a single gesture: one key, I speak, Enter, and I'm already back in my code.

That's exactly the gesture I rigged up on my **Linux** machine, on top of **OpenWhispr**, with about sixty lines of bash and a GNOME shortcut. Everything that follows is anchored in that environment — Ubuntu 24.04, GNOME, Wayland session — and I flag at each step what changes elsewhere, because most of the building blocks transpose without much trouble. Before showing the setup, a word about OpenWhispr, which is the central piece.

## OpenWhispr: voice dictation, running locally

[OpenWhispr](https://openwhispr.com/) is an open-source (MIT-licensed) voice-to-text application, positioned as the free alternative to tools like WisprFlow. The official repository lives on [GitHub](https://github.com/OpenWhispr/openwhispr). It's a cross-platform desktop app (macOS, Windows, Linux — AppImage, `.deb`, `.rpm`) built on **Electron**.

The general usage model is simple: a global hotkey starts recording, you speak, you press it again, and the transcribed text is typed **wherever your cursor is**, in any application. No dedicated window to copy-paste from — the dictation lands directly in the tool you're already using.

The point that won me over: everything can run **entirely locally**, not just the transcription. OpenWhispr bundles two engines. [whisper.cpp](https://github.com/ggml-org/whisper.cpp), the C++ implementation of OpenAI's Whisper model, handles speech recognition — NVIDIA's Parakeet model is an alternative. Then [llama.cpp](https://github.com/ggml-org/llama.cpp) runs a second model, an LLM this time, for the cleanup pass: it punctuates the raw transcript, strips hesitations and puts the sentence back on its feet.

That second stage is the one people tend to forget when discussing local dictation, and it accepts any model in GGUF format. On my machine it runs on **Mistral Nemo 12B Instruct**, quantized to Q4_K_M (around 7 GB), with Vulkan GPU acceleration. The whole configuration fits in three lines:

```bash
CLEANUP_PROVIDER=local
LOCAL_CLEANUP_MODEL=mistral-nemo-12b-instruct-q4_k_m
LLAMA_VULKAN_ENABLED=true
```

That's what makes the text land in the popup already clean, ready to file without touch-ups. A bring-your-own-key cloud mode exists for those who prefer it, but with both stages local, nothing leaves the machine — and I have no use for it.

On my machine, OpenWhispr is bound to **F8**: F8 starts recording, F8 stops it, the text appears at the cursor. That baseline setup works everywhere — terminal, browser, IDE — and it's the prerequisite for everything that follows.

## My need: capturing without switching context

Dictation alone isn't enough. If I press F8 while coding, the dictated text lands... in my code. I need an input field that pops up over my IDE, catches the dictation, and files the result in the right place before disappearing.

The target gesture:

1. **F10** — a small popup appears and OpenWhispr starts recording on its own;
2. I dictate: "the verbose flag doesn't apply to the CLI's subcommands";
3. **F8** (or F10 again) — dictation stops, the text appears in the field;
4. **Enter** — the popup vanishes, a sticky note appears on the desktop, a notification confirms it.

My IDE never lost focus, and F8 remains my normal dictation key everywhere else.

The destination deserves a word, because it's what changed most since my first version. I originally appended to a plain `~/inbox.md`. That worked, but sorting stayed on me: reread, classify, decide. Today the capture creates an **xpad sticky note** on the desktop, and a second tool handles the filing — more on that at the end. The text file hasn't disappeared, though; it now serves as a safety net when xpad isn't available.

## Building block 1: simulating F8 on Wayland with ydotool

The whole setup rests on one assumption: a script can "press" F8 for me, and OpenWhispr will see it. On X11, `xdotool` has done this forever. On Wayland it's impossible by design: applications are isolated from each other — a client can neither spy on nor drive the others. To inject a keystroke you have to go below Wayland, at the kernel level: that's what **ydotool** does, by writing to `/dev/uinput`.

Best to validate this block first, in isolation:

```bash
sudo apt install ydotool
ydotool key f8    # should start OpenWhispr, exactly like a physical keypress
ydotool key f8    # run again: recording stops
```

If both calls trigger dictation, the block is validated. Two things I learned along the way:

- The `ydotoold backend unavailable` notice is **not an error**: without the daemon, ydotool writes straight to `/dev/uinput`, which is plenty here. No need to run `ydotoold`.
- Online docs often show the keycode syntax (`key 66:1 66:0`). On Ubuntu 24.04's 0.1.8 build, the **name** form (`key f8`) is what actually triggered OpenWhispr for me. Always test the real key instead of trusting a syntax.

If `ydotool key f8` does nothing and prints no error, check your uinput access: `ls -l /dev/uinput` and `id`, then if needed `sudo usermod -aG input "$USER"` and log back in.

## Building block 2: the capture script

The core requirement is "zero friction": a single command must open the input field, place the cursor in it, and start dictation. It also has to handle the reflex double-press on F10 — no second popup allowed; that second press should simply stop the dictation.

Here is `~/.local/bin/idee` in its current form:

```bash
#!/usr/bin/env bash
# idee - Quick capture of an idea or task into an xpad sticky note
set -euo pipefail

F8="f8"
OUT=/tmp/idee.$UID.txt
FALLBACK="${IDEE_FALLBACK:-$HOME/inbox.md}"   # fallback when xpad is unavailable
SEP=$'\x1f'                                   # invisible separator: never dictated, unlike "|"

# The 1st value of each list is the default: pressing Enter without touching
# anything stays the fast path.
TYPES="Idée|TODO|Référence|Standby|Note"
DOMAINES="(à déduire)|DevOps & Linux|IA & Claude|Candidature & Emploi|Apprentissage|Site web|Projets perso|Business & Réseau"

# Popup already open → second F10 press: just stop the dictation
if pgrep -f 'zenity --forms --title=Idée' >/dev/null; then
    ydotool key $F8
    exit 0
fi

# Native GTK popup (Wayland and X11), launched in the background.
# The Texte field comes first: it holds the focus, so it's where OpenWhispr
# types. Output goes to $OUT; we read it after the "wait".
zenity --forms --title="Idée" \
       --text="Speak… F8 or F10 to stop, Enter to save" \
       --add-entry="Texte" \
       --add-combo="Type"    --combo-values="$TYPES" \
       --add-combo="Domaine" --combo-values="$DOMAINES" \
       --separator="$SEP" \
       --width=640 2>/dev/null > "$OUT" &

sleep 0.4                                 # let the popup grab focus (tune 0.2–0.8)
ydotool key $F8                           # start OpenWhispr recording
wait || true                              # Escape → zenity exits 1, carry on anyway

res=$(cat "$OUT"); rm -f "$OUT"
IFS="$SEP" read -r txt type dom <<< "$res"
[ -z "${txt:-}" ] && exit 0               # Escape or empty text → exit quietly

type="${type:-Idée}"                      # combo left untouched → default value
dom="${dom:-}"
[ "$dom" = "(à déduire)" ] && dom=""      # unspecified: filing will infer it

# The sticky note: the idea on the first line (that's what you read, and what
# the title is taken from), metadata in the footer.
footer="[$type]"
[ -n "$dom" ] && footer="$footer $dom"
pad=$(mktemp --tmpdir "idee-XXXXXX.txt")
printf -- '%s\n\n%s — %s\n' "$txt" "$footer" "$(date '+%F %H:%M')" > "$pad"

if [ -n "${IDEE_DRYRUN:-}" ]; then        # test without cluttering the desktop
    printf -- '--- sticky note that would be created ---\n'; cat "$pad"; rm -f "$pad"; exit 0
fi

if xpad --new-from-file="$pad" 2>/dev/null; then
    sleep 0.3                             # let xpad read the file before deleting it
    rm -f "$pad"
    notify-send "📌 $footer" "$txt"
else
    printf -- '- %s %s %s\n' "$(date '+%F %H:%M')" "$footer" "$txt" >> "$FALLBACK"
    rm -f "$pad"
    notify-send "⚠️ xpad unavailable" "Idea saved to $FALLBACK"
fi
```

### The sequence that lets you dictate *into* the popup

Three lines carry the whole mechanism, and they haven't changed since the first version:

- **`zenity … &` followed by `wait`**: the popup runs in the background so the script can send F8 *while* it's open; `wait` takes back control when it closes.
- **`sleep 0.4`**: the only timing knob. Too short, and F8 fires before the field has focus — the dictated text lands in the IDE. Between 0.2 and 0.8 depending on the machine.
- **`pgrep`**: it detects an already-open popup by its title and turns a second F10 into "stop dictation" instead of a second window. If you change the zenity title, change the `pgrep` with it — both strings must stay identical.

### What the form version brought

Moving from `zenity --entry` to `zenity --forms` adds two dropdowns, **Type** and **Domaine**, next to the text field. That's what replaced the tag convention I used before, and it comes with a few precautions:

- **Field order is not cosmetic.** `--add-entry="Texte"` is declared first, so it holds the focus when the popup opens — so that's where OpenWhispr writes. Putting a dropdown first would be enough to send the dictation nowhere.
- **The separator is an invisible character.** `zenity --forms` joins fields with `|` by default, so a `|` dictated or typed into the text would break the splitting. `SEP=$'\x1f'` (ASCII's *Unit Separator*) settles it once and for all: it cannot come out of a dictation.
- **Defaults preserve the fast path.** The first entry of each list is preselected, so pressing Enter without touching anything still yields a valid capture. `(à déduire)` for the domain explicitly means "I'm not deciding" — the script blanks it and lets the filing step decide later.
- **`wait || true` isn't cosmetic either.** Under `set -e`, pressing Escape makes zenity exit with code 1, which would kill the script before it could clean up its temp file.

The sticky note itself follows a simple convention: the idea alone on the first line, a blank line, then `[Type] Domaine — date` as a footer. The first line is what you read on the desktop at a glance, and it's also what becomes the title at filing time.

Finally, a capture is never lost if xpad isn't there: the `else` branch falls back to appending to `~/inbox.md`, with a notification that says so plainly. It's the original `>>`, turned into a safety net rather than a destination.

### Testing without cluttering the desktop

That's what `IDEE_DRYRUN` is for: the script prints the sticky note it would have created and stops there.

```bash
chmod +x ~/.local/bin/idee
IDEE_DRYRUN=1 idee    # popup + dictation → speak → F8 → Enter
```

`zenity` and `notify-send` ship by default on Ubuntu Desktop; `xpad` installs with `sudo apt install xpad`.

## Building block 3: the global F10 shortcut

The shortcut is what makes the gesture non-invasive: the system launches the script on top of whatever I'm doing, with no window switch. F8 stays OpenWhispr's key, F10 is mine — two keys, two roles, zero collision.

Through the UI: **Settings → Keyboard → Custom Shortcuts → +**, name `Idée`, command `/home/YOUR_LOGIN/.local/bin/idee`, key **F10**. The path must be **absolute**: GNOME's launcher doesn't have your shell's `PATH`, and a shortcut with a relative command fails without any error message.

From the command line, to reproduce the setup on another machine:

```bash
KB=/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings
SCHEMA=org.gnome.settings-daemon.plugins.media-keys

# Careful: the 2nd command REPLACES the custom shortcuts list.
# Read it first and add custom9 to it if it's not empty.
gsettings get $SCHEMA custom-keybindings

gsettings set $SCHEMA custom-keybindings "['$KB/custom9/']"
gsettings set $SCHEMA.custom-keybinding:$KB/custom9/ name    'Idée'
gsettings set $SCHEMA.custom-keybinding:$KB/custom9/ command "$HOME/.local/bin/idee"
gsettings set $SCHEMA.custom-keybinding:$KB/custom9/ binding 'F10'
```

The trap in this variant: the `name`/`command`/`binding` keys alone are not enough — the `custom9/` path must appear in the `custom-keybindings` **list**, otherwise GNOME never reads them. It's the equivalent of a systemd service that was written but never enabled.

On KDE, sway or i3, only the shortcut declaration changes; the script stays identical (on X11, replace `ydotool key $F8` with `xdotool key F8`).

## Filing without thinking about it: from sticky note to knowledge base

Last problem: where does the idea come from, and where should it end up? On Wayland you can't read the active window's title to guess the current project — the same isolation that blocked `xdotool`. My first answer was a one-syllable convention: a `#projectname` slipped into the sentence, then `grep '#cli' ~/inbox.md` when I came back to the project.

It worked, but two flaws eventually weighed. The tag had to be dictated or typed, so it was forgotten one time in three. And sorting stayed entirely manual: reread the file, decide, move. An inbox you don't empty becomes a file you stop opening.

The two dropdowns fix the first flaw. **Type** covers the five natures of what crosses my mind while coding — Idée, TODO, Référence, Standby, Note: the bug to fix isn't the tool idea, which isn't the article to read later. **Domaine** (DevOps & Linux, IA & Claude, Site web, Projets perso…) says which part of my activity it belongs to. Both are picked with the mouse in a second, or ignored — their default values keep a capture valid without touching them. The metadata is entered at the source, while the context is still fresh, instead of being reconstructed at sorting time.

The second flaw is fixed by the destination. The xpad sticky note isn't the archive, it's the **buffer**: it sits on the desktop in plain sight, and that visibility is exactly the healthy pressure that pushes you to process it. The archive is a Notion database, fed by an ingestion routine that reads the notes, categorizes them and creates one page per note — then deletes the sticky note, but **only once the page is confirmed created**. That's the rule that makes the automation acceptable: if anything fails on the Notion side, the note stays put. A capture is never lost.

The principle borrowed from GTD hasn't changed, it just moved one notch: capturing must be instant and decision-free, filing requires thought and happens when there's time for it. The difference is that filing is no longer a rereading chore but a command I run when the desktop starts filling up with sticky notes.

## What it changes day to day

The cost of a capture dropped below the threshold where my brain starts negotiating: F10, one sentence, Enter. Three seconds, no context switch, and the idea is dated, typed and filed without my having to decide where. Since the gesture exists, "for later" ideas actually land somewhere — and my coding sessions are no longer interrupted by the fear of forgetting.

The whole thing fits in one bash script, a keyboard shortcut and two tools the distribution already ships, on top of an open-source app that transcribes and cleans up locally. If you already use OpenWhispr — or any global-hotkey dictation tool — the setup reproduces in fifteen minutes, and the destination stays yours: a plain text file is enough to start with, which is exactly where mine started.
