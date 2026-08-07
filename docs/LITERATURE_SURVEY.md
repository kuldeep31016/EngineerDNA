# EngineerDNA — Academic Literature Survey

**Compiled:** August 2026
**Scope:** Developer profiling, mining software repositories, evidence-based skill verification, AI recruitment, knowledge graphs for skills, and explainable/fair algorithmic hiring.

---

## ⚠️ Verification Statement (read this first)

This survey was built from live web searches and source verification, not from recall. To keep it usable for an academic submission:

- **Every paper in the "Verified Core Corpus" below had its bibliographic record independently confirmed** against DBLP, arXiv, or the publisher, during compilation.
- **No DOI in this document was invented.** Where a DOI could not be confirmed, the field says `Not confirmed` rather than guessing.
- **PDF links are given only where a legitimate open-access version exists** (arXiv, author page, university repository, or open publisher). Paywalled papers are explicitly marked and given only their official publisher page.
- **Fields 11–17** (abstract, contribution, methodology, dataset, metrics, limitations) are summarized from abstracts and publisher/preprint pages. Where I did not read the full text, that is stated. Treat these as accurate-but-secondary; **verify against the full text before citing in a paper.**
- A final section lists **candidate papers I found but could NOT independently verify** — do not cite these without checking them yourself.

**Honest note on the requested output:** you asked for a Top-20 plus eight Top-10 lists (100 slots). A corpus of genuinely *verified, highly relevant* work in this specific niche is smaller than that. Rather than pad the lists with fabricated or marginal entries, the ranked lists below **reuse papers across categories where a paper legitimately belongs to more than one** (e.g. a paper can be both an IEEE paper and a GitHub-mining paper), and some narrow categories contain fewer than 10 entries. Where a category is thin, that itself is a **research gap** and is flagged as such.

---

## Table of Contents

1. [Category A — Developer Profiling & Expertise Mining](#category-a--developer-profiling--expertise-mining)
2. [Category B — Mining Software Repositories: Methodology & Datasets](#category-b--mining-software-repositories-methodology--datasets)
3. [Category C — Artifact-Level Evidence (Docker, CI/CD, Ownership)](#category-c--artifact-level-evidence-docker-cicd-ownership)
4. [Category D — Hiring Signals & Technical Candidate Evaluation](#category-d--hiring-signals--technical-candidate-evaluation)
5. [Category E — AI / LLM Recruitment & Resume Screening](#category-e--ai--llm-recruitment--resume-screening)
6. [Category F — Knowledge Graphs for Skills & HR](#category-f--knowledge-graphs-for-skills--hr)
7. [Category G — Explainable, Fair & Trustworthy AI in Hiring](#category-g--explainable-fair--trustworthy-ai-in-hiring)
8. [Ranked Lists](#ranked-lists)
9. [Research Gap Analysis & Novel Contributions](#research-gap-analysis--novel-contributions-for-engineerdna)
10. [Unverified Candidates](#unverified-candidates-do-not-cite-without-checking)

---

## Category A — Developer Profiling & Expertise Mining

**Why this category matters to EngineerDNA:** this is the closest prior art to the product's core claim. Read these first — they define the state of the art you must beat or differentiate from.

### Summary Table

| # | Paper | Year | Venue | Publisher | Relevance |
|:-:|---|:-:|---|---|:-:|
| A1 | Expertise Browser: A Quantitative Approach to Identifying Expertise | 2002 | ICSE | ACM | ★★★★★ |
| A2 | Towards Mining OSS Skills from GitHub Activity | 2022 | ICSE-NIER | IEEE | ★★★★★ |
| A3 | Dev2vec: Representing Domain Expertise of Developers in an Embedding Space | 2022/23 | arXiv → IST | Elsevier | ★★★★★ |
| A4 | RepoSkillMiner: Identifying Software Expertise from GitHub Repositories using NLP | 2020 | ASE | ACM/IEEE | ★★★★★ |
| A5 | Automatically Deriving Developers' Technical Expertise from the GitHub Social Network | 2026 | TOSEM | ACM | ★★★★★ |
| A6 | Mining the Technical Roles of GitHub Users | 2021 | Inf. & Softw. Technology | Elsevier | ★★★★ |
| A7 | CodeCV: Mining Expertise of GitHub Users from Coding Activities | 2022 | SCAM | IEEE | ★★★★ |
| A8 | Understanding Skills for OSS Communities on GitHub | 2022 | ESEC/FSE | ACM | ★★★★ |

---

### A1. Expertise Browser: A Quantitative Approach to Identifying Expertise

| Field | Value |
|---|---|
| **1. Title** | Expertise browser: a quantitative approach to identifying expertise |
| **2. Authors** | Audris Mockus, James D. Herbsleb |
| **3. Year** | 2002 |
| **4. Venue** | 24th International Conference on Software Engineering (ICSE '02), pp. 503–512 |
| **5. Publisher** | ACM |
| **6. DOI** | `10.1145/581339.581401` ✅ verified (DBLP) |
| **7. Official link** | https://dl.acm.org/doi/10.1145/581339.581401 |
| **8. PDF** | Author-hosted draft: https://mockus.us/papers/exbdraft.pdf ✅ (ACM version is paywalled) |

**9. IEEE citation**
> A. Mockus and J. D. Herbsleb, "Expertise browser: a quantitative approach to identifying expertise," in *Proc. 24th Int. Conf. Softw. Eng. (ICSE)*, Orlando, FL, USA, 2002, pp. 503–512, doi: 10.1145/581339.581401.

**10. BibTeX**
```bibtex
@inproceedings{mockus2002expertise,
  author    = {Mockus, Audris and Herbsleb, James D.},
  title     = {Expertise browser: a quantitative approach to identifying expertise},
  booktitle = {Proceedings of the 24th International Conference on Software Engineering (ICSE)},
  pages     = {503--512},
  year      = {2002},
  publisher = {ACM},
  doi       = {10.1145/581339.581401}
}
```

**11. Abstract summary.** Introduces a tool that locates people with desired expertise using data from change management systems, and proposes a quantification of developer experience validated as a measure of expertise.

**12. Key contribution.** The **"Experience Atom" (EA)** — an elementary, countable unit of experience derived from a developer's changes to a work product. Expertise becomes a *measured quantity* derived from version-control activity rather than a self-report.

**13. Problem solved.** Finding who in a large organization actually knows a given area of code, when self-reported skill lists are unreliable and out of date.

**14. Methodology.** Mine change-management/VCS history; attribute changes to developers and code areas; aggregate into EAs; validate the measure against known organizational expertise. Tool-building + empirical validation.

**15. Dataset.** Industrial change-management data from large telecom software (Lucent/Avaya-scale systems). *Not a public dataset.*

**16. Metrics.** Validation of the experience quantification against independent indicators of expertise; qualitative tool-use evaluation.

**17. Limitations.** Pre-GitHub, closed-source industrial data; EAs count activity volume and can conflate *quantity* of changes with *depth* of skill; no technology-level (framework/library) granularity.

**18. Relevance to EngineerDNA.** ⭐ **This is the intellectual ancestor of your Evidence Engine.** It establishes the foundational, citable premise of your entire product: *expertise can be measured from engineering artifacts rather than claimed.* Cite it as the origin of evidence-based expertise measurement, then position EngineerDNA as the modern, multi-source, artifact-level successor.

**19. EngineerDNA module.** Evidence Engine; Engineering DNA scoring.

**20. Keywords.** Expertise identification, experience atoms, change management, developer profiling, software repository mining.

> 📝 **Note for EngineerDNA:** Mockus's EA concept maps almost directly onto your `TechEvidence` row. Consider explicitly framing your `confidence` score as a modernized, multi-signal EA — it gives your scoring model a 20-year citable lineage in the strongest possible venue (ICSE).

---

### A2. Towards Mining OSS Skills from GitHub Activity

| Field | Value |
|---|---|
| **1. Title** | Towards Mining OSS Skills from GitHub Activity |
| **2. Authors** | Jenny T. Liang, Thomas Zimmermann, Denae Ford |
| **3. Year** | 2022 |
| **4. Venue** | ICSE 2022 — New Ideas and Emerging Results (NIER), pp. 106–110 |
| **5. Publisher** | IEEE / ACM |
| **6. DOI** | `10.1109/ICSE-NIER55298.2022.9793514` ✅ verified (DBLP) |
| **7. Official link** | https://ieeexplore.ieee.org/document/9793514/ |
| **8. PDF** | arXiv (open access): https://arxiv.org/pdf/2203.02027 ✅ |

**9. IEEE citation**
> J. T. Liang, T. Zimmermann, and D. Ford, "Towards mining OSS skills from GitHub activity," in *Proc. IEEE/ACM 44th Int. Conf. Softw. Eng.: New Ideas and Emerging Results (ICSE-NIER)*, 2022, pp. 106–110, doi: 10.1109/ICSE-NIER55298.2022.9793514.

**10. BibTeX**
```bibtex
@inproceedings{liang2022towards,
  author    = {Liang, Jenny T. and Zimmermann, Thomas and Ford, Denae},
  title     = {Towards Mining {OSS} Skills from GitHub Activity},
  booktitle = {Proc. IEEE/ACM 44th Int. Conf. on Software Engineering: New Ideas and Emerging Results (ICSE-NIER)},
  pages     = {106--110},
  year      = {2022},
  doi       = {10.1109/ICSE-NIER55298.2022.9793514}
}
```

**11. Abstract summary.** Proposes detecting OSS skills from GitHub activity via **measurable "signals"**, prototyped in a tool called **Disko**.

**12. Key contribution.** An explicit **signal-based skill detection framework** — a skill is inferred from concrete, measurable activity cues. Detects four skill families: teaching others, commitment to a project, programming-language knowledge, and familiarity with OSS practices.

**13. Problem solved.** OSS contributors' skills (especially non-coding ones) are invisible and unrecognized; there is no automated way to surface them.

**14. Methodology.** Define signals per skill → implement detectors over GitHub activity → validate with a **survey of 455 OSS contributors**.

**15. Dataset.** GitHub activity data; validation survey of 455 OSS contributors (Microsoft Research).

**16. Metrics.** **Precision 77%–97%** across detected skills; contributor willingness to display skills (>54%).

**17. Limitations.** NIER (short) paper — early-stage; limited skill taxonomy; precision-only evaluation (recall not reported); self-report survey validation.

**18. Relevance to EngineerDNA.** ⭐⭐ **The single most methodologically transferable paper for you.** Its "signal" abstraction is exactly your evidence model, and it provides the **precision-based evaluation protocol** you need to empirically defend "VERIFIED". It also validates the *human-acceptance* dimension (do developers want these skills shown?), which strengthens a product-focused paper.

**19. EngineerDNA module.** Evidence Engine; Skill Verification; GitHub Analyzer.

**20. Keywords.** Skill mining, signals, OSS contributions, GitHub activity, developer skills.

> 📝 **Note for EngineerDNA:** Copy their evaluation design. Sample N verified skills from your system, have developers confirm/deny, and report precision per skill. That single experiment turns your product into a publishable paper. Also note they cover **non-coding skills** (mentoring, commitment) — a dimension your DNA model currently lacks entirely.

---

### A3. Dev2vec: Representing Domain Expertise of Developers in an Embedding Space

| Field | Value |
|---|---|
| **1. Title** | Dev2vec: Representing Domain Expertise of Developers in an Embedding Space |
| **2. Authors** | Arghavan Moradi Dakhel, Michel C. Desmarais, Foutse Khomh |
| **3. Year** | 2022 (preprint), 2023 (journal) |
| **4. Venue** | arXiv:2207.05132 → *Information and Software Technology* |
| **5. Publisher** | Elsevier |
| **6. DOI** | Journal: `10.1016/j.infsof.2023.107218` ✅ · Preprint: `10.48550/arXiv.2207.05132` ✅ |
| **7. Official link** | https://doi.org/10.1016/j.infsof.2023.107218 |
| **8. PDF** | arXiv (open access): https://arxiv.org/pdf/2207.05132 ✅ (Elsevier version paywalled) |

**9. IEEE citation**
> A. M. Dakhel, M. C. Desmarais, and F. Khomh, "Dev2vec: Representing domain expertise of developers in an embedding space," *Information and Software Technology*, 2023, doi: 10.1016/j.infsof.2023.107218.

**10. BibTeX**
```bibtex
@article{dakhel2023dev2vec,
  author  = {Dakhel, Arghavan Moradi and Desmarais, Michel C. and Khomh, Foutse},
  title   = {Dev2vec: Representing domain expertise of developers in an embedding space},
  journal = {Information and Software Technology},
  year    = {2023},
  doi     = {10.1016/j.infsof.2023.107218}
}
```

**11. Abstract summary.** Uses doc2vec to embed developers' domain expertise into vectors, drawn from three evidence sources: descriptions of repositories contributed to, issue-resolving history, and **API calls in their commits**.

**12. Key contribution.** A multi-source **embedding representation** of expertise, with an empirical finding on **which evidence source is most informative** — issue-resolving history ranked highest.

**13. Problem solved.** Automated, transferable assessment of developer expertise across multiple projects.

**14. Methodology.** doc2vec embeddings per evidence source; comparison against state-of-the-art baselines; ablation across sources.

**15. Dataset.** GitHub repositories, issues, and commit API-call data (see full text for exact corpus).

**16. Metrics.** **F1-score**, reported as up to **+21%** over prior state of the art.

**17. Limitations.** Embeddings are **not interpretable** — you get a vector, not a defensible per-skill justification. Domain-level rather than fine-grained technology-level expertise.

**18. Relevance to EngineerDNA.** ⭐ Two things. (1) It's your **strongest ML baseline** to compare against. (2) Its central weakness — **no explainability** — is precisely EngineerDNA's differentiator. Your traceable "Dockerfile + compose + CI build ⇒ VERIFIED" chain is auditable where an embedding is not. Cite this as the accuracy-vs-explainability trade-off you deliberately resolve on the explainability side.

**19. EngineerDNA module.** Engineering DNA scoring; AI Scoring; Ranking.

**20. Keywords.** Developer expertise, embeddings, doc2vec, API calls, issue history.

> 📝 **Note for EngineerDNA:** Their finding that **issue-resolving history is the most informative signal** is directly actionable — you currently mine repos, commits, PRs, Dockerfiles and CI, but *not* issue resolution. Adding it is a cheap, literature-justified accuracy win.

---

### A4. RepoSkillMiner: Identifying Software Expertise from GitHub Repositories using NLP

| Field | Value |
|---|---|
| **1. Title** | RepoSkillMiner: Identifying software expertise from GitHub repositories using Natural Language Processing |
| **2. Authors** | Stratos Kourtzanidis, Alexander Chatzigeorgiou, Apostolos Ampatzoglou |
| **3. Year** | 2020 |
| **4. Venue** | 35th IEEE/ACM Int. Conf. on Automated Software Engineering (ASE '20), pp. 1353–1357 |
| **5. Publisher** | ACM (also indexed on IEEE Xplore, doc. 9286058) |
| **6. DOI** | `10.1145/3324884.3415305` ✅ verified (DBLP) |
| **7. Official link** | https://dl.acm.org/doi/10.1145/3324884.3415305 |
| **8. PDF** | ❌ **Paywalled.** No confirmed open-access version. Use the official page above. |

**9. IEEE citation**
> S. Kourtzanidis, A. Chatzigeorgiou, and A. Ampatzoglou, "RepoSkillMiner: Identifying software expertise from GitHub repositories using natural language processing," in *Proc. 35th IEEE/ACM Int. Conf. Automated Softw. Eng. (ASE)*, 2020, pp. 1353–1357, doi: 10.1145/3324884.3415305.

**10. BibTeX**
```bibtex
@inproceedings{kourtzanidis2020reposkillminer,
  author    = {Kourtzanidis, Stratos and Chatzigeorgiou, Alexander and Ampatzoglou, Apostolos},
  title     = {RepoSkillMiner: Identifying software expertise from GitHub repositories using Natural Language Processing},
  booktitle = {Proc. 35th IEEE/ACM Int. Conf. on Automated Software Engineering (ASE)},
  pages     = {1353--1357},
  year      = {2020},
  doi       = {10.1145/3324884.3415305}
}
```

**11. Abstract summary.** A tool that identifies **low-level expertise on specific frameworks and technologies** using only GitHub data plus NLP (Microsoft LUIS for language understanding).

**12. Key contribution.** Moves expertise mining from coarse "domains" down to **named technologies and frameworks** — the granularity recruiters actually search on.

**13. Problem solved.** Recruiters need "does this person know Spring Boot / Docker", not "this person is a backend developer."

**14. Methodology.** Extract repository text artifacts → NLP/intent recognition (LUIS) → map to technology skill tags. Tool demo paper.

**15. Dataset.** GitHub repositories via the GitHub API.

**16. Metrics.** Tool-demo scale evaluation (short paper — verify specifics in full text).

**17. Limitations.** Short tool paper with limited evaluation; relies on a **proprietary third-party NLP service**; text-based inference (READMEs/descriptions) means it risks the exact failure EngineerDNA fixes — inferring skill from *mentions* rather than *implementation*.

**18. Relevance to EngineerDNA.** ⭐⭐ **Your single most important "related work" comparison.** It targets the same granularity you do, but from *text*. Your `USED` vs `MENTIONED` distinction is a **direct, defensible advance** over it: RepoSkillMiner would credit a README that says "Docker"; EngineerDNA requires a Dockerfile, a compose file, and a CI image build.

**19. EngineerDNA module.** Skill Verification; Evidence Engine; GitHub Analyzer.

**20. Keywords.** Skill extraction, NLP, GitHub mining, technology expertise, LUIS.

> 📝 **Note for EngineerDNA:** This is the paper to benchmark against in an evaluation section. A study showing "RepoSkillMiner marks X% of skills present that our artifact-level verification refutes" would be a compelling, publishable result and a strong marketing claim.

---

### A5. Automatically Deriving Developers' Technical Expertise from the GitHub Social Network

| Field | Value |
|---|---|
| **1. Title** | Automatically Deriving Developers' Technical Expertise from the GitHub Social Network |
| **2. Authors** | Yanchun Sun, Jiawei Wu, Xiaohan Zhao, Haizhou Xu, Ye Zhu, Zhenpeng Chen, Sihan Wang, Huizhen Jiang, Gang Huang |
| **3. Year** | 2026 |
| **4. Venue** | ACM Transactions on Software Engineering and Methodology (TOSEM), vol. 35, no. 4, art. 98, pp. 1–33 |
| **5. Publisher** | ACM |
| **6. DOI** | `10.1145/3746451` ✅ verified (DBLP) |
| **7. Official link** | https://doi.org/10.1145/3746451 |
| **8. PDF** | ❌ **Paywalled** (unless ACM OA). Use official page. |

**9. IEEE citation**
> Y. Sun *et al.*, "Automatically deriving developers' technical expertise from the GitHub social network," *ACM Trans. Softw. Eng. Methodol.*, vol. 35, no. 4, art. 98, pp. 1–33, 2026, doi: 10.1145/3746451.

**10. BibTeX**
```bibtex
@article{sun2026deriving,
  author  = {Sun, Yanchun and Wu, Jiawei and Zhao, Xiaohan and Xu, Haizhou and Zhu, Ye and
             Chen, Zhenpeng and Wang, Sihan and Jiang, Huizhen and Huang, Gang},
  title   = {Automatically Deriving Developers' Technical Expertise from the GitHub Social Network},
  journal = {ACM Transactions on Software Engineering and Methodology},
  volume  = {35},
  number  = {4},
  pages   = {98:1--98:33},
  year    = {2026},
  doi     = {10.1145/3746451}
}
```

**11. Abstract summary.** Builds a comprehensive **GitHub social network** integrating social and development activities, then applies a **Graph Neural Network** to learn a low-dimensional representation vector per developer for expertise inference.

**12. Key contribution.** GNN-based expertise representation over a **heterogeneous developer–artifact–social graph** — currently the most advanced graph-learning approach in this space.

**13. Problem solved.** Expertise signals are fragmented across social and code activity; single-source methods miss relational context.

**14. Methodology.** Construct heterogeneous GitHub network → GNN embedding → downstream expertise prediction, benchmarked against prior methods.

**15. Dataset.** Large-scale GitHub social/development activity data (see full text).

**16. Metrics.** Standard classification/ranking metrics against state-of-the-art baselines (verify specifics in full text — paywalled).

**17. Limitations.** Paywalled; GNN embeddings again sacrifice interpretability; heavy computational/graph-construction cost.

**18. Relevance to EngineerDNA.** ⭐⭐ **This is the most current, top-venue competitor to your thesis — and it validates your Neo4j architecture.** It proves a top-tier journal accepts *graph-structured developer expertise* as a research contribution. You must cite it as the SOTA you differentiate from: they optimize predictive accuracy via opaque embeddings; you optimize **verifiability and explainability** over an evidence graph.

**19. EngineerDNA module.** Developer Graph; Knowledge Graph (Neo4j); Engineering DNA scoring; Ranking.

**20. Keywords.** GNN, social network, developer expertise, graph representation learning, TOSEM.

> 📝 **Note for EngineerDNA:** Your Neo4j layer is currently provisioned but unused. This paper is the strongest possible justification for actually building it — and the highest-value next engineering step for a research narrative. A GNN over your *evidence* graph (not just a social graph) would be genuinely novel.

---

### A6–A8 (compact verified entries)

| Field | A6 | A7 | A8 |
|---|---|---|---|
| **Title** | Mining the Technical Roles of GitHub Users | CodeCV: Mining Expertise of GitHub Users from Coding Activities | Understanding Skills for OSS Communities on GitHub |
| **Authors** | J. E. Montandon, M. T. Valente, L. L. Silva | D. Atzberger, N. Scordialo, T. Cech, W. Scheibel, M. Trapp, J. Döllner | J. T. Liang, T. Zimmermann, D. Ford *(verify full author list)* |
| **Year** | 2021 | 2022 | 2022 |
| **Venue** | Information and Software Technology, vol. 131, art. 106485 | IEEE SCAM 2022, pp. 143–147 | ESEC/FSE 2022 |
| **Publisher** | Elsevier | IEEE | ACM |
| **DOI** | `10.1016/j.infsof.2020.106485` ✅ | `10.1109/SCAM55253.2022.00021` ✅ | `10.1145/3540250.3549082` ✅ |
| **Official** | https://doi.org/10.1016/j.infsof.2020.106485 | https://doi.org/10.1109/SCAM55253.2022.00021 | https://dl.acm.org/doi/10.1145/3540250.3549082 |
| **PDF** | ❌ Paywalled | ❌ Paywalled | arXiv: https://arxiv.org/pdf/2209.02222 ✅ |
| **Key contribution** | Classifies GitHub users into **technical roles** (e.g. backend, frontend, full-stack, devops) from contribution data | Annotates GitHub contributions with **technology tags mined from Stack Overflow**, unsupervised — builds a technology skill profile | Empirical **taxonomy of 45 skills in 9 categories** for OSS (technical, working styles, problem solving, contribution types, project-specific, interpersonal, external relations, management, characteristics) |
| **Relevance** | ★★★★ Direct prior art for **role inference** — maps to your "Career archetype" | ★★★★ Cross-platform tag transfer; validates mining tech skills without manual taxonomies | ★★★★ A **ready-made, peer-reviewed skill taxonomy** you can adopt instead of inventing one |
| **Module** | Engineering DNA; Career Intelligence | Skill Verification; Evidence Engine | Engineering DNA (dimension design); Skill Verification |

> 📝 **Note:** A8's 45-skill / 9-category taxonomy is the strongest available justification for how you choose your **ten DNA dimensions**. Right now your dimensions are engineering-defined; grounding them in this taxonomy makes them defensible to a reviewer. It also shows your model covers only the *technical* slice of a 9-category space — an explicit, honest limitation to state (and a roadmap item).

---

## Category B — Mining Software Repositories: Methodology & Datasets

**Why this matters:** these papers govern the *validity* of everything EngineerDNA computes. Ignoring them is the fastest way to get a paper rejected — and the fastest way to ship a scoring bug.

### Summary Table

| # | Paper | Year | Venue | DOI | Relevance |
|:-:|---|:-:|---|---|:-:|
| B1 | The Promises and Perils of Mining GitHub | 2014 | MSR | `10.1145/2597073.2597074` | ★★★★★ |
| B2 | An In-Depth Study of the Promises and Perils of Mining GitHub | 2016 | EMSE | `10.1007/s10664-015-9393-5` | ★★★★★ |
| B3 | GHTorrent: GitHub's Data from a Firehose | 2012 | MSR | `10.1109/MSR.2012.6224294` | ★★★★ |
| B4 | Lean GHTorrent: GitHub Data on Demand | 2014 | MSR | `10.1145/2597073.2597126` | ★★★ |

---

### B1/B2. The Promises and Perils of Mining GitHub (+ extended EMSE version)

- **Authors:** Eirini Kalliamvakou, Georgios Gousios, Kelly Blincoe, Leif Singer, Daniel M. German, Daniela Damian
- **Venue:** MSR 2014 (conference) → *Empirical Software Engineering* 2016 (extended)
- **DOI:** `10.1145/2597073.2597074` ✅ | extended: `10.1007/s10664-015-9393-5` ✅
- **Official:** https://dl.acm.org/doi/10.1145/2597073.2597074 · https://link.springer.com/article/10.1007/s10664-015-9393-5
- **PDF:** Open-access author copy ✅ https://chisel.cs.uvic.ca/pubs/kalliamvakou-MSR2014.pdf

**IEEE citation**
> E. Kalliamvakou, G. Gousios, K. Blincoe, L. Singer, D. M. German, and D. Damian, "The promises and perils of mining GitHub," in *Proc. 11th Working Conf. Mining Software Repositories (MSR)*, 2014, pp. 92–101, doi: 10.1145/2597073.2597074.

```bibtex
@inproceedings{kalliamvakou2014promises,
  author    = {Kalliamvakou, Eirini and Gousios, Georgios and Blincoe, Kelly and
               Singer, Leif and German, Daniel M. and Damian, Daniela},
  title     = {The promises and perils of mining GitHub},
  booktitle = {Proc. 11th Working Conference on Mining Software Repositories (MSR)},
  year      = {2014},
  doi       = {10.1145/2597073.2597074}
}
```

**Key contribution.** A catalogue of **empirically-established perils** in GitHub data: most repositories are *personal and inactive*; many are used as free storage/hosting rather than software projects; **~40% of merged pull requests do not appear as merged**; plus (in the extended version) four further perils about user data.

**Limitations.** Findings are from the 2014-era GitHub; some specifics have shifted (though the *classes* of peril persist).

**Relevance to EngineerDNA.** ⭐⭐⭐ **This is a correctness-critical paper for your product, not just your paper.** Every peril it names is a live false-positive risk in your Evidence Engine:
- *Personal/inactive repos* → inflated evidence from toy projects.
- *Repos as storage* → a repo with a Dockerfile that was never a real system.
- *Merge status unreliable* → your PR-based signals may undercount real contributions.

Your existing `ownCommits`/fork-exclusion logic already addresses one peril — this paper lets you **cite peer-reviewed justification for that design decision**, which is exactly the kind of detail that makes a systems paper credible.

**Module.** GitHub Analyzer; Evidence Engine (data-validity layer).
**Keywords.** MSR methodology, data quality, GitHub, threats to validity.

> 📝 **Note for EngineerDNA:** Build an explicit **"repository eligibility filter"** (minimum commits, non-fork, real project vs. storage, activity recency) and cite B1/B2 for each rule. This is a small engineering change with outsized credibility payoff, and it directly reduces false "VERIFIED" claims.

---

### B3/B4. GHTorrent

- **B3:** G. Gousios and D. Spinellis, "GHTorrent: GitHub's data from a firehose," MSR 2012, pp. 12–21, DOI `10.1109/MSR.2012.6224294` ✅
- **B4:** G. Gousios, B. Vasilescu, A. Serebrenik, A. Zaidman, "Lean GHTorrent: GitHub data on demand," MSR 2014, pp. 384–387, DOI `10.1145/2597073.2597126` ✅

**Relevance.** The canonical GitHub mining infrastructure and the standard citation for large-scale GitHub data collection. Useful as (a) methodological precedent for your ingestion pipeline and (b) a potential evaluation dataset.

> ⚠️ **Caveat:** GHTorrent's data collection has been **largely dormant since ~2019–2021**. For current work, consider **GH Archive** or the GitHub REST/GraphQL API directly. Do not present GHTorrent as a live data source. *(There is also a 2013 MSR paper "The GHTorrent dataset and tool suite"; DBLP did not return a DOI for it — verify before citing.)*

---

## Category C — Artifact-Level Evidence (Docker, CI/CD, Ownership)

**Why this matters most to EngineerDNA:** your headline example is *Docker verification*. This is the literature that makes that example rigorous — and, notably, **no paper here uses these artifacts for skill verification.** That is your gap (see §9).

### Summary Table

| # | Paper | Year | Venue | DOI | Relevance |
|:-:|---|:-:|---|---|:-:|
| C1 | An Empirical Analysis of the Docker Container Ecosystem on GitHub | 2017 | MSR | `10.1109/MSR.2017.67` | ★★★★★ |
| C2 | Not All Dockerfile Smells Are the Same: Hadolint Writing Practices by Experts | 2024 | MSR | `10.1145/3643991.3644905` | ★★★★★ |
| C3 | Fixing Dockerfile Smells: An Empirical Study | 2024 | EMSE | `10.1007/s10664-024-10471-7` | ★★★★ |
| C4 | Why Do GitHub Actions Workflows Fail? An Empirical Study | 2025/26 | TOSEM | `10.1145/3749371` | ★★★★ |
| C5 | Don't Touch My Code! Examining the Effects of Ownership on Software Quality | 2011 | ESEC/FSE | `10.1145/2025113.2025119` | ★★★★ |

---

### C1. An Empirical Analysis of the Docker Container Ecosystem on GitHub

- **Authors:** Jürgen Cito, Gerald Schermann, John Erik Wittern, Philipp Leitner, Sali Zumberi, Harald C. Gall
- **Venue:** MSR 2017, pp. 323–333 · **Publisher:** IEEE
- **DOI:** `10.1109/MSR.2017.67` ✅ verified (DBLP)
- **Official:** https://doi.org/10.1109/MSR.2017.67 · **PDF:** ❌ Paywalled (check author pages)

**IEEE citation**
> J. Cito, G. Schermann, J. E. Wittern, P. Leitner, S. Zumberi, and H. C. Gall, "An empirical analysis of the Docker container ecosystem on GitHub," in *Proc. IEEE/ACM 14th Int. Conf. Mining Software Repositories (MSR)*, 2017, pp. 323–333, doi: 10.1109/MSR.2017.67.

```bibtex
@inproceedings{cito2017docker,
  author    = {Cito, J{\"u}rgen and Schermann, Gerald and Wittern, John Erik and
               Leitner, Philipp and Zumberi, Sali and Gall, Harald C.},
  title     = {An empirical analysis of the Docker container ecosystem on GitHub},
  booktitle = {Proc. IEEE/ACM 14th Int. Conf. on Mining Software Repositories (MSR)},
  pages     = {323--333},
  year      = {2017},
  doi       = {10.1109/MSR.2017.67}
}
```

**Key contribution.** The foundational large-scale characterization of **how Dockerfiles actually appear and evolve in open-source repositories** — prevalence, quality, and change patterns.

**Relevance to EngineerDNA.** ⭐⭐⭐ **This is the empirical backbone of your flagship "Docker VERIFIED" example.** It tells you what a *real* Docker usage pattern looks like versus a trivial one, which is exactly the discrimination your Evidence Engine must make. Cite it to justify your Docker verification heuristics.

**Module.** Evidence Engine (Docker verification); GitHub Analyzer.

> 📝 **Note for EngineerDNA:** Use C1 + C2 to build a **graded Docker competence signal** rather than a binary flag. A developer with a multi-stage, pinned-version, smell-free Dockerfile in CI demonstrably knows more Docker than someone with a 3-line `FROM ubuntu` file — and C2/C3 give you a peer-reviewed, tool-backed (Hadolint) way to measure that difference. **This is one of your most defensible novel contributions.**

---

### C2/C3. Dockerfile Smells (quality-graded evidence)

- **C2:** G. Rosa, S. Scalabrino, G. Robles, R. Oliveto, "Not all Dockerfile smells are the same: An empirical evaluation of Hadolint writing practices by experts," MSR 2024. DOI `10.1145/3643991.3644905` ✅ — https://dl.acm.org/doi/10.1145/3643991.3644905
- **C3:** "Fixing Dockerfile smells: an empirical study," *Empirical Software Engineering*, 2024. DOI `10.1007/s10664-024-10471-7` ✅ — https://link.springer.com/article/10.1007/s10664-024-10471-7 · preprint https://arxiv.org/pdf/2208.09097v1 ✅

**Key contribution.** C2 mines expert-maintained Dockerfile histories to determine which smells experts actually introduce/avoid; C3 studies whether developers accept smell fixes (they prioritize image size and build time).

**Relevance to EngineerDNA.** ⭐⭐ These convert Docker evidence from *binary* to *graded proficiency*, and **Hadolint gives you an off-the-shelf, citable static analyzer** to implement it. C2 in particular provides an empirical definition of "expert Docker practice" — a ready-made rubric for scoring.

**Module.** Evidence Engine; Engineering DNA (devops dimension); Code Quality Assessment.

---

### C4. Why Do GitHub Actions Workflows Fail? An Empirical Study

- **Venue:** ACM TOSEM · **DOI:** `10.1145/3749371` ✅ · **Official:** https://doi.org/10.1145/3749371
- **Open PDF appears available:** https://dl.acm.org/doi/pdf/10.1145/3749371 (verify OA status)
- **Contribution.** First empirical analysis of GitHub Actions workflow failures — manual examination of 375 failed workflow runs across 260 open-source Java projects, yielding a **taxonomy of failure causes**.
- **Relevance.** ⭐⭐ Your CI/CD evidence stream depends on interpreting workflow outcomes. This paper tells you **which failures indicate developer skill gaps versus infrastructure noise** — critical to avoid penalizing a candidate for a flaky runner. Pair with the Travis CI noise literature (see Unverified list) for the same reason.
- **Module.** Evidence Engine (CI/CD verification); GitHub Analyzer.

---

### C5. Don't Touch My Code! Examining the Effects of Ownership on Software Quality

- **Authors:** Christian Bird, Nachiappan Nagappan, Brendan Murphy, Harald C. Gall, Premkumar T. Devanbu
- **Venue:** ESEC/FSE 2011, pp. 4–14 · **DOI:** `10.1145/2025113.2025119` ✅ verified (DBLP)
- **Official:** https://dl.acm.org/doi/10.1145/2025113.2025119
- **PDF:** Microsoft Research open copy ✅ https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bird2011dtm.pdf

**IEEE citation**
> C. Bird, N. Nagappan, B. Murphy, H. C. Gall, and P. Devanbu, "Don't touch my code! Examining the effects of ownership on software quality," in *Proc. 19th ACM SIGSOFT Symp. Found. Softw. Eng. (ESEC/FSE)*, 2011, pp. 4–14, doi: 10.1145/2025113.2025119.

```bibtex
@inproceedings{bird2011ownership,
  author    = {Bird, Christian and Nagappan, Nachiappan and Murphy, Brendan and
               Gall, Harald C. and Devanbu, Premkumar T.},
  title     = {Don't touch my code! Examining the effects of ownership on software quality},
  booktitle = {Proc. 19th ACM SIGSOFT Symposium on the Foundations of Software Engineering},
  pages     = {4--14},
  year      = {2011},
  doi       = {10.1145/2025113.2025119}
}
```

**Key contribution.** Defines **ownership metrics** (proportion of contribution by top owner, count of low-expertise "minor" contributors) and shows they predict pre-release faults and post-release failures in Windows Vista/7.

**Relevance to EngineerDNA.** ⭐⭐ Provides the **peer-reviewed formalization of ownership** that your `ownCommits` field approximates. It empirically justifies distinguishing major from minor contributors — i.e. that a developer with 2 commits to a large repo should not inherit that repo's full technology profile. **Cite this to defend your fork/authorship gate.**

**Module.** Evidence Engine (authorship weighting); Engineering DNA scoring.

---

## Category D — Hiring Signals & Technical Candidate Evaluation

### D1. Activity Traces and Signals in Software Developer Recruitment and Hiring ⭐ *(highest strategic value)*

| Field | Value |
|---|---|
| **Title** | Activity traces and signals in software developer recruitment and hiring |
| **Authors** | Jennifer Marlow, Laura Dabbish |
| **Year** | 2013 |
| **Venue** | ACM Conf. on Computer Supported Cooperative Work (CSCW '13), pp. 145–156 |
| **Publisher** | ACM |
| **DOI** | `10.1145/2441776.2441794` ✅ verified (DBLP) |
| **Official** | https://dl.acm.org/doi/10.1145/2441776.2441794 |
| **PDF** | ❌ Paywalled on ACM; DBLP indicates an unpaywalled copy may exist — verify before citing a PDF link |

**IEEE citation**
> J. Marlow and L. Dabbish, "Activity traces and signals in software developer recruitment and hiring," in *Proc. ACM Conf. Computer Supported Cooperative Work (CSCW)*, 2013, pp. 145–156, doi: 10.1145/2441776.2441794.

```bibtex
@inproceedings{marlow2013activity,
  author    = {Marlow, Jennifer and Dabbish, Laura},
  title     = {Activity traces and signals in software developer recruitment and hiring},
  booktitle = {Proc. ACM Conference on Computer Supported Cooperative Work (CSCW)},
  pages     = {145--156},
  year      = {2013},
  doi       = {10.1145/2441776.2441794}
}
```

**Abstract summary.** Applies **signaling theory** to GitHub profile activity traces, via interviews with managers and developers who use GitHub in hiring.

**Key contribution.** Empirically establishes that (a) employers find GitHub activity traces **"more reliable and verifiable than a static list of skills"**, and (b) signal reliability depends on **evaluation cost** — employers only inspect traces that are cheap to verify quickly. Reliable assessment signals come from *history of sustained activity* and *networking within high-status projects*.

**Problem solved.** Understanding how (and whether) recruiters actually use public developer activity as hiring signal.

**Methodology.** Qualitative — interviews with hiring managers and developers; signaling-theory analysis.

**Dataset.** Interview study (qualitative, not a mined dataset).

**Metrics.** Qualitative thematic analysis; no quantitative metrics.

**Limitations.** 2013, pre-dates modern GitHub features and current AI hiring; small qualitative sample; findings are perceptions, not outcome validity (it does not show these signals *predict job performance*).

**Relevance to EngineerDNA.** ⭐⭐⭐ **This is your product thesis, peer-reviewed, in a top venue — and it is the single best citation for your motivation section.** Two findings are directly load-bearing:
1. **"More reliable and verifiable than a static list of skills"** = your core value proposition, empirically validated a decade before your product.
2. **The evaluation-cost finding is your entire business case.** Marlow & Dabbish found recruiters *want* activity signals but skip them when verification is expensive. **EngineerDNA drives that evaluation cost to near zero.** That is a precise, literature-grounded articulation of the gap you fill — use it verbatim in your pitch and your paper's introduction.

**Module.** Whole product thesis; Recruiter search/Ranking; Verified Profile.

**Keywords.** Signaling theory, hiring, GitHub, activity traces, recruitment, CSCW.

> 📝 **Note for EngineerDNA:** Frame your product in signaling-theory language — you convert **costly-to-verify signals into cheap-to-verify ones**. That framing is academically rigorous, immediately intelligible to a CSCW/ICSE reviewer, and far more compelling to investors than "AI-powered hiring."

---

### D2. Technical interview validity (supporting context)

Research (widely reported from NC State) finds **technical/whiteboard interviews measure performance anxiety as much as software skill**, with candidates in private settings substantially outperforming those interviewed publicly.

> ⚠️ **Verification status:** I confirmed the *finding* is widely reported (ScienceDaily, secondary sources) but did **not** verify the primary paper's exact bibliographic record. The commonly cited work is Behroozi, Parnin et al. on technical interviews / "Does Stress Impact Technical Interview Performance?" (ESEC/FSE 2020). **Verify before citing.**

**Relevance.** ⭐⭐ This is the **negative case for the status quo** — the evidence that the incumbent evaluation method is measuring the wrong thing. It is the natural counterpart to D1 in your motivation: resumes are unverifiable *and* interviews are poor instruments; evidence from real work is the alternative.

---

## Category E — AI / LLM Recruitment & Resume Screening

### Summary Table

| # | Paper | Year | Venue/Source | Identifier | Relevance |
|:-:|---|:-:|---|---|:-:|
| E1 | Application of LLM Agents in Recruitment: A Novel Framework for Resume Screening | 2024 | arXiv → J. Information Processing | arXiv:2401.08315 | ★★★★★ |
| E2 | Fairness in AI-Driven Recruitment: Challenges, Metrics, Methods, Future Directions | 2024 | arXiv | arXiv:2405.19699 | ★★★★★ |
| E3 | Evaluating Bias in LLMs for Job-Resume Matching: Gender, Race, Education | 2025 | arXiv | arXiv:2503.19182 | ★★★★ |
| E4 | FairCVtest Demo: Understanding Bias in Multimodal Learning (Fair Automatic Recruitment) | 2020 | arXiv (ICMI demo) | arXiv:2009.07025 | ★★★★ |

---

### E1. Application of LLM Agents in Recruitment: A Novel Framework for Resume Screening

- **Authors:** Chengguang Gan, Qinghao Zhang, Tatsunori Mori
- **Year:** 2024 (v1 Jan 16, 2024; v2 Aug 13, 2024) · **Accepted by Journal of Information Processing (2024)**
- **DOI:** `10.48550/arXiv.2401.08315` ✅ verified (arXiv)
- **Official/PDF:** https://arxiv.org/abs/2401.08315 ✅ (open access)

**IEEE citation**
> C. Gan, Q. Zhang, and T. Mori, "Application of LLM agents in recruitment: A novel framework for resume screening," *arXiv preprint* arXiv:2401.08315, 2024.

```bibtex
@article{gan2024llmagents,
  author  = {Gan, Chengguang and Zhang, Qinghao and Mori, Tatsunori},
  title   = {Application of {LLM} Agents in Recruitment: A Novel Framework for Resume Screening},
  journal = {arXiv preprint arXiv:2401.08315},
  year    = {2024},
  doi     = {10.48550/arXiv.2401.08315}
}
```

**Key contribution.** An **LLM-agent framework** for resume screening with decision-making stages; reports **11× faster** than manual screening and **87.73% F1** on resume classification; fine-tuned model beats a GPT-3.5 baseline on summarization/grading.

**Limitations.** ⚠️ **Crucially: it screens the résumé itself — the unverified artifact.** It optimizes *speed of processing claims*, not *truth of claims*.

**Relevance to EngineerDNA.** ⭐⭐⭐ **This paper defines the field you are arguing against.** State-of-the-art AI recruitment makes the *unverified résumé* faster to process; EngineerDNA questions whether the résumé should be the input at all. That contrast — **"faster screening of claims" vs. "verification of claims"** — is the cleanest one-sentence statement of your novelty. It also gives you a metric baseline (F1, throughput) to position against.

**Module.** Resume Verification; AI Scoring.

> 📝 **Note for EngineerDNA:** Your `resume` module currently reviews a résumé against the verified profile — which is *exactly* the right move and is **not** what E1 does. Emphasize this: you use the résumé as a **claim set to be cross-examined against evidence**, not as ground truth. That reframing is publishable.

---

### E2. Fairness in AI-Driven Recruitment: Challenges, Metrics, Methods, and Future Directions

- **Year:** 2024 · **arXiv:** 2405.19699 · **DOI:** `10.48550/arXiv.2405.19699` ✅
- **Official/PDF:** https://arxiv.org/abs/2405.19699 ✅ (open access)

**Key contribution.** A systematic review of biases in AI recruitment, a **categorization of fairness metrics and bias-mitigation techniques**, and a survey of auditing approaches.

**Relevance to EngineerDNA.** ⭐⭐⭐ **This is your compliance-and-ethics backbone, and it is not optional.** Any hiring product faces EU AI Act / NYC Local Law 144-style scrutiny. This paper gives you the vocabulary and the metric catalogue to (a) audit your ranking for disparate impact and (b) argue that **evidence-based ranking is inherently more auditable** than résumé-text ranking — because every input is a concrete artifact, not a proxy variable.

**Module.** Ranking; AI Scoring; Explainability/Compliance.

> 📝 **Note for EngineerDNA:** Be careful — evidence-based ranking is **not automatically fair**. Public-GitHub-activity signals correlate with free time, which correlates with socioeconomic status, caregiving responsibilities, and employment at companies that permit OSS work. **This is the most serious ethical risk in your product**, and a reviewer will raise it immediately. Address it explicitly with a fairness audit using E2's metric catalogue.

---

### E3/E4. Bias in LLM matching & multimodal recruitment bias

- **E3:** "Evaluating Bias in LLMs for Job-Resume Matching: Gender, Race, and Education," arXiv:2503.19182 ✅ — https://arxiv.org/abs/2503.19182 · Examines how demographic attributes influence LLM matching decisions.
- **E4:** "FairCVtest Demo: Understanding Bias in Multimodal Learning with a Testbed in Fair Automatic Recruitment," arXiv:2009.07025 ✅ — https://arxiv.org/pdf/2009.07025 · **FairCVtest**: a testbed of **24,000 synthetic résumés** (structured + unstructured text + face images) for studying multimodal recruitment bias.

**Relevance.** ⭐⭐ E4's FairCVtest is a **ready-made public benchmark** for auditing your résumé-side components. E3 is essential if you use an LLM anywhere in ranking or matching — it documents the exact failure mode you must test for.

**Module.** Resume Verification; Ranking; Fairness auditing.

---

## Category F — Knowledge Graphs for Skills & HR

### Summary Table

| # | Paper | Year | Venue | DOI/ID | Relevance |
|:-:|---|:-:|---|---|:-:|
| F1 | Application of Knowledge Graph in Software Engineering: A Systematic Literature Review | 2023 | Inf. & Softw. Technology, vol. 164 | `10.1016/j.infsof.2023.107327` | ★★★★★ |
| F2 | Job Posting-Enriched Knowledge Graph for Skills-Based Matching | 2021 | arXiv | arXiv:2109.02554 | ★★★★★ |
| F3 | Automatically Deriving Developers' Technical Expertise (GNN) — *see A5* | 2026 | TOSEM | `10.1145/3746451` | ★★★★★ |

---

### F1. Application of Knowledge Graph in Software Engineering Field: A Systematic Literature Review

- **Authors:** Lu Wang, Chenhan Sun, Chongyang Zhang, Weikun Nie, Kaiyuan Huang
- **Venue:** *Information and Software Technology*, vol. 164, 2023, art. 107327 · **Publisher:** Elsevier
- **DOI:** `10.1016/j.infsof.2023.107327` ✅ verified (DBLP) · **Official:** https://doi.org/10.1016/j.infsof.2023.107327
- **PDF:** ❌ Paywalled (Elsevier). An OpenReview entry exists — verify legitimacy before use.

**IEEE citation**
> L. Wang, C. Sun, C. Zhang, W. Nie, and K. Huang, "Application of knowledge graph in software engineering field: A systematic literature review," *Information and Software Technology*, vol. 164, art. 107327, 2023, doi: 10.1016/j.infsof.2023.107327.

```bibtex
@article{wang2023kgse,
  author  = {Wang, Lu and Sun, Chenhan and Zhang, Chongyang and Nie, Weikun and Huang, Kaiyuan},
  title   = {Application of knowledge graph in software engineering field: A systematic literature review},
  journal = {Information and Software Technology},
  volume  = {164},
  pages   = {107327},
  year    = {2023},
  doi     = {10.1016/j.infsof.2023.107327}
}
```

**Key contribution.** Systematic review of KG construction techniques and applications in SE — ontology modeling, named entity recognition, knowledge fusion — with applications in code/API recommendation and vulnerability mining.

**Relevance to EngineerDNA.** ⭐⭐ Your **design-justification citation for the Neo4j layer**, and your source for ontology-modeling methodology. **Important finding for your positioning:** the surveyed SE-KG applications center on *code/API recommendation and vulnerability detection* — **not developer skill verification.** That absence is a documented gap you can claim.

**Module.** Knowledge Graph (Neo4j); Developer Graph.

---

### F2. Job Posting-Enriched Knowledge Graph for Skills-Based Matching

- **Authors:** Maurits de Groot, Jelle Schutte, David Graus
- **Year:** 2021 · **arXiv:** 2109.02554 · **DOI:** `10.48550/arXiv.2109.02554` ✅
- **Official/PDF:** https://arxiv.org/abs/2109.02554 ✅ (open access)

**Key contribution.** A **Skills & Occupation Knowledge Graph** built from existing skill/occupation taxonomies enriched with live job-posting data, supporting three applications: **link prediction** (which skills belong to an occupation), **node similarity + path-finding** for career development, and **term weighting** to find role-distinguishing skills.

**Relevance to EngineerDNA.** ⭐⭐⭐ **The most directly reusable architecture in this survey.** All three of its applications map onto features you already have or want:
- *Link prediction* → infer skills a candidate likely has / job requires.
- *Path-finding* → **your Learning Roadmap module, but graph-based and principled.**
- *Term weighting* → identify which verified skills most distinguish a candidate — directly improving Ranking and search relevance.

It also provides the taxonomy-grounding (ESCO/O*NET-style) that would let you map your mined technologies to a **standard occupational vocabulary** — essential for recruiter-facing search quality.

**Module.** Knowledge Graph; Ranking; Recommendation; Learning Roadmap; Career Intelligence.

> 📝 **Note for EngineerDNA:** This is your blueprint for actually using Neo4j. Combine F2's *occupation-skill* graph with your *evidence* graph and you get something no surveyed paper has: a graph where the edge `Developer -[HAS_SKILL]-> Technology` is **backed by verifiable artifacts**, and `Job -[REQUIRES]-> Technology` comes from a standard taxonomy. Path queries then explain *why* a candidate matches — with evidence at every hop.

---

## Category G — Explainable, Fair & Trustworthy AI in Hiring

### Summary Table

| # | Paper | Year | Source | Relevance |
|:-:|---|:-:|---|:-:|
| G1 | Requirements of eXplainable AI in Algorithmic Hiring | 2024 | CEUR-WS Vol-3744 | ★★★★★ |
| G2 | Toward a Traceable, Explainable, and Fair JD/Resume Recommendation System | 2022 | arXiv:2202.08960 | ★★★★★ |
| G3 | Fairness in AI-Driven Recruitment (*see E2*) | 2024 | arXiv:2405.19699 | ★★★★★ |
| G4 | Mapping Stakeholder Needs to Multi-Sided Fairness in Candidate Recommendation | 2025 | arXiv:2508.00908 | ★★★★ |

---

### G1. Requirements of eXplainable AI in Algorithmic Hiring

- **Source:** CEUR Workshop Proceedings, Vol-3744, paper 8 · **PDF (open access):** https://ceur-ws.org/Vol-3744/paper8.pdf ✅
- **DOI:** Not confirmed (CEUR-WS papers frequently lack DOIs) — cite by URL/volume.
- **Context:** Produced within the **FINDHR** EU project (Fairness and Intersectional Non-Discrimination in Human Recommendation).

**Key contribution.** Sets out XAI requirements specific to hiring: **factual explanations** (*why* was this ranking produced) and **counterfactual explanations** (*what would change* it), motivated by GDPR transparency obligations and a candidate's **right to contest** automated decisions.

**Relevance to EngineerDNA.** ⭐⭐⭐ **This is the requirements specification for your explainability layer, and it is close to a legal checklist.** Your ranking already exposes per-factor score/weight/reasoning — that satisfies the *factual* explanation requirement. **You do not currently produce counterfactual explanations**, and G1 argues they are required. Adding "*you would rank in the top 10 for this role if you had verified evidence of Kubernetes*" is (a) a compliance improvement, (b) a genuinely useful candidate feature, and (c) **a novel contribution**, since no surveyed developer-profiling paper does it.

**Module.** Ranking; Explainability; Career Intelligence; Learning Roadmap.

> 📝 **Note for EngineerDNA:** Counterfactual explanations are the highest-leverage feature in this entire survey for you. They simultaneously serve compliance, candidate experience, and your Learning Roadmap — the *same computation* answers "why didn't I match?" and "what should I learn next?"

---

### G2. Toward a Traceable, Explainable, and Fair JD/Resume Recommendation System

- **arXiv:** 2202.08960 · **PDF:** https://arxiv.org/pdf/2202.08960 ✅ (open access) · **DOI:** `10.48550/arXiv.2202.08960` (arXiv DOI)
- **Key contribution.** Combines **traceability, explainability, and fairness** in job-description/résumé recommendation — often using KG/NER-based approaches to make matches inspectable.
- **Relevance.** ⭐⭐ The word **"traceable"** is the closest published concept to EngineerDNA's evidence-chain idea. Read this carefully to position your contribution precisely — you extend traceability from *"which résumé text drove the match"* to *"which committed artifact proves the skill."*
- **Module.** Ranking; Explainability; Resume Verification.

---

### G4. Mapping Stakeholder Needs to Multi-Sided Fairness in Candidate Recommendation

- **arXiv:** 2508.00908 · **PDF:** https://arxiv.org/pdf/2508.00908 ✅
- **Relevance.** ⭐⭐ **Multi-sided fairness** is directly applicable: EngineerDNA is a two-sided market (candidates + recruiters) and fairness obligations differ per side. Useful for a discussion/ethics section.
- ⚠️ Verify venue/publication status — arXiv only at time of compilation.

---

## Ranked Lists

> Papers legitimately appear in more than one list where they belong to more than one category. Categories with fewer than 10 verified, genuinely-relevant entries are marked — **that thinness is itself a finding** (see gap analysis).

### 🏆 Top 20 Must-Read Papers (overall, ranked by relevance to EngineerDNA)

| Rank | Paper | Why |
|:-:|---|---|
| 1 | **Marlow & Dabbish (2013)** — Activity Traces and Signals in Hiring | Your product thesis, peer-reviewed. The evaluation-cost finding *is* your business case. |
| 2 | **Liang, Zimmermann & Ford (2022)** — Towards Mining OSS Skills | The transferable signal-based method + the evaluation protocol you should copy. |
| 3 | **Mockus & Herbsleb (2002)** — Expertise Browser | Foundational ancestor; gives your Evidence Engine a 20-year lineage. |
| 4 | **Kourtzanidis et al. (2020)** — RepoSkillMiner | Closest competitor at your granularity; your `USED` vs `MENTIONED` beats it. |
| 5 | **Sun et al. (2026)** — Deriving Expertise from GitHub Social Network (TOSEM) | Current SOTA; validates your graph architecture. |
| 6 | **Kalliamvakou et al. (2014/2016)** — Promises and Perils of Mining GitHub | Correctness-critical; prevents false VERIFIED claims. |
| 7 | **Dakhel et al. (2023)** — Dev2vec | Strongest ML baseline; its opacity is your differentiator. |
| 8 | **Cito et al. (2017)** — Docker Container Ecosystem on GitHub | Empirical backbone of your flagship Docker example. |
| 9 | **de Groot et al. (2021)** — Job Posting-Enriched Knowledge Graph | Blueprint for your Neo4j layer + roadmap + ranking. |
| 10 | **FINDHR (2024)** — Requirements of XAI in Algorithmic Hiring | Compliance spec; motivates counterfactual explanations. |
| 11 | **Fairness in AI-Driven Recruitment (2024)** | Ethics/audit backbone; you cannot ship a hiring product without it. |
| 12 | **Bird et al. (2011)** — Don't Touch My Code! | Formalizes ownership; defends your `ownCommits` gate. |
| 13 | **Gan et al. (2024)** — LLM Agents in Recruitment | Defines the "faster screening" paradigm you argue against. |
| 14 | **Liang et al. (2022)** — Understanding Skills for OSS Communities (FSE) | Peer-reviewed 45-skill taxonomy for your DNA dimensions. |
| 15 | **Montandon et al. (2021)** — Mining Technical Roles of GitHub Users | Prior art for role/archetype inference. |
| 16 | **Rosa et al. (2024)** — Not All Dockerfile Smells Are the Same (MSR) | Turns Docker evidence from binary into graded proficiency. |
| 17 | **Why Do GitHub Actions Workflows Fail? (TOSEM)** | Prevents penalizing candidates for infrastructure noise. |
| 18 | **Atzberger et al. (2022)** — CodeCV (SCAM) | Cross-platform tag transfer for skill profiling. |
| 19 | **Toward a Traceable, Explainable, Fair JD/Resume System (2022)** | Nearest published concept to your evidence chain. |
| 20 | **Gousios & Spinellis (2012)** — GHTorrent | Canonical GitHub mining infrastructure precedent. |

---

### 🔶 Top 10 IEEE Papers

1. Towards Mining OSS Skills from GitHub Activity — ICSE-NIER 2022 — `10.1109/ICSE-NIER55298.2022.9793514`
2. An Empirical Analysis of the Docker Container Ecosystem on GitHub — MSR 2017 — `10.1109/MSR.2017.67`
3. CodeCV: Mining Expertise of GitHub Users from Coding Activities — SCAM 2022 — `10.1109/SCAM55253.2022.00021`
4. GHTorrent: GitHub's Data from a Firehose — MSR 2012 — `10.1109/MSR.2012.6224294`
5. RepoSkillMiner — ASE 2020 (IEEE/ACM co-sponsored; IEEE Xplore doc. 9286058) — `10.1145/3324884.3415305`
6. Studying Software Developer Expertise and Contributions in Stack Overflow and GitHub — ICSME 2020 (IEEE Xplore doc. 9240693) — ⚠️ *DOI not confirmed*
7. EARec: Leveraging Expertise and Authority for Pull-Request Reviewer Recommendation — IEEE Xplore doc. 7809395 — ⚠️ *DOI not confirmed*
8. Characterizing the Occurrence of Dockerfile Smells in Open-Source Software — IEEE Access — ⚠️ *DOI not confirmed*
9. Identifying Experts in Software Libraries and Frameworks among GitHub Users (CVExplorer) — MSR 2019 / arXiv:1903.08113 — ⚠️ *DOI not confirmed*
10. Predicting Participants' Performance in Programming Contests using Deep Learning — arXiv:2302.05602 — ⚠️ *venue not confirmed*

> ⚠️ Entries 6–10 were located but **not fully verified**. Confirm each before citing.

---

### 🐙 Top 10 GitHub Mining Papers

1. The Promises and Perils of Mining GitHub — MSR 2014 — `10.1145/2597073.2597074`
2. An In-Depth Study of the Promises and Perils of Mining GitHub — EMSE 2016 — `10.1007/s10664-015-9393-5`
3. GHTorrent: GitHub's Data from a Firehose — MSR 2012 — `10.1109/MSR.2012.6224294`
4. An Empirical Analysis of the Docker Container Ecosystem on GitHub — MSR 2017 — `10.1109/MSR.2017.67`
5. Towards Mining OSS Skills from GitHub Activity — ICSE-NIER 2022 — `10.1109/ICSE-NIER55298.2022.9793514`
6. Mining the Technical Roles of GitHub Users — IST 2021 — `10.1016/j.infsof.2020.106485`
7. RepoSkillMiner — ASE 2020 — `10.1145/3324884.3415305`
8. CodeCV — SCAM 2022 — `10.1109/SCAM55253.2022.00021`
9. Lean GHTorrent: GitHub Data on Demand — MSR 2014 — `10.1145/2597073.2597126`
10. Not All Dockerfile Smells Are the Same — MSR 2024 — `10.1145/3643991.3644905`

---

### 🤖 Top 10 AI Recruitment Papers

1. Application of LLM Agents in Recruitment — arXiv:2401.08315 (J. Info. Processing 2024)
2. Fairness in AI-Driven Recruitment: Challenges, Metrics, Methods — arXiv:2405.19699
3. Evaluating Bias in LLMs for Job-Resume Matching — arXiv:2503.19182
4. FairCVtest Demo: Bias in Multimodal Fair Automatic Recruitment — arXiv:2009.07025
5. Toward a Traceable, Explainable, and Fair JD/Resume Recommendation System — arXiv:2202.08960
6. Requirements of eXplainable AI in Algorithmic Hiring — CEUR-WS Vol-3744, paper 8
7. Mapping Stakeholder Needs to Multi-Sided Fairness in Candidate Recommendation — arXiv:2508.00908
8. Job Posting-Enriched Knowledge Graph for Skills-Based Matching — arXiv:2109.02554
9. AI Hiring with LLMs: Context-Aware Explainable Multi-Agent Resume Screening — arXiv:2504.02870 ⚠️ *unverified*
10. Human and LLM-Based Resume Matching — NAACL Findings 2025 ⚠️ *unverified*

---

### 👤 Top 10 Developer Profiling Papers

1. Expertise Browser — ICSE 2002 — `10.1145/581339.581401`
2. Dev2vec — IST 2023 — `10.1016/j.infsof.2023.107218`
3. Automatically Deriving Developers' Technical Expertise (GNN) — TOSEM 2026 — `10.1145/3746451`
4. Towards Mining OSS Skills from GitHub Activity — ICSE-NIER 2022
5. RepoSkillMiner — ASE 2020
6. Mining the Technical Roles of GitHub Users — IST 2021
7. CodeCV — SCAM 2022
8. Understanding Skills for OSS Communities on GitHub — FSE 2022 — `10.1145/3540250.3549082`
9. Activity Traces and Signals in Developer Recruitment and Hiring — CSCW 2013
10. Identifying Experts in Software Libraries and Frameworks (CVExplorer) — arXiv:1903.08113 ⚠️

---

### 📊 Top 10 Software Repository Mining Papers
*(overlaps GitHub-mining by definition; broader artifact focus)*

1. The Promises and Perils of Mining GitHub — MSR 2014
2. Expertise Browser — ICSE 2002 *(VCS/change-data mining)*
3. Don't Touch My Code! Ownership and Software Quality — ESEC/FSE 2011 — `10.1145/2025113.2025119`
4. An Empirical Analysis of the Docker Container Ecosystem — MSR 2017
5. Not All Dockerfile Smells Are the Same — MSR 2024
6. Fixing Dockerfile Smells: An Empirical Study — EMSE 2024 — `10.1007/s10664-024-10471-7`
7. Why Do GitHub Actions Workflows Fail? — TOSEM — `10.1145/3749371`
8. GHTorrent — MSR 2012
9. An In-Depth Study of Promises and Perils — EMSE 2016
10. Mining the Technical Roles of GitHub Users — IST 2021

---

### 🕸 Top 10 Knowledge Graph Papers
*(⚠️ **Thin category — only 3 strongly verified and directly relevant.** This is a documented gap: KGs for **verified developer skill** are essentially unexplored.)*

1. Application of Knowledge Graph in Software Engineering: SLR — IST 2023 — `10.1016/j.infsof.2023.107327`
2. Job Posting-Enriched Knowledge Graph for Skills-Based Matching — arXiv:2109.02554
3. Automatically Deriving Developers' Technical Expertise (GNN over GitHub network) — TOSEM 2026 — `10.1145/3746451`
4. Knowledge Graph Construction and Talent Competency Prediction for HR — *Alexandria Eng. J.* (ScienceDirect S1110016825002194) ⚠️ *DOI unconfirmed*
5. A Comprehensive Survey on Automatic Knowledge Graph Construction — ACM Computing Surveys — `10.1145/3618295` ⚠️ *verify*
6. Defining a Knowledge Graph Development Process Through a Systematic Review — TOSEM — `10.1145/3522586` ⚠️ *verify*
7. Knowledge-driven Unsupervised Skills Extraction for Graph-based Talent Matching ⚠️ *venue unverified*
8. LLM-empowered Knowledge Graph Construction: A Survey — arXiv:2510.20345 ⚠️
9. Generative Knowledge Graph Construction: A Review — EMNLP 2022 ⚠️
10. JobMatchAI: Knowledge Graphs, Semantic Search and Explainable AI ⚠️ **could not verify — treat as unconfirmed**

---

### 🔍 Top 10 Explainable AI Hiring Papers
*(⚠️ **Thin category — ~4 solid entries.** XAI applied specifically to *developer* hiring is nearly absent — a major opportunity.)*

1. Requirements of eXplainable AI in Algorithmic Hiring — CEUR-WS Vol-3744 (FINDHR)
2. Toward a Traceable, Explainable, and Fair JD/Resume Recommendation System — arXiv:2202.08960
3. Fairness in AI-Driven Recruitment: Challenges, Metrics, Methods — arXiv:2405.19699
4. Mapping Stakeholder Needs to Multi-Sided Fairness in Candidate Recommendation — arXiv:2508.00908
5. FairCVtest Demo — arXiv:2009.07025
6. Evaluating Bias in LLMs for Job-Resume Matching — arXiv:2503.19182
7. Counterfactual Explanations and Algorithmic Recourses for ML: A Review — arXiv:2010.10596 *(general XAI; directly supports counterfactual hiring explanations)*
8. AI Hiring with LLMs: Context-Aware Explainable Multi-Agent Framework — arXiv:2504.02870 ⚠️
9. Explainable and Bias-Aware LLM Based Resume Screening — IJCOPE ⚠️ *low-tier venue; verify quality*
10. Machine Learning Bias in Resume Screening ⚠️ *ResearchGate only; verify*

---

## Research Gap Analysis & Novel Contributions for EngineerDNA

### 🔴 Gap 1 — Skill *inference* is well-studied; skill **verification** is not

**Evidence.** Every profiling paper surveyed (A1–A8) *infers* expertise — from text (RepoSkillMiner), embeddings (Dev2vec), graphs (TOSEM 2026), or activity signals (Liang et al.). **None applies a falsifiable verification standard** where a claim is checked against artifacts and can be **refuted**.

**Your contribution.** EngineerDNA's `USED` vs `MENTIONED` distinction plus the `CLAIMED → VERIFYING → VERIFIED / REFUTED` lifecycle is a **verification** framing, not an inference framing. **The `REFUTED` state appears to be genuinely novel** — no surveyed system can say "this claimed skill is contradicted by the evidence."

**Publishable claim:** *"From skill inference to skill falsification: an evidence-based verification model for developer expertise."*

---

### 🔴 Gap 2 — Configuration artifacts (Dockerfile, CI/CD, manifests) are studied for *quality*, never for *skill attribution*

**Evidence.** C1–C4 study Dockerfiles and GitHub Actions extensively — smells, failures, evolution — always as **software-quality** or **maintenance** objects. Meanwhile A1–A8 infer skills almost entirely from **code and social activity**. **The two literatures do not intersect.** No surveyed paper uses "a Dockerfile exists + compose exists + CI builds the image + deployment uses it" as *proof of a developer's Docker competence*.

**Your contribution.** This is **exactly EngineerDNA's flagship example**, and it sits in a genuine, documented void. Combined with C2's expert-practice findings and Hadolint, you can go further than binary proof to **graded proficiency**.

**Publishable claim:** *"Infrastructure-as-evidence: attributing DevOps competence from configuration artifacts."* — **This is your strongest single novel contribution.**

---

### 🔴 Gap 3 — Multi-source evidence triangulation is unexplored

**Evidence.** Dev2vec uses three GitHub-internal sources and is notable *for that*. CodeCV bridges GitHub↔Stack Overflow. But **no surveyed work triangulates across GitHub + CI/CD + competitive programming + résumé + portfolio**, and none models **corroboration or contradiction between sources**.

**Your contribution.** EngineerDNA ingests all of these. The novel research object is a **corroboration model**: what does it mean when a résumé claims Kubernetes, GitHub shows none, but CI configs show Helm charts? A **confidence calculus over heterogeneous, possibly-conflicting sources** is unaddressed in this literature.

**Publishable claim:** *"Evidence triangulation and conflict resolution for developer skill verification."*

---

### 🔴 Gap 4 — No counterfactual explanations in developer hiring

**Evidence.** G1 (FINDHR) argues counterfactual explanations are *required* for algorithmic hiring (GDPR, right to contest). **Zero surveyed developer-profiling papers provide them.** Your ranking already gives factual explanations (per-factor score/weight/reason) — ahead of Dev2vec and the TOSEM GNN, both opaque — but not counterfactual ones.

**Your contribution.** Evidence-based verification makes counterfactuals **natural and actionable**: *"Add a verified Kubernetes deployment and you enter the top 10 for this role."* Embedding-based systems fundamentally cannot produce this. **The same computation powers your Learning Roadmap** — one mechanism, three payoffs (compliance, candidate agency, product feature).

**Publishable claim:** *"Actionable recourse in evidence-based technical hiring."*

---

### 🟠 Gap 5 — Fairness of *evidence-based* (rather than résumé-based) hiring is unstudied

**Evidence.** E2/E3/E4 study fairness of résumé and LLM screening. **No surveyed work asks whether ranking by public OSS activity is itself fair.** Public-contribution signals plausibly correlate with discretionary time, employer OSS policy, and socioeconomic status.

**Your risk *and* opportunity.** This is the **most serious ethical exposure in your product** and a reviewer will raise it immediately. It is also **an unclaimed research contribution**: a fairness audit of evidence-based developer ranking, using E2's metric catalogue, would be novel, valuable, and would materially strengthen both the paper and the product's defensibility.

**Publishable claim:** *"Is evidence fairer than claims? A fairness audit of artifact-based developer ranking."*

---

### 🟡 Gap 6 — Non-technical and collaborative skills are absent from your model

**Evidence.** A8 establishes **45 skills across 9 categories**; A2 detects mentoring and commitment. Your ten DNA dimensions are **entirely technical** — covering roughly one of nine categories.

**Opportunity.** Code review behavior, issue triage, mentoring, and documentation are all minable from data you *already ingest* (PRs, issues). Adding a **collaboration dimension** is low-effort, literature-grounded, and differentiating — recruiters consistently value these and no competitor scores them from evidence.

---

### 🟡 Gap 7 — No predictive validity study anywhere in this literature

**Evidence.** Marlow & Dabbish show recruiters *perceive* activity traces as reliable. Profiling papers validate against **self-reports or proxy labels**. **No surveyed paper demonstrates that mined expertise predicts actual job performance or hiring success.**

**Opportunity.** Your platform uniquely closes the loop — you record applications through to `HIRED` and have an append-only `ApplicationEvent` timeline. **Correlating DNA scores with real hiring outcomes would be the first predictive-validity evidence in this field.** That is a top-venue contribution and requires no new modeling, only longitudinal data collection.

> 📝 **Strategic note:** Start logging this now. Predictive validity is the single most valuable dataset you could accumulate, it compounds with time, and **no competitor or academic group can easily replicate it** — it requires exactly your two-sided platform position.

---

### Summary: EngineerDNA's Defensible Novelty

| Contribution | Novelty | Supporting gap |
|---|:-:|:-:|
| Infrastructure-as-evidence (Docker/CI/CD ⇒ DevOps competence) | 🟢 **Strong** | Gap 2 |
| Falsifiable verification with `REFUTED` state | 🟢 **Strong** | Gap 1 |
| Multi-source triangulation + conflict resolution | 🟢 **Strong** | Gap 3 |
| Counterfactual recourse in technical hiring | 🟢 **Strong** | Gap 4 |
| Fairness audit of evidence-based ranking | 🟡 Novel, unclaimed | Gap 5 |
| Predictive validity via hiring outcomes | 🟢 **Strongest long-term** | Gap 7 |
| Graded (not binary) artifact proficiency via Hadolint | 🟡 Incremental but publishable | Gap 2 |
| Explainable ranking (factual) | 🟠 Partially covered by G1/G2 | — |
| Evidence knowledge graph in Neo4j | 🟡 Novel *as evidence graph*; social graphs exist (A5) | Gap 3, F1 |

---

## Unverified Candidates (do not cite without checking)

These surfaced during searching but I could **not** independently confirm bibliographic details, venue legitimacy, or in some cases existence. Verify each before use.

| Paper | Concern |
|---|---|
| JobMatchAI: Intelligent Job Matching Using KGs, Semantic Search, XAI (arXiv:2603.14558) | Could not verify; recent arXiv ID unconfirmed |
| ConFit v3: Improving Resume-Job Matching with LLM Re-Ranking (arXiv:2605.09760) | Not verified |
| De-conflating Preference and Qualification... Job Recommendation with LLMs (arXiv:2602.03097) | Not verified |
| An Empirical Study of the Evolution of GitHub Actions Workflows (arXiv:2602.14572) | Not verified |
| Studying Software Developer Expertise and Contributions in Stack Overflow and GitHub (IEEE 9240693) | Venue/DOI unconfirmed |
| EARec: Pull-Request Reviewer Recommendation (IEEE 7809395) | DOI/year unconfirmed |
| Characterizing Occurrence of Dockerfile Smells (IEEE Access) | DOI unconfirmed |
| Identifying Experts in Software Libraries and Frameworks / CVExplorer (arXiv:1903.08113) | Venue/DOI unconfirmed |
| Knowledge Graph Construction and Talent Competency Prediction for HR (ScienceDirect) | DOI unconfirmed |
| Behroozi/Parnin technical-interview stress studies | Widely reported; **primary record not verified** |
| Explainable and Bias-Aware LLM Resume Screening (IJCOPE) | ⚠️ Low-tier/unknown venue — assess quality carefully |
| Machine Learning Bias in Resume Screening (ResearchGate) | No peer-reviewed venue confirmed |
| Bias Aware Resume Screening (IJISRT) | ⚠️ Predatory-adjacent venue risk — verify before citing |

> ⚠️ **Predatory-venue warning:** Several results in the AI-recruitment space come from low-quality or pay-to-publish journals. For a top-tier submission, restrict citations to IEEE/ACM/Springer/Elsevier venues and well-established arXiv preprints from known groups.

---

## Recommended Reading Order

1. **Marlow & Dabbish (2013)** — establishes *why* the product should exist.
2. **Liang, Zimmermann & Ford (2022)** — the method and evaluation design to emulate.
3. **Kalliamvakou et al. (2014)** — the data traps to avoid *before* you trust your own scores.
4. **RepoSkillMiner + Dev2vec + TOSEM 2026** — your three competitors; know exactly how you differ.
5. **Cito et al. (2017) + Rosa et al. (2024)** — build the Docker verification argument properly.
6. **de Groot et al. (2021)** — the blueprint for the Neo4j layer.
7. **FINDHR XAI (2024) + Fairness survey (2024)** — do not ship or publish without these.
