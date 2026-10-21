# Riverplo public writing

This existing public repository is the publication source for https://riverplo.com/writing/ and its RSS feed https://riverplo.com/feed.xml. GitHub Pages builds committed approved posts with Jekyll. No new credentials, scheduled jobs, cross-repository tokens or publishing service is needed.

## Publish an approved post

Only put content here that the owner has explicitly approved for public release. This repository and its Git history are public: published:false, visibility:private, _drafts and exclusions are NOT confidentiality controls. Keep private notes, RiverOS materials, personal messages, secrets and unapproved drafts outside this repository entirely.

Create `_posts/YYYY-MM-DD-short-slug.md`. Use the actual current publication date and timezone, not a backdated date, and this front matter:

```yaml
---
layout: post
title: "Owner-approved title"
date: CURRENT-PUBLICATION-TIME-WITH-TIMEZONE
published: true
visibility: public
---
```

Write the approved body after the front matter. Commit it to main. The existing GitHub Pages build publishes the article, writing index and RSS automatically. Until then the list and feed are intentionally empty. Plain text content is rendered safely; embedded HTML/scripts/images are stripped, so rich embeds are not supported.

Both published:true and visibility:public are required by the list/feed/post layout. Jekyll excludes unpublished/future posts by configuration. Never rely on this to keep committed source private.

## Provenance

Each article links to its actual source-file commit history. GitHub preserves the file's real commit IDs, additions and edits. Front-matter dates are editorial metadata and Git author/committer dates can be set by an author. Neither proves first authorship or constitutes a trusted timestamp. Do not backdate articles, invent authorship claims, or replace Git history with a claimed date.

No article has been added as part of the initial setup. Synthetic test articles must stay in a disposable local test fixture and must never be pushed to this repository.

## Search

The writing index searches title, publication date and article text locally in the visitor's browser. Only posts already selected by the exact public/published list filters are included; there is no RiverOS connection or additional data source. Queries are not sent to a search service or stored. The full public list remains available when JavaScript is disabled. New approved posts become searchable on the next Jekyll build automatically.
