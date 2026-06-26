---
name: install-amuro
metadata:
  version: 0.0.1
---

# Install Amuro

## Install

1. Find `https://github.com/hbrls/Amuro` and clone it into the `.context` directory. Execute this manually:

```bash
mkdir -p .context
git clone --single-branch --depth 1 git@github.com:hbrls/Amuro.git .context/Amuro
```

2. Install `AGENTS.md`.

NOTE: `Amuro/AGENTS.md` does not exist yet — skip this step.

```bash
# Skipped for now: Amuro/AGENTS.md does not exist yet
# rm -f AGENTS.md
# cp .context/Amuro/AGENTS.md AGENTS.md
```

3. Install skill: `amuro`.

NOTE: Amuro skill is not ready yet — skip this step.

```bash
# Skipped for now: Amuro skill is not ready yet
# rm -rf .agents/skills/amuro
# mkdir -p .agents/skills
# cp -R .context/Amuro/.agents/skills/amuro .agents/skills/amuro
```

4. Install workflows. Select as needed:

```bash
rm -rf .agents/workflows/workshop
rm -rf .agents/workflows/pilot
rm -rf .agents/workflows/checkpoint
mkdir -p .agents/workflows
cp -R .context/Amuro/.agents/workflows/workshop .agents/workflows/workshop
cp -R .context/Amuro/.agents/workflows/pilot .agents/workflows/pilot
cp -R .context/Amuro/.agents/workflows/checkpoint .agents/workflows/checkpoint
```

5. Wait for human review.
