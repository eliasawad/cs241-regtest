# CS 241 Register Test Script
## Installation and Usage
```bash
npm i cs241-regtest
npx cs241-regtest [source] [testFile]
```
- `source` is the path to the source file
- `testFile` is the path to the test suite in JSON format
## `testFile` format
The file specified by `testFile` is in JSON format with the following parameters:
- `preprocessor` is a string specifying how a source file will be compiled into a machine-readable format. For CS 241, a MIPS assembly file may be translated with programs like `cs241.wordasm` or `cs241.binasm`. Any preprocessor must accept the file as redirected into the its stdin and out of its stdout, like `cs241.wordasm < input` rather than `cs241.wordasm input`.
- `destination` is a string that specifies where the output of `preprocessor` will be redirected. A relative path wil be resolved from the current working directory, not the location of the test file. Avoid shell-specific expansions like `~` for the home directory. If `preprocessor` is specified but `destination` is not, the output of the preprocessor will be written to a file in the same directory as the source file with the same name as the file but without an extension. Be careful that the output program does not overwrite the source file in the case that the source file does not have an extension.
- `runtime` is a string specifying the runtime environment of the executable. For CS 241, runtime environments that specify registers include `mips.twoints`, `mips.array`, etc. Runtime environments must accept executable file paths as command-line arguments, like `mips.twoints executable` rather than `mips.twoints < executable`.
- `tests` is an object keyed with the names of all of the tests to be run on the program. A test has the following keys:
  - `input` is an array of what will be inputted to the program. For `mips.twoints`, it will be an array of two numbers. For `mips.array`, it will be the length of the array followed by its elements. No newline characters are necessary.
  - `expected` is an object keyed with numbers representing the registers to be verified. A test will fail if any of the specified registers' outputs do not match what is in the test case. If a register is not specified in `expected`, its result will not be checked.
  - `error` is a boolean that checks if an error is produced by the MIPS emulator. If it is set to true, an internal error like division by zero will be ignored by the tester.

Example programs and tests are given in the [cs241-regtest repository](https://github.com/eliasawad/cs241-regtest).
