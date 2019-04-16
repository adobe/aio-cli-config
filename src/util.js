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

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

/**
 * support for mkdir -p.
 *
 * @param {String} dir
 */
const mkdirp = dir => {
  dir = dir || ''
  let parts = path.resolve(dir).split(path.sep)
  for (let i = 1; i < parts.length; i++) {
    let segment = path.join(parts.slice(0, i + 1).join(path.sep) + path.sep)
    if (!fs.existsSync(segment)) fs.mkdirSync(segment)
  }
}

/**
 * get property from object with case insensitivity.
 *
 * @param {Object} obj
 * @param {String} key
 */
let getProp = (obj, key) => obj[Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase())]

/**
 * get a value in an object by dot notation.
 *
 * @param {String} key
 * @param {Object} obj
 *
 * @return {Object}
 */
let getValue = (obj, key) => {
  let keys = (key || '').toString().split('.')
  return keys.filter(o => o.trim()).reduce((o, i) => o && getProp(o, i), obj)
}

/**
 *
*/
/**
 * set a value by dot notation.
 *
 * @param {String} key
 * @param {String} value
 * @param {Object} [obj]
 *
 * @return {Object}
 */
let setValue = (key, value, obj) => {
  let parts = (key || '').split('.').filter(o => o.trim())
  if (parts.length === 0) return value

  let result = { ...obj }
  let node = result
  while (parts.length > 1) {
    let k = parts.shift()
    node[k] = (typeof node[k] === 'object') ? { ...node[k] } : {}
    node = node[k]
  }
  node[parts.shift()] = value
  return result
}

/**
 * deep merge a collection of objs returning a new object.
 *
 * @param  {...objs} objs
 *
 * @return {Object}
 */
const merge = (...objs) => {
  const clone = (source, dest) => {
    for (let prop in source) {
      if (source[prop] && source[prop].constructor === Object) {
        dest[prop] = clone(source[prop], dest[prop] || {})
      } else {
        dest[prop] = source[prop]
      }
    }
    return dest
  }

  return Array.from(objs).reduce((result, obj) => clone(obj, result), {})
}

/**
 * remove empty leaves from an object.
 *
 * @param {Object} obj
 *
 * @return {Object}
 */
const shake = obj => {
  const shakeObject = o => {
    for (let prop in o) {
      if (o[prop] && o[prop].constructor === Object) {
        o[prop] = shakeObject(o[prop])
        if (Object.keys(o[prop]).length === 0) {
          delete o[prop]
        }
      } else if (o[prop] == null) {
        delete o[prop]
      }
    }
    return o
  }

  return shakeObject(obj)
}

/**
 * yaml deserialise from a file.
 *
 * @param {String} file
 *
 * @return {Object}
 */
const loadYaml = (file) => {
  return yaml.safeLoad(fs.readFileSync(file, 'utf-8'), { json: true }) || {}
}

/**
 * yaml serialise an object to a file.
 *
 * @param {String} file
 * @param {Object} obj
 */
const saveYaml = (file, obj) => {
  obj = obj || {}
  mkdirp(path.dirname(file))

  obj = shake(obj)

  // if empty object just save empty string
  let str = yaml.safeDump(obj, { sortKeys: true, lineWidth: 1024, noCompatMode: true })
  if (Object.keys(obj).length === 0) str = ''

  fs.writeFileSync(file, str)
  return true
}

module.exports = { mkdirp, getValue, setValue, merge, loadYaml, saveYaml }
