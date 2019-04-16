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

const path = require('path')
const os = require('os')
const dotenv = require('./dotenv')
const { merge, loadYaml, saveYaml, getValue, setValue } = require('./util')

/**
 * read a file and log exceptions to debug
 *
 * @param {String} file
 * @param {Function} debugFn
 */
const readFile = (file, debugFn) => {
  let result = {}
  try {
    result = loadYaml(file)
    debugFn(`reading config: ${file}`)
  } catch (ex) {
    if (ex.code !== 'ENOENT') {
      debugFn(ex.toString())
      debugFn('skipping ...')
    }
  }
  return result
}

class Config {
  constructor(debugFn) {
    this._debugFn = (debugFn && debugFn.debug) || debugFn || (() => true)
    this.envs = {}

    const configBasePath = process.env['XDG_CONFIG_HOME'] || path.join(os.homedir(), '.config')
    this.global = { file: process.env['AIO_CONFIG_FILE'] || path.join(configBasePath, 'aio') }
    this.local = { file: path.join(process.cwd(), '.aio') }

    this.reload()
  }

  reload() {
    dotenv(this._debugFn)

    this.global.values = Object.freeze(readFile(this.global.file, this._debugFn))
    this.local.values = Object.freeze(readFile(this.local.file, this._debugFn))

    this.envs = {}

    let envKeys = []
    for (let key in process.env) {
      let match = key.match(/AIO_([^_]*)_(.*)/i)
      if (match) {
        let newKey = `${match[1].toLowerCase()}.${match[2].toLowerCase()}`
        envKeys.push(newKey)
        this.envs = setValue(newKey, process.env[key], this.envs)
      }
    }

    if (envKeys.length > 0) {
      this._debugFn(`reading env variables: ${envKeys.join(', ')}`)
    }

    this.values = merge(this.global.values, this.local.values, this.envs)

    this._debugFn('AIO CLI CONFIGURATION -----------------------------------------')
    this._debugFn(JSON.stringify(this.values, null, 2))
    this._debugFn('---------------------------------------------------------------')

    return this
  }

  get(key = '', source) {
    let vals = this.values

    if (source === 'global') vals = this.global.values
    else if (source === 'local') vals = this.local.values
    else if (source === 'env') vals = this.envs

    let value = getValue(vals, key)
    if (value == null) return value
    return JSON.parse(JSON.stringify(value))
  }

  set(key, value, local = false) {
    let toSave = setValue(key, value, (local) ? this.local.values : this.global.values)
    let file = (local) ? this.local.file : this.global.file

    this._debugFn(`writing config: ${file}`)

    saveYaml(file, toSave)
    return this.reload()
  }
}

module.exports = Config
