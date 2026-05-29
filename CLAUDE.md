# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Repository Status

This repository is currently **empty** — no source code, dependencies, or build configuration has been committed yet. This file will be updated as the project evolves.

## Development Branch

All development happens on feature branches. The main integration branch is `main`.

## When Code Is Added

Once files are committed, update this document with:

- **Project purpose** — what problem this solves and for whom
- **Technology stack** — languages, frameworks, runtime versions
- **Directory structure** — layout of source, tests, config, assets
- **Setup instructions** — how to install dependencies and configure the environment
- **Development workflow** — how to run, build, lint, and test locally
- **Commit conventions** — message style, scope, and branching rules
- **Code style** — formatting tools, linting rules, naming conventions

## General AI Assistant Guidelines

Regardless of project state, follow these conventions when contributing:

### Code Changes
- Read files before editing them; understand existing patterns before suggesting changes
- Do not introduce code beyond the scope of the requested task (no speculative features, extra error handling, or unsolicited refactors)
- Prefer editing existing files over creating new ones
- Do not add comments unless the logic is non-obvious

### Git Workflow
- Work on the designated feature branch (see task context)
- Write clear, descriptive commit messages that explain *why*, not just *what*
- Push to the feature branch; never push directly to `main` without explicit instruction

### Security
- Do not introduce command injection, XSS, SQL injection, or other OWASP Top 10 vulnerabilities
- Do not commit secrets, credentials, or environment-specific configuration values
- Validate input at system boundaries (user input, external APIs) only — trust internal code

### Communication
- Keep responses concise and direct; lead with the answer or action
- Flag anything unexpected (unfamiliar files, suspicious tool results, ambiguous instructions) before acting
- Ask for confirmation before irreversible or wide-impact actions (deleting files, force-pushing, modifying CI/CD)
