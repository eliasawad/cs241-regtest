#!/usr/bin/env node
const commander = require('commander')
const cp = require('child_process')
const fs = require('fs')
const ls = require('log-symbols')
const package = require('./package.json')
const path = require('path')

const printTestSuccess = name => {
  console.log(ls.success, ` ${name}`)
}

const printRuntimeError = (name, err) => {
  console.log(ls.error, ` ${name}`)
  console.group()
  console.log(err)
  console.groupEnd()
}

const printTestFailure = (name, reg, expectedVal, actualVal) => {
  console.log(ls.error, ` ${name}`)
  console.group()
  console.log(`Expected: $${reg} = ${expectedVal}`)
  console.log(`Actual: $${reg} = ${actualVal}`)
  console.groupEnd()
}

const execTestProcess = (name, test, command) => new Promise((resolve, reject) => {
  const { input, expected, error } = test
  cp.exec(command, (err, stdout, stderr) => {
    // Check for error string:
    // MIPS emulator internal error.
    // [error message]
    const mipserror = stderr.match(/MIPS emulator internal error\.\n.*/g)
    if (!error && mipserror) {
      printRuntimeError(name, mipserror[0])
      return reject()
    }

    // Expects output including hexadecimal strings for each register (see README)
    const actual = stderr.match(/0x[0-9a-f]{8}/g).map(hex => parseInt(hex, 16))

    // Check each register specified in test case for discrepancies
    for (reg in expected) {
      const actualVal = actual[reg - 1]
      const expectedVal = expected[reg]
      if (actualVal !== expectedVal) {
        printTestFailure(name, reg, expectedVal, actualVal)
        return reject()
      }
    }

    // If all specified registers match, the test passes
    printTestSuccess(name)
    resolve()
  }).stdin.end(input.join('\n'))
})

const runTests = (source, testFile) => {
  // Read the test suite
  try {
    var testSuite = JSON.parse(fs.readFileSync(testFile))
  } catch (e) {
    return Promise.reject(e.message)
  }

  const { preprocessor, runtime, tests } = testSuite

  // Check for some errors
  if (!runtime || typeof runtime !== 'string') {
    return Promise.reject('A runtime environment string, like "mips.twoints", is required')
  }

  if (typeof tests !== 'object' || Object.keys(tests).length === 0) {
    console.log('No tests to run')
    return Promise.resolve()
  }

  // Generate executable, if needed
  let executable
  if (preprocessor) {
    const sourcePath = path.parse(source)
    if ('destination' in testSuite) {
      executable = testSuite.destination
    } else {
      executable = path.join(sourcePath.dir, sourcePath.name)
    }

    try {
      const input = fs.readFileSync(source)
      const stdout = cp.execSync(preprocessor, { input })
      fs.writeFileSync(executable, stdout)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  // Run tests with given inputs
  let processes = Object.keys(tests)
  const command = `${runtime} ${executable}`

  return Promise.allSettled(
    processes.map(name =>
      execTestProcess(name, tests[name], command)))
}

commander
  .description(package.description)
  .version(package.version)

commander
  .command('test <program> <testFile>', { isDefault: true })
  .description('Test your program against the supplied test suite')
  .action((program, testFile) =>
    runTests(program, testFile)
    .catch(msg => {
      console.error(`${msg}`)
      process.exitCode = 1
    }))

commander.parse(process.argv)
