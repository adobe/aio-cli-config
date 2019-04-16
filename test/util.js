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

const { mkdirp, merge, getValue, setValue, loadYaml, saveYaml } = require('../src/util')
const path = require('path')
jest.mock('jest-plugin-fs/mock')
const fs = require('fs')

afterEach(() => {
  jest.clearAllMocks()
})

describe('loadYaml', () => {
  test('is a function', () => {
    expect(loadYaml).toBeInstanceOf(Function)
  })

  test('should return yaml parsed output', () => {
    fs.existsSync.mockImplementationOnce(() => true)
    fs.readFileSync.mockImplementationOnce(() => { return 'a: 12' })
    expect(loadYaml('/file.yaml')).toEqual({ a: 12 })
    expect(fs.readFileSync).toHaveBeenLastCalledWith('/file.yaml', 'utf-8')
  })

  test('should return {} if yaml parsing returns null', () => {
    fs.existsSync.mockImplementationOnce(() => true)
    fs.readFileSync.mockImplementationOnce(() => { return '' })
    expect(loadYaml('/notfound')).toEqual({})
  })
})

describe('saveYaml', () => {
  test('is a function', () => {
    expect(saveYaml).toBeInstanceOf(Function)
  })

  test('should default to empty object if null / undefined', () => {
    fs.writeFileSync.mockImplementationOnce(() => true)
    saveYaml('/a/b/c/file.yaml', null)
    expect(fs.writeFileSync).toHaveBeenLastCalledWith('/a/b/c/file.yaml', '')
  })

  test('should default to empty object if empty', () => {
    fs.writeFileSync.mockImplementationOnce(() => true)
    saveYaml('/a/b/c/file.yaml', {})
    expect(fs.writeFileSync).toHaveBeenLastCalledWith('/a/b/c/file.yaml', '')
  })

  test('should save yaml stringified output', () => {
    fs.writeFileSync.mockImplementationOnce(() => true)
    saveYaml('/a/b/c/file.yaml', { a: 12 })
    expect(fs.writeFileSync).toHaveBeenLastCalledWith('/a/b/c/file.yaml', 'a: 12\n')
  })

  test('should remove leaves', () => {
    fs.writeFileSync.mockImplementationOnce(() => true)
    saveYaml('/a/b/c/file.yaml', { a: 12, b: { c: { }, d: 1 } })
    expect(fs.writeFileSync).toHaveBeenLastCalledWith('/a/b/c/file.yaml', 'a: 12\nb:\n  d: 1\n')
  })

  test('should remove null and empty leaves', () => {
    fs.writeFileSync.mockImplementationOnce(() => true)
    saveYaml('/a/b/c/file.yaml', { a: 12, b: { c: { }, d: null } })
    expect(fs.writeFileSync).toHaveBeenLastCalledWith('/a/b/c/file.yaml', 'a: 12\n')
  })
})

describe('getValue', () => {
  test('is a function', () => {
    expect(getValue).toBeInstanceOf(Function)
  })

  test('handles undefined values', () => {
    expect(getValue()).toBeUndefined()
    expect(getValue({ a: 12 })).toEqual({ a: 12 })
    expect(getValue(undefined, { a: 12 })).toEqual(undefined)
    expect(getValue(undefined, 'a')).toBeUndefined()
  })

  test('returns entire value if object', () => {
    const obj = { a: { b: 1, d: { e: 12 } } }
    expect(getValue(obj, 'a', obj)).toEqual({ b: 1, d: { e: 12 } })
  })

  test('returns single value if found', () => {
    const obj = { a: { b: 1, d: { e: 12 } } }
    expect(getValue(obj, 'a.d.e')).toEqual(12)
  })

  test('returns undefined if not found', () => {
    expect(getValue({ }, 'a.b.c.d.e')).toBeUndefined()
  })
})

describe('setValue', () => {
  test('is a function', () => {
    expect(setValue).toBeInstanceOf(Function)
  })

  test('handles undefined values', () => {
    expect(setValue('a')).toEqual({ a: undefined })
    expect(setValue()).toBeUndefined()
    expect(setValue(undefined, { a: 12 })).toEqual({ a: 12 })
  })

  test('creates object if it doesnt exist', () => {
    expect(setValue('a.b.c', 12)).toEqual({ a: { b: { c: 12 } } })
  })

  test('merges object if exists', () => {
    const obj = { a: { b: 1, d: { e: 12 } } }
    expect(setValue('a.foo', 12, obj)).toEqual({ a: { foo: 12, b: 1, d: { e: 12 } } })
  })

  test('creates object if it doesnt exist in passed in object', () => {
    const obj = { a: { b: 1, d: { e: 12 } } }
    expect(setValue('a.d.foo', { bar: 1 }, obj)).toEqual({ 'a': { 'b': 1, 'd': { 'e': 12, 'foo': { 'bar': 1 } } } })
  })

  test('replaces object if its in the way', () => {
    const obj = { a: { b: 1, d: { e: 12 } } }
    expect(setValue('a.d', 12, obj)).toEqual({ 'a': { b: 1, 'd': 12 } })
  })
})

describe('merge', () => {
  test('is a function that returns an object', () => {
    expect(merge).toBeInstanceOf(Function)
    expect(merge()).toEqual({})
  })

  test('handles null values', () => {
    expect(merge(null)).toEqual({})
    expect(merge(null, null)).toEqual({})
    expect(merge(null, { a: true }, null)).toEqual({ a: true })
  })

  test('returns a clone of all objects', () => {
    const obj = { a: true }
    expect(merge(obj) === obj).toBeFalsy()
  })

  test('last one wins', () => {
    expect(merge({ a: 1 }, { a: 2 }, { a: 3 })).toEqual({ a: 3 })
  })

  test('replaces arrays', () => {
    expect(merge({ a: [] }, {})).toEqual({ a: [] })
    expect(merge({ a: [2] }, { a: [1] })).toEqual({ a: [1] })
  })

  test('does nested merging', () => {
    expect(merge({ a: { c: [], b: 1 } }, { a: { b: 2 } }, { a: { c: 3 } })).toEqual({ a: { b: 2, c: 3 } })
  })
})

describe('mkdirp', () => {
  test('is a function that returns an object', () => {
    expect(mkdirp).toBeInstanceOf(Function)
  })

  test('handles null (current dir)', () => {
    fs.existsSync.mockReturnValue(true)
    mkdirp(null)
    expect(fs.mkdirSync).not.toHaveBeenCalled()
    expect(fs.existsSync).toHaveBeenLastCalledWith(process.cwd() + path.sep)
  })

  test('handles blank (current dir)', () => {
    fs.existsSync.mockReturnValue(true)
    mkdirp('')
    expect(fs.mkdirSync).not.toHaveBeenCalled()
    expect(fs.existsSync).toHaveBeenLastCalledWith(process.cwd() + path.sep)
  })

  test('only creates dir if not already created', () => {
    fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false)
    mkdirp('/foo/bar')
    expect(fs.mkdirSync.mock.calls).toEqual([[path.resolve('/foo/bar') + path.sep]])
    expect(fs.existsSync).toHaveBeenLastCalledWith(path.resolve('/foo/bar') + path.sep)
  })
})
