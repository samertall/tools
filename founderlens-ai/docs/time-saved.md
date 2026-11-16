# Time-Saved Report — baseline and measurement

**Task:** Turn a founder hypothesis and three existing notes into a source ledger, critique and customer-discovery questions.

**Manual scenario:** The app's prefilled 30-minute value is an editable illustrative UI estimate, **not an empirical finding**.

**Assisted scenario:** The app measures actual duration from clicking Generate to completion of its local inference, including any first-time model download. It DOES NOT measure review/edit/export duration; therefore it is **not a complete assisted-task completion time**.

**Full evaluation plan:**
1. Give participants the same source packets for a manual and an assisted task, counterbalancing order.
2. Time all steps from receipt of research packet through human-validated report export.
3. Record correctness of source attributions, usefulness of discovery questions, review confidence, errors and whether downloads were cold or cached.
4. Calculate median manual vs assisted time and the difference, including sample size and range.
5. Publish findings only after actual testing.

**Observed technical measurement (Nov 16, 2026):** Seven unit tests and one browser E2E test passed. For the synthetic case, recorded click-to-generated-critique time was **18.1 seconds**, including model initialization/download if needed, but excluding all human review/export steps. A full manual or assisted user-task time has **not** been measured. **Verified time saved: NOT ESTABLISHED.** The UI's 30-minute baseline is a placeholder estimate, not an observed value.\n\n**Illustrative scenario (not evidence):** If the same complete task required 30 minutes manually (assumption), and the assisted process required 18 seconds of generation plus 8 minutes of human review, sourcing and correction (assumption), the hypothetical net saving would be roughly 21.7 minutes. These values have not been tested and must not be presented as measured findings. Validate with paired sessions before claiming results.
