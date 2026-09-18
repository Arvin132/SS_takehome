# CODING.md

Coding patterns to follow across this repo (backend and frontend).

## 1. DRY

Don't repeat logic. Pull repeated or reusable logic into a named function. If a function's
logic is getting too complex, split it into smaller functions with clear single purposes.
Don't over-split trivial code just to look modular.

## 2. Minimal comments

Comments belong at the top of a function or at genuinely confusing spots, not scattered
everywhere. Max ~2 lines per comment block, and 90% of the time a single line is enough.
No walls of text. No AI-jargon, buzzwords, or em-dashes in code or comments.

## 3. Standard input

Functions should expect a standard, predictable shape of input. Don't write functions that
try to accommodate many different argument types/shapes. Two accepted input shapes is the
max — beyond that, split into separate functions.

## 4. Use OOP in Django

Operations tied to a model belong on that model (or its manager) as a method, not as loose
helper functions scattered in views/utils. Use abstraction: views and serializers should call
`instance.do_thing()`, not reimplement `do_thing` inline.

## 5. Keep it simple

KISS. Prefer the simple, obvious solution over a clever or overly abstracted one. Simplicity
beats flexibility for hypothetical future needs.
