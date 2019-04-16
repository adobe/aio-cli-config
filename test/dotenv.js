/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const dotenv = require('../src/dotenv')
const fs = require('fs')
const path = require('path')
const debug = jest.fn()
const status = Symbol.for('aio-cli-config.dotenv')
let processenv, processcwd

beforeAll(() => {
  fs.mkdirSync('/project/')
})

beforeEach(() => {
  processenv = process.env
  processcwd = process.cwd
  process.cwd = () => '/project'
})

afterEach(() => {
  jest.clearAllMocks()
  process.env = processenv
  process.cwd = processcwd
  global[status] = undefined
})

test('is a function', () => expect(dotenv).toBeInstanceOf(Function))

test('if file doesnt exist no change to process.env', () => {
  dotenv(debug)
  expect(process.env).toEqual(processenv)
  expect(debug).toHaveBeenLastCalledWith('.env file not found, skipping ...')
  expect(global[status]).toEqual(true)
})

test('should use debug if function is bound', () => {
  const fn = jest.fn()
  const obj = { debug: fn }
  dotenv.bind(obj)()
  expect(process.env).toEqual(processenv)
  expect(fn).toHaveBeenLastCalledWith('.env file not found, skipping ...')
})

test('should not fail if debug not specified', () => {
  dotenv()
  expect(process.env).toEqual(processenv)
})

test('should prefer the argument', () => {
  const fn = jest.fn()
  const obj = { debug: fn }
  dotenv.bind(obj)(debug)
  expect(process.env).toEqual(processenv)
  expect(fn).not.toHaveBeenCalled()
  expect(debug).toHaveBeenLastCalledWith('.env file not found, skipping ...')
})

test('should set global symbol', () => {
  global[status] = true
  dotenv(debug)
  expect(global[status]).toEqual(true)
})

test('shouldnt do anything if global symbol is present', () => {
  global[status] = true
  dotenv(debug)
  expect(process.env).toEqual(processenv)
  expect(debug).not.toHaveBeenCalled()
})

describe(('error handling'), () => {
  beforeEach(() => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => { throw new Error('an error') })
  })

  afterEach(() => {
    fs.readFileSync.mockRestore()
  })

  test('should not fail on read error', () => {
    fs.writeFileSync('/project/.env', fixtureFile('empty'))
    dotenv(debug)
    expect(debug).toHaveBeenNthCalledWith(1, `cannot read environment variables from ${path.join(process.cwd(), '.env')}`)
    expect(debug).toHaveBeenNthCalledWith(2, ' - Error: an error')
    expect(debug).toHaveBeenLastCalledWith('skipping ...')
  })
})

describe('parse', () => {
  afterEach(() => {
    fs.unlinkSync('/project/.env')
  })

  test('empty', () => {
    fs.writeFileSync('/project/.env', fixtureFile('empty'))
    dotenv(debug)
    expect(process.env).toEqual(processenv)
    expect(debug).toHaveBeenLastCalledWith('no environment variables added')
  })

  test('comment', () => {
    fs.writeFileSync('/project/.env', fixtureFile('comment'))
    dotenv(debug)
    expect(process.env).toEqual({ ...{ A: '#comment', B: '1', C: '12\n' }, ...processenv })
    expect(debug).toHaveBeenLastCalledWith('added environment variables: A, B, C')
  })

  test('multiline', () => {
    fs.writeFileSync('/project/.env', fixtureFile('multiline'))
    dotenv(debug)
    expect(process.env).toEqual({ ...{ A: '\n12', B: '\n12', C: '1' }, ...processenv })
    expect(debug).toHaveBeenLastCalledWith('added environment variables: A, B, C')
  })

  test('quotes', () => {
    fs.writeFileSync('/project/.env', fixtureFile('quotes'))
    dotenv(debug)
    expect(process.env).toEqual({ ...{ A: "   12'  \n", B: '   12" \n', C: '  12  ' }, ...processenv })
    expect(debug).toHaveBeenLastCalledWith('added environment variables: A, B, C')
  })

  test('single', () => {
    fs.writeFileSync('/project/.env', fixtureFile('single'))
    dotenv(debug)
    expect(process.env).toEqual({ ...{ A: '12', B: '12', C: '12' }, ...processenv })
    expect(debug).toHaveBeenLastCalledWith('added environment variables: A, B, C')
  })
})

test('should not overwrite process.env values', () => {
  process.env['A'] = 12
  fs.writeFileSync('/project/.env', 'A=1')
  dotenv(debug)
  expect(process.env['A']).toEqual('12')
  expect(debug).toHaveBeenLastCalledWith('no environment variables added')
})
