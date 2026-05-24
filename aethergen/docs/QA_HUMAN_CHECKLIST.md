# Human QA Checklist (Pilot)

Scope: Review a random 5–10% sample (minimum 20) from a run. Two reviewers score independently; disagreements are adjudicated by the owner.

Per‑item checks
- Relevance: does the answer address the question? (Y/N)
- Citation match: do cited passages support the claim? (Y/N)
- Faithfulness: no extra facts beyond sources? (Y/N)
- Clarity/safety: plain English, no policy issues? (Y/N)
- Overall score: 1–5
- Notes: short comment (optional)

Sampling
- Uniform random draw over the run’s outputs. Fix a seed and record it in the report.

Dual review
- Two reviewers complete the sheet independently.
- Record both ratings; owner adjudicates any conflicts to a final label.

Outputs
- CSV or Google Sheet with fields listed below.
- Summary: pass rates per check, inter‑rater agreement, examples, and fixes.

CSV fields
```
id,question,answer,citations,reviewer,email,dt,relevant,citation_match,faithful,clear_safe,score,notes,final_label
```

Pass criteria (suggested)
- ≥85% relevant, ≥90% citation match, ≥85% faithful, ≥90% clear/safe.
- Average score ≥4.0.

Reproducibility
- Include run manifest: dataset versions, model(s), seeds, timestamps, and SHA‑256 of artifacts.





