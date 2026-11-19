# Testing Guide

> **When to use:** you are writing tests for a change, or running the suites locally or in CI.
>
> **What it answers:** how the suites are organised and run, how fixtures and factories supply data, the rules for mocking, and what each layer must assert.
>
> Delete this blockquote when filled.

This page is a how-to for running and writing tests, with reference tables for the layers and the fixtures they use. The procedures assume you can build the project; if you cannot, finish [`local-setup.md`](local-setup.md) first. The conventions the tests must satisfy are owned by the project's coding-standards document — this page describes testing practice and links there for naming and layering rules rather than restating them.

## 1. The test pyramid

Run the cheap layers often and the slow layer rarely, because the cost of a failure rises with the layer it is found in.

| Layer           | What it covers                                                                                     | Speed  | Isolation                                                          |
| --------------- | -------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| **Unit**        | Pure domain logic: invariants, value objects, validation, pure services.                           | Fast   | No I/O; collaborators stubbed at the boundary.                     |
| **Integration** | A real FastAPI app against a real database: status codes, side effects, idempotency, transactions. | Medium | Real database, real app; external services overridden.             |
| **End-to-end**  | One happy path per critical journey through the deployed stack.                                    | Slow   | Real dependencies; the smallest set that proves the journey works. |

The target mix is roughly 70% integration, 20% pure-domain unit, and 10% smoke. A test earns its place only if it fails when the behaviour it protects is wrong.

## 2. Running the suites

Run the full suite before you open a pull request; run the fast layer while you iterate.

```bash
# whole suite
<package-manager> run <test runner>

# one layer while iterating
<package-manager> run <test runner> <tests/unit>
<package-manager> run <test runner> <tests/integration>

# one file or one test
<package-manager> run <test runner> <tests/path/to/test_file.py>
<package-manager> run <test runner> <tests/path/to/test_file.py>::<test_name>

# with coverage
<package-manager> run <test runner> --cov
```

Async tests are identified by the runner's async mode, not by a per-test marker, so a test is `async def` without a decorator. A run that mutates the schema uses a fresh database per test; a run that only reads may share one per worker.

## 3. Fixtures and factories

Data comes from a factory, never from a static fixture checked into the repository, so each test builds exactly the rows it needs and the data is valid by construction.

| Fixture / helper  | Provides                                                       | Notes                                                                    |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| \<client fixture> | An HTTP client bound to the app under test.                    | Reused across a layer.                                                   |
| \<db fixture>     | A session against a real, isolated database.                   | Real \<datasource>; schema created and dropped per test.                 |
| \<factory>        | A domain object with sensible defaults and per-test overrides. | One factory per aggregate; override only the fields the test asserts on. |
| \<auth override>  | A principal, with the auth dependency overridden.              | Override with a zero-argument callable returning an async mock.          |

A test overrides a FastAPI dependency rather than monkeypatching internals. The override is a callable that takes **no arguments** — a callable with parameters is treated as a dependency itself and fails validation.

Delete this note when filled. \<Name this project's actual fixtures and factories, and delete the rows it does not have.>

## 4. The rules for mocking

Mock the boundary, never the layer under test. A mock that returns the exact shape the assertion expects hides the bug the test was written to catch.

| Do mock                                                                        | Never mock                                               |
| ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| External dependencies: the database driver, an HTTP client, a third-party SDK. | The application logic under test.                        |
| Boundary services reached over the network.                                    | The database session, to test a repository.              |
| The clock, when the test depends on time passing.                              | A serializer or validator whose output is the assertion. |

- Override dependencies at the app boundary; do not patch the service layer.
- Prefer a real database over a mocked session. A repository test that mocks the session tests the mock.
- A mock whose return value is copied from the expected assertion is a smell: assert on a value derived from the requirement instead.

## 5. What each layer must assert

| Layer           | Must assert                                                                                | Must not                                                                  |
| --------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **Unit**        | The domain invariant, with the expected value taken from the spec.                         | Trivial getters, one-line delegations, or a re-run of the implementation. |
| **Pydantic**    | Cross-field invariants and validator logic that a field constraint cannot express.         | Anything a `Field(min_length=..., pattern=...)` already enforces.         |
| **Integration** | Status codes, response shape, persisted side effects, idempotency, transaction boundaries. | Internal helpers already covered by a unit test.                          |
| **End-to-end**  | That one critical journey completes against the real stack.                                | Every variation of that journey.                                          |

Assert on the requirement, not on a value recomputed by the code under test; the test-name pattern is owned by the project's [`coding-rules`](coding-rules/) folder.

## 6. References

- Related docs: [`local-setup.md`](local-setup.md)
- Authority: the project's [`coding-rules`](coding-rules/) folder — test naming, layering, and typing rules.
- Conventions: [`CONVENTIONS.md`](../CONVENTIONS.md) §12 — one authority per rule.
