# Achievements

> ⚠️ **Spoilers.** This lists every hidden achievement in the terminal on the home page and exactly how to unlock it.

There are **13** achievements. Unlocking one prints `★ achievement unlocked: <name> (n/13)` after the command's output.

- **Where they're saved:** in the browser's `localStorage` (key `snf-achievements`), so they survive reloads and later visits.
- **Where they show up:** as files in `~/achievements/` (the folder appears after the first unlock), and in the `achievements` command.
- **Completing the set:** unlocking all 13 prints a 🏆 message.
- **Resetting:** run `achievements --reset`.

## The list

| # | Achievement | Description shown in the terminal | How to unlock |
|---|---|---|---|
| 1 | **chaos agent** | ran rm -rf. the site survived. | Run `rm` with both the recursive and force flags, e.g. `rm -rf /`, `sudo rm -rf */`, `rm -fr *`, `rm -r -f ~` or `rm --recursive x`. Plays the nuke animation; the achievement unlocks once the site restores itself (after 10 s or **restore now**). |
| 2 | **secret hunter** | found the .env file. | Read the hidden `~/.env`: `cat .env`, or a `grep` that matches a line inside it (e.g. `grep -r hunter2 ~`). Just finding the filename (`ls -a`, `ls -Ra \| grep .env`) isn't enough — you have to open it. |
| 3 | **explorer** | read /etc/passwd. | `cat /etc/passwd`, or a `grep` that matches a line in it (e.g. `grep -r guest /etc`). |
| 4 | **nice try** | tried sudo or a forbidden file. | Any command starting with `sudo` (except the sandwich), or `cat` a protected file: `/etc/shadow` or `~/.ssh/id_rsa`. `sudo` + anything mentioning `.env` gets its own reply. |
| 5 | **sandwich** | sudo make me a sandwich. | `sudo make me a sandwich` ([xkcd 149](https://xkcd.com/149/)). Without `sudo` you just get told to make it yourself. |
| 6 | **fork bomber** | tried a fork bomb. | The bash fork bomb: `:(){ :\|:& };:` |
| 7 | **vim survivor** | made it out of vim. | `vim` or `vi`. |
| 8 | **bobby tables** | tried a little SQL injection. | Any input containing `' or 1=1` (or `" or 1=1`), `drop table`, or `; --`. |
| 9 | **hacker voice** | hacked the mainframe (the about page). | `hack` |
| 10 | **rebooter** | rebooted SNF-OS. | `reboot` — replays the boot screen; unlocks when it finishes or is skipped. |
| 11 | **true arch user** | ran pacman -Syu. | `pacman -Syu` (also `-Su` / `-Syyu`), or `yay` / `paru` with no arguments. |
| 12 | **ai skeptic** | tried to install an AI. it went badly. | Install an AI through any package manager, e.g. `apt install openai`, `pacman -S claude`, `npm i -g @anthropic-ai/claude-code`, `pip install chatgpt`. Package managers: apt, apt-get, pacman, yay, paru, pip, pipx, npm, pnpm, yarn, brew, dnf, yum, snap, cargo, winget, choco. AI names: openai, chatgpt, gpt-*, claude*, anthropic, copilot, gemini, bard, ollama, llama*, mistral, deepseek, grok, perplexity, llm, ai. Triggers the nuke, so it also unlocks **chaos agent**. |
| 13 | **mom joke** | tried to install someone's mom. | `pacman -S your mom` (also `ur mom`, `yo mama`, `your-mum`, `you're mother`…), or `pacman -S your dad`. Works with `yay -S` / `paru -S` too. |

## Fastest route to 13/13

```sh
cat .env
cat /etc/passwd
cat /etc/shadow
sudo make me a sandwich
:(){ :|:& };:
vim
' or 1=1 --
hack
pacman -Syu
pacman -S your mom
reboot
apt install openai      # also unlocks chaos agent
```

## Other easter eggs (no achievement)

These have funny responses but don't count towards the 13:

- **Arch, btw:**
  - `btw`
  - `neofetch`
  - `uname -a`
  - `cat /etc/os-release`
  - `pacman -S <pkg>`
  - `pacman -Q`
  - `apt` / `brew` / `dnf` / `yum` / `zypper` / `snap` (with no AI name)
- **Classics:**
  - `sl`
  - `cowsay <text>`
  - `exit` / `logout`
  - `nano`
  - `emacs`
  - `man`
  - `make me a sandwich`
- **"Hacking":**
  - `ssh`
  - `curl` / `wget`
  - `nmap`
  - `ping`
  - `git push --force`
  - `cat ~/.bash_history`
  - `ls -a` (hidden files)
- **Destructive commands** (`shutdown`, `poweroff`, `halt`, `init 0`, `mkfs`, `dd if=…`): "you can't turn off the internet."
- **Read-only filesystem:** `rm` (without `-rf`), `mv`, `cp`, `touch`, `mkdir`, `rmdir`, `chmod`.

## Adding a new achievement

In [`terminal.js`](terminal.js):

1. Add it to the `EGGS` object (`"name": "description"`). The total updates automatically.
2. Call `unlock("name")` from the command or easter egg that should award it. Spread the result into the command's return value, e.g. `return [T("…"), ...unlock("name")]`.
3. Add a row to this file.
