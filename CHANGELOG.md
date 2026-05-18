# [1.8.0-alpha.3](https://github.com/snatalenko/morphos/compare/v1.8.0-alpha.2...v1.8.0-alpha.3) (2026-05-18)


### Features

* Option to hide root element on json schema editor ([e0975c5](https://github.com/snatalenko/morphos/commit/e0975c59e4bcb173bd2b36f5ef2f556a353cef5a))


# [1.8.0-alpha.2](https://github.com/snatalenko/morphos/compare/v1.8.0-alpha.1...v1.8.0-alpha.2) (2026-05-18)


### Features

* JsonSchema editor ([926cd6a](https://github.com/snatalenko/morphos/commit/926cd6a87da098ab10e6800264e8768ca35318f7))

### Changes

* Patch vulnerabilities in dev dependencies ([8970c9d](https://github.com/snatalenko/morphos/commit/8970c9d79c3d4c95093a6f466c639e81a62e51f9))


# [1.8.0-alpha.1](https://github.com/snatalenko/morphos/compare/v1.8.0-alpha.0...v1.8.0-alpha.1) (2026-05-16)


### Build System

* Enable CI scripts on alpha and beta branches ([bf763fa](https://github.com/snatalenko/morphos/commit/bf763fab8fbb559699f725e5a7e69d9239b3cf10))


# [1.8.0-alpha.0](https://github.com/snatalenko/morphos/compare/v1.7.2...v1.8.0-alpha.0) (2026-05-15)


### Features

* OpenAI integration for schema-to-schema mapping creation ([1bb28eb](https://github.com/snatalenko/morphos/commit/1bb28eb0e31f09e4c974bbaecb61d0c0b4582e3f))
* Mapping editor in React with bootstrap 3.4/5.3 themes ([24d1b18](https://github.com/snatalenko/morphos/commit/24d1b18aad5fed2bdee480e87946f0837c560691))
* `concat` instruction for composing arrays from multiple optional sources ([0c6b964](https://github.com/snatalenko/morphos/commit/0c6b9643b0f0f6dbe06b23bdef0289df41b082be))
* Conditional when/then statements ([d98b402](https://github.com/snatalenko/morphos/commit/d98b4020d6b9747c4dbc6ae29f61901e1ff4ac76))

### Changes

* Playground page for experimenting with the editor and mapping auto-generation ([9b264bf](https://github.com/snatalenko/morphos/commit/9b264bf81370d002324aea32e56c802d20d7994f))
* Patch vulnerabilities in dev dependencies ([fcd7764](https://github.com/snatalenko/morphos/commit/fcd7764398a7ccbcd3b1773f87bda4addf46529e))
* Set min-release-age=7 for npm packages ([073c6ee](https://github.com/snatalenko/morphos/commit/073c6eec0558e6b233362872164b3b318af59a37))
* Change name "declarative-mapper" to "morphos" ([5b1a7a9](https://github.com/snatalenko/morphos/commit/5b1a7a9d5bd431ee67d2d17402f87da01bdaa0c2))

### Documentation

* Update readme, add index.html ([2751e39](https://github.com/snatalenko/morphos/commit/2751e399c889bba85824b9a3650558ffd3e9bffa))
* Publish the interactive editor playground ([9771069](https://github.com/snatalenko/morphos/commit/9771069d0b42a4f7c247e1f39ed26979afe81f3b))

### Tests

* Add security tests ([55952eb](https://github.com/snatalenko/morphos/commit/55952eb7c519cfc4101797fa054aa0e5a22f9771))

### Build System

* Add alpha/beta tag support to GH publish workflow ([716f221](https://github.com/snatalenko/morphos/commit/716f22174a57d3407286c092018b7419c192a455))
* Update tags cleanup script with alpha/beta/rc version support ([36f3c03](https://github.com/snatalenko/morphos/commit/36f3c035ac938b359fd918bccd0adee4d0b0f21d))
* Replace npmignore with "files" list ([b7a73f1](https://github.com/snatalenko/morphos/commit/b7a73f146fdcd84a6ffa7241d6d935d66acc09b0))


## [1.7.2](https://github.com/snatalenko/morphos/compare/v1.7.1...v1.7.2) (2026-03-04)


### Documentation

* Add example of an extension function ([085bcb7](https://github.com/snatalenko/morphos/commit/085bcb7aee9cfea1484ffa468b44d0ed55caa56e))
* Fix TOC in readme ([f0332e6](https://github.com/snatalenko/morphos/commit/f0332e65390e42f9155c1ccf9f320bd63f26487f))
* Describe `extensions` ([5d62ae9](https://github.com/snatalenko/morphos/commit/5d62ae98d0171fb8f0f78248867d4ccb10b40f61))
* Drop nodejs requirement; browser is supported ([9e83a9c](https://github.com/snatalenko/morphos/commit/9e83a9cd33fd5bec2bcfac04f6829cac3e705186))
* Add compatibility and engine requirements ([6bd6c25](https://github.com/snatalenko/morphos/commit/6bd6c25b00c331cb7e1c56d7c1dae659b6e87bbe))
* Cleanup the quick start example ([6ac50d8](https://github.com/snatalenko/morphos/commit/6ac50d890001f2ecdff922ceff529d892799f86a))


## [1.7.1](https://github.com/snatalenko/morphos/compare/v1.7.0...v1.7.1) (2026-03-03)


### Documentation

* Update readme, keywords, and description ([cafcf93](https://github.com/snatalenko/morphos/commit/cafcf930a0a2b2a13d6a078239a6519c55ffe472))


# [1.7.0](https://github.com/snatalenko/morphos/compare/v1.6.4...v1.7.0) (2026-03-03)


### Features

* Support template-based dynamic output keys ([7ff2070](https://github.com/snatalenko/morphos/commit/7ff207027262225063dc34609907811a2dc6f3ce))

### Changes

* Apache 2.0 license ([f200a2a](https://github.com/snatalenko/morphos/commit/f200a2a88f1a3b394276b62c39a46588b615fe43))

### Refactoring

* Remove unused default parameters from inner functions ([2ce8aa4](https://github.com/snatalenko/morphos/commit/2ce8aa4038c9bec7ee2281152a9d4199491f8076))
* Cleanup types; use imports with TS extensions ([2ed24bc](https://github.com/snatalenko/morphos/commit/2ed24bc70855313c28d086261ccaae1e74bbb412))

### Documentation

* Fix tests workflow badge ([e02d95f](https://github.com/snatalenko/morphos/commit/e02d95f1e6b05b039a1f1555d150ce4963d7e511))
* Add contributing guidelines and development setup instructions ([7361601](https://github.com/snatalenko/morphos/commit/7361601adce8bda1a0a3ccdb083c924405e15523))

### Tests

* Add missing tests to improve coverage ([8b3606a](https://github.com/snatalenko/morphos/commit/8b3606add20870c6256bc6e18583bb3f037d4047))
* Add missing tests to improve coverage ([851e673](https://github.com/snatalenko/morphos/commit/851e67314ca77b9be910bade56e3763018f85720))
* Allow running individual tests with `npm t` ([adb76a4](https://github.com/snatalenko/morphos/commit/adb76a46b09ba6780745d78dde12598846dc6e1e))

### Build System

* Re-generate changelog content on every version ([33218c6](https://github.com/snatalenko/morphos/commit/33218c6bcc394dd751df97b94a2a24cb40b59d0a))
* Add automatic pre-release tags cleanup ([2477330](https://github.com/snatalenko/morphos/commit/2477330ba96f90dccb70c415958d89e45a49aee3))
* Add pre-release publishing script ([7448cfc](https://github.com/snatalenko/morphos/commit/7448cfcc47f416f820db453bd4afd7c5e3436886))
* Add eslint ([f6b5b4b](https://github.com/snatalenko/morphos/commit/f6b5b4b6d47d9a83e1225d3d4c2649b80c73b2d0))
* Add separate CJS and ESM builds ([bce1531](https://github.com/snatalenko/morphos/commit/bce1531c8cd21cdb04837e622f4028eecb4b82fa))
* Update dev dependencies ([24b1d4c](https://github.com/snatalenko/morphos/commit/24b1d4cde4fb5650e9d495600a27c02c6e41000a))


## [1.6.4](https://github.com/snatalenko/morphos/compare/v1.6.3...v1.6.4) (2025-07-25)


### Fixes

* Vulnerabilities in dev dependencies ([6c05044](https://github.com/snatalenko/morphos/commit/6c0504484d72a6ab0a6db80b2c9a199712ae488f))
* Mapping failure on undefined properties in `forEach` directive ([9994c5c](https://github.com/snatalenko/morphos/commit/9994c5c72109be36710fc42a996cc92618446070)), closes [#11](https://github.com/snatalenko/morphos/issues/11)

### Changes

* Stricter `from` and `forEach` instruction detection to avoid false positives ([e5ed806](https://github.com/snatalenko/morphos/commit/e5ed8064bb8a36741a0a7b077c7437b10963d27c))


## [1.6.3](https://github.com/snatalenko/morphos/compare/v1.6.2...v1.6.3) (2024-08-31)


### Fixes

* Inability to map field names incompatible with JS variable name syntax ([52555ab](https://github.com/snatalenko/morphos/commit/52555ab83fa6fa7718b20ecc37ce53fc66a34bf8))

### Changes

* Upgrade dependencies to fix audit vulnerabilities ([27487f6](https://github.com/snatalenko/morphos/commit/27487f64564637a354747aaa85203abdbcf0ff97))


## [1.6.2](https://github.com/snatalenko/morphos/compare/v1.6.1...v1.6.2) (2024-01-08)


### Fixes

* Support for safe global objects and functions ([4b219a0](https://github.com/snatalenko/morphos/commit/4b219a06f29bd124cbcb0023008d8520ad70599a))

### Changes

* Update dependencies ([43c35df](https://github.com/snatalenko/morphos/commit/43c35dfbd5f032a40d373709ebb570c39510f379))


## [1.6.1](https://github.com/snatalenko/morphos/compare/v1.6.0...v1.6.1) (2023-07-16)


### Fixes

* Vulnerabilities in dev dependencies ([6e77342](https://github.com/snatalenko/morphos/commit/6e77342ecc8672fbc145769186bbdc4401e70635))
* Files placement in Dist folder ([c1c4b55](https://github.com/snatalenko/morphos/commit/c1c4b5501a215502875e4d3c933dc5d759ea76f7))

### Build System

* Add missing conventional-changelog-cli dependency ([6fcfdf4](https://github.com/snatalenko/morphos/commit/6fcfdf4572140999d447e400dc5c5fd269ec04a9))


# [1.6.0](https://github.com/snatalenko/morphos/compare/v1.5.1...v1.6.0) (2023-06-11)


### Changes

* Stricter mapping json schema ([6ad783b](https://github.com/snatalenko/morphos/commit/6ad783b93ef78eda885304aa151d6c4c563d7443))


## [1.5.1](https://github.com/snatalenko/morphos/compare/v1.5.0...v1.5.1) (2023-02-25)


### Build System

* Upgrade note to v16 ([795ef1b](https://github.com/snatalenko/morphos/commit/795ef1b1f972d57559e77f50a5f101ab01db7c64))


# [1.5.0](https://github.com/snatalenko/morphos/compare/v1.4.6...v1.5.0) (2023-02-25)


### Changes

* `$context` property when mapping with `from` directive ([180d61c](https://github.com/snatalenko/morphos/commit/180d61c0f029ada022d1a708be07600ccb8195e8))

### Build System

* Update dev dependencies ([dba9278](https://github.com/snatalenko/morphos/commit/dba9278c0224e4ee44fc5c56826b61238b77eee4))
* Add npm "build" script ([7de8612](https://github.com/snatalenko/morphos/commit/7de86122061573e9a61d955ddfb03b5bd5343d7a))


## [1.4.6](https://github.com/snatalenko/morphos/compare/v1.4.5...v1.4.6) (2022-08-18)


### Documentation

* Add mapping instructions ([a3d32a6](https://github.com/snatalenko/morphos/commit/a3d32a66e00ea4fcf5f68bd5f7890e031bfb1970))


## [1.4.5](https://github.com/snatalenko/morphos/compare/v1.4.4...v1.4.5) (2022-07-14)


### Fixes

* Vulnerabilities in dev dependencies ([e2a7963](https://github.com/snatalenko/morphos/commit/e2a79634d3b2f6d690f5e53fe8f7795bb7f4107b))

### Changes

* Bump y18n from 4.0.0 to 4.0.1 ([df03154](https://github.com/snatalenko/morphos/commit/df03154945e625f535f985ebaf10a8c1e4f762c9))
* Use original `sandbox` obj as VM context for mapping execution ([a55beb0](https://github.com/snatalenko/morphos/commit/a55beb04c2bb8cb71a088caf65a58f61be1fb7ad))


## [1.4.4](https://github.com/snatalenko/morphos/compare/v1.4.3...v1.4.4) (2020-10-07)


### Fixes

* Incorrect mapping of 1-element arrays without 'map' keyword ([0996dca](https://github.com/snatalenko/morphos/commit/0996dca442f8272f7d4b27ef5c570ba0222e975b))


## [1.4.3](https://github.com/snatalenko/morphos/compare/v1.4.2...v1.4.3) (2020-09-28)


### Fixes

* Sample generation for non-string enums ([c7f3921](https://github.com/snatalenko/morphos/commit/c7f39215eb8560df5ed3525a3cb214fc8b539923))


## [1.4.2](https://github.com/snatalenko/morphos/compare/v1.4.1...v1.4.2) (2020-09-15)


### Fixes

* Export common type declarations ([6a1ecad](https://github.com/snatalenko/morphos/commit/6a1ecadcb62f684de1aa80689908271d1b60228a))


## [1.4.1](https://github.com/snatalenko/morphos/compare/v1.4.0...v1.4.1) (2020-09-15)


### Fixes

* Vulnerability in dev dependency ([2525e3b](https://github.com/snatalenko/morphos/commit/2525e3bf98e2e671f60eaae161215fb1af26aab5))

### Build System

* Run npm audit before new version assign ([79cbbd6](https://github.com/snatalenko/morphos/commit/79cbbd6ded0d75b5b71df519349370db7a32654b))


# [1.4.0](https://github.com/snatalenko/morphos/compare/v1.3.7...v1.4.0) (2020-09-15)


### Features

* Array elements mapping using JS array declaration syntax ([76fb5d5](https://github.com/snatalenko/morphos/commit/76fb5d5a482306ffce894043c903d04484fe4831))
* Mapping JSON schema ([6f168da](https://github.com/snatalenko/morphos/commit/6f168da7058003618faa29a0203fc9fc4faf690e))

### Fixes

* Comments in type definitions ([3fc9043](https://github.com/snatalenko/morphos/commit/3fc9043f6472c03bcdd5fb800ec3382b284a9daa))


## [1.3.7](https://github.com/snatalenko/morphos/compare/v1.3.6...v1.3.7) (2020-08-01)


### Fixes

* Destination shema modificaiton on allOf schemas merge ([9dc782f](https://github.com/snatalenko/morphos/commit/9dc782fa37cb971e34237ab7ee05034f0048f3eb))


## [1.3.6](https://github.com/snatalenko/morphos/compare/v1.3.5...v1.3.6) (2020-08-01)


### Fixes

* Objects concatenation in schema allOf ([64dfdb7](https://github.com/snatalenko/morphos/commit/64dfdb75e2a4b60bc2d5b5dfabcc1d7368301b02))


## [1.3.5](https://github.com/snatalenko/morphos/compare/v1.3.4...v1.3.5) (2020-07-29)


### Changes

* Support `readOnly` property in mappingForSchema ([4cbce91](https://github.com/snatalenko/morphos/commit/4cbce91d88fbdb99f4f500a2bdcd73ea5dd4b41a))


## [1.3.4](https://github.com/snatalenko/morphos/compare/v1.3.3...v1.3.4) (2020-07-28)


### Fixes

* Empty object mapping is detected as Array mapping ([5c178fc](https://github.com/snatalenko/morphos/commit/5c178fc98c8277d843c5ec856c6fb16bed45e404))

### Changes

* Handle `additionalProperties` in mapping/sampleForSchema ([3b5c7c5](https://github.com/snatalenko/morphos/commit/3b5c7c59e13bdee31b257792c71140c7f188a866))
* Handle empty `properties` and`items` in sampleForSchema ([16f38bc](https://github.com/snatalenko/morphos/commit/16f38bceb5d4e0411c5d03bb5ca8e9f0a8f203b2))


## [1.3.3](https://github.com/snatalenko/morphos/compare/v1.3.2...v1.3.3) (2020-07-28)


### Changes

* Support `allOf`, `oneOf`, `anyOf` in mappingForSchema ([2f5ee35](https://github.com/snatalenko/morphos/commit/2f5ee350be7c5094e458c0ce48cf81e095bbe9e0))


## [1.3.2](https://github.com/snatalenko/morphos/compare/v1.3.1...v1.3.2) (2020-07-28)


### Changes

* Handle empty `properties` and `items` in mappingForSchema ([937996a](https://github.com/snatalenko/morphos/commit/937996a8a68a00c405ff88081a9f4f7605cad439))


## [1.3.1](https://github.com/snatalenko/morphos/compare/v1.3.0...v1.3.1) (2020-07-27)


### Fixes

* Low severity vulnerabilities in dependencies ([cd3ce19](https://github.com/snatalenko/morphos/commit/cd3ce1982b98e8fbfc77e4f189dea67d1d1b5e96))

### Changes

* Use default values and examples for sample data generation ([ebb4d12](https://github.com/snatalenko/morphos/commit/ebb4d12c884a85ee5faca9350991e26367bd4ee9))


# [1.3.0](https://github.com/snatalenko/morphos/compare/v1.2.6...v1.3.0) (2020-07-11)


### Features

* Add mapping template generator ([17564de](https://github.com/snatalenko/morphos/commit/17564def40baf727a73c171625a6b6dbd646929c))


## [1.2.6](https://github.com/snatalenko/morphos/compare/v1.2.5...v1.2.6) (2020-07-05)


### Documentation

* Add version and downloads ([71f9068](https://github.com/snatalenko/morphos/commit/71f9068410f7887d956cb5940bbd3157149a8b06))

### Build System

* Use github actions for publishing ([d6dfc6c](https://github.com/snatalenko/morphos/commit/d6dfc6c8c903667b58b1609e85678a9b6ff89467))
* Exclude coverage metadata from npm package ([b3635f9](https://github.com/snatalenko/morphos/commit/b3635f919810e4a6e2c2664898bd8eaaf76e5c78))


## [1.2.5](https://github.com/snatalenko/morphos/compare/v1.2.4...v1.2.5) (2020-07-05)


### Documentation

* Add comments to the readme example ([30f0718](https://github.com/snatalenko/morphos/commit/30f0718ba162d7e1fc416adc92f106a7eed19b16))
* Add test coverage badge to readme ([039a98b](https://github.com/snatalenko/morphos/commit/039a98b3849c0326870a08df0b2faa4cf544e1c8))

### Build System

* Test coverage as separate github action ([d5040f1](https://github.com/snatalenko/morphos/commit/d5040f1664eeec5e15d61cfc65f025daa099addf))


## [1.2.4](https://github.com/snatalenko/morphos/compare/v1.2.3...v1.2.4) (2020-07-05)


### Build System

* Add lcov reporter ([64a69e7](https://github.com/snatalenko/morphos/commit/64a69e7889585117dc7fe4e6fa93e961b93b1599))


## [1.2.3](https://github.com/snatalenko/morphos/compare/v1.2.2...v1.2.3) (2020-07-05)


### Build System

* Add test coverage integration ([1d04114](https://github.com/snatalenko/morphos/commit/1d041145c9fbc83ec3f8bbefe48d6950116a9241))


## [1.2.2](https://github.com/snatalenko/morphos/compare/v1.2.1...v1.2.2) (2020-07-05)


### Changes

* Throw error when extension conflicts with input ([7e10861](https://github.com/snatalenko/morphos/commit/7e10861370d6c52338fb9c22bd0e4dd16bff474a))
* Remove $extensionNames var from execution context ([6554907](https://github.com/snatalenko/morphos/commit/6554907cbf33d9d970c628e991463dc56d56b11b))


## [1.2.1](https://github.com/snatalenko/morphos/compare/v1.2.0...v1.2.1) (2020-07-01)


### Build System

* Run tests and compilation before packing ([2c30d95](https://github.com/snatalenko/morphos/commit/2c30d95cf6988ec7c627d5aea161193900c9c60e))


# [1.2.0](https://github.com/snatalenko/morphos/compare/v1.1.1...v1.2.0) (2020-07-01)


### Features

* Make `map` parameter optional in plain objects mapping ([f8ef7b0](https://github.com/snatalenko/morphos/commit/f8ef7b0a74f88273fc0b0175c7a3e75ae46a35ca))


## [1.1.1](https://github.com/snatalenko/morphos/compare/v1.1.0...v1.1.1) (2020-06-25)


### Fixes

* Indentation in generated scripts ([9798e90](https://github.com/snatalenko/morphos/commit/9798e9083a1717e44047722516232c81e304b2b7))


# [1.1.0](https://github.com/snatalenko/morphos/compare/v1.0.1...v1.1.0) (2020-06-25)


### Features

* Root elements mapping from simple types ([8687141](https://github.com/snatalenko/morphos/commit/86871414def5da4f99db1e25b46cae4456d8268a))


## [1.0.1](https://github.com/snatalenko/morphos/compare/v1.0.0...v1.0.1) (2020-06-23)


### Build System

* Add tests badge ([fe40f8c](https://github.com/snatalenko/morphos/commit/fe40f8ccbaf7e86a4e292b1e6a7c95cd0eb34701))


# 1.0.0 (2020-06-23)



