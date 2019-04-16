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

const os = require('os')
const fs = require('fs')
const path = require('path')

// mock dir stuff
let processcwd = process.cwd
let oshomedir = os.homedir

beforeAll(() => {
  os.homedir = () => path.resolve('/Users/foo')
  process.cwd = () => path.resolve('/Project/runtime')
})

afterAll(() => {
  process.cwd = processcwd
  os.homedir = oshomedir
})

const Config = require('../src/Config')

afterEach(() => {
  jest.clearAllMocks()
})

describe('Config', () => {
  test('should export a function', () => {
    expect(typeof Config).toEqual('function')
  })

  test('should return an object', () => {
    let config = new Config()
    expect(config.constructor.name).toEqual('Config')
  })

  test('should initialise values', () => {
    let config = new Config()
    expect(config.values).toEqual({})
    expect(config.global).toEqual({ values: {}, file: path.resolve('/Users/foo/.config/aio') })
    expect(config.local).toEqual({ values: {}, file: path.resolve('/Project/runtime/.aio') })
    expect(config.envs).toEqual({ })
  })

  describe('debug', () => {
    test('should be an empty function', () => {
      let config = new Config()
      expect(typeof config._debugFn).toBe('function')
    })

    test('should be passed in function', () => {
      let debug = () => true
      let config = new Config(debug)
      expect(config._debugFn).toBe(debug)
    })
  })

  describe('load', () => {
    test('should be passed in function', () => {
      let debug = () => true
      let config = new Config(debug)
      expect(config.reload()).toBe(config)
    })
  })

  describe('get', () => {
    test('should be an empty function', () => {
      let config = new Config()
      expect(config.get()).toEqual(config.values)
      expect(config.get('')).toEqual(config.values)
      expect(config.get('    ')).toEqual(config.values)
    })

    test('should return undefined on unknown key', () => {
      let config = new Config()
      expect(config.get('unknown.key')).toEqual(undefined)
    })

    test('should return value at key', () => {
      let config = new Config()
      config.values = { a: { key: 'global1' } }
      expect(config.get('a.key')).toEqual('global1')
    })

    test('should return env value at key', () => {
      let config = new Config()
      config.global.values = { a: { key: 'global2' } }
      expect(config.get('a.key', 'global')).toEqual('global2')
    })

    test('should return local value at key', () => {
      let config = new Config()
      config.local.values = { a: { key: 'local' } }
      expect(config.get('a.key', 'local')).toEqual('local')
    })

    test('should return global value at key', () => {
      let config = new Config()
      config.envs = { a: { key: 'env' } }
      expect(config.get('a.key', 'env')).toEqual('env')
    })
  })

  describe('set', () => {
    let config

    beforeEach(() => {
      config = new Config()
      jest.spyOn(fs, 'writeFileSync')
      config.debug = jest.fn()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    test('should set global value if key empty', () => {
      expect(config.set()).toBe(config)
      expect(config.set('')).toBe(config)
      expect(config.set('    ')).toBe(config)
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.resolve('/Users/foo/.config/aio'), '')
      expect(config.get()).toEqual({})
    })

    test('should save to global file', () => {
      expect(config.set('a.key', 'value1')).toBe(config)
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.resolve('/Users/foo/.config/aio'), 'a:\n  key: value1\n')
      expect(config.get()).toEqual({ a: { key: 'value1' } })
    })

    test('should save to local file', () => {
      expect(config.set('a.key', 'value3', true)).toBe(config)
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.resolve('/Project/runtime/.aio'), 'a:\n  key: value3\n')
      expect(config.get()).toEqual({ a: { key: 'value3' } })
    })

    test('local values should have priority', () => {
      expect(config.set('a.key', 'local', true)).toBe(config)
      expect(config.set('a.key', 'global', false)).toBe(config)
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.resolve('/Project/runtime/.aio'), 'a:\n  key: local\n')
      expect(config.get()).toEqual({ a: { key: 'local' } })
    })
  })

  describe('envs', () => {
    test('should set value from env', () => {
      process.env['AIO_PGB_AUTHTOKEN'] = 12
      let config = new Config()
      expect(config.get().pgb.authtoken).toBe('12')
    })

    test('should override local and global settings', () => {
      let config = new Config()
      expect(config.set('pgb.name', 'local', true)).toBe(config)
      expect(config.set('pgb.name', 'global', false)).toBe(config)
      expect(config.get('pgb.name')).toBe('local')
      process.env['AIO_PGB_NAME'] = 'foobar'
      config.reload()
      expect(config.get('pgb.name')).toBe('foobar')
    })
  })

  describe('debugging', () => {
    test('should not fail on error', () => {
      let config = new Config()
      fs.readFileSync = jest.fn(() => {
        throw new Error('a')
      })
      config.reload()
    })
  })
})
