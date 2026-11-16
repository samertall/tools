# AI Disclosure Statement — FounderLens AI

**Runtime model:** `onnx-community/SmolLM2-135M-Instruct-ONNX-MHA`; a free, open-weight ONNX version of `HuggingFaceTB/SmolLM2-135M-Instruct` using the q8 quantized representation and local WebAssembly CPU inference.

**Model provider:** Hugging Face, for open model downloads. No paid inference API, credit card, subscription or access key required.

**Runtime tools:** `@huggingface/transformers@3.8.1` (jsDelivr), ONNX Runtime Web, browser JavaScript. One model generation per user click; `max_new_tokens:170`. Number of input tokens varies with founder hypothesis and up to four excerpts of 1600 characters each. Token counts are not yet precisely instrumented.

**Roles:** The model proposes risks, missing evidence and discovery questions. Deterministic client code maintains the user-provided source ledger. Human chooses the conclusion, writes rationale and approves or rejects export.

**AI-assisted building declaration:** Source, interface, documentation and tests were drafted with OpenAI ChatGPT GPT-6 on November 16, 2026. The building assistant is not used at runtime.

**Demo integrity:** The existing YouTube video https://youtu.be/Y-k95RwgRkc was generated as a concept walkthrough, not recorded from a complete working application. A separate <=3-minute real-run demonstration is still required.

**Verification pending:** Browser model inference and complete on-device workflow test on deployed site; later update this statement if the implementation changes.
