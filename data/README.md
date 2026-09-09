# N-MAT Data Directory

This directory stores datasets and samples for the N-MAT platform (SIH Problem Statement 26099).

## Structure

- `raw/`: Read-only synthetic and master datasets.
  - `cpse_material_master_synthetic.csv`: 9,600 CPSE material catalog records across 4 CPSEs (IOCL, NTPC, SAIL, BHEL) mapped to 1,340 common national material codes.
  - `cpse_material_matching_training_synthetic.csv`: 31,400 pairwise material comparisons (match/non-match) reserved for ML model training in Phase 7.
- `processed/`: Output directory for normalized and preprocessed artifacts.
- `samples/`: Small subsets for unit testing and quick verification.
