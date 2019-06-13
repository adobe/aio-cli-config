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
const status = Symbol.for(`aio-cli-config.dotenv`)
const debug = require('debug')('aio-cli-config')

/**
 * parse file for environmental variables
 *
 * @param {String} file filepath to parse
 */
const parse = (file) => {
  const SINGLE_QUOTE_RE = new RegExp(/^\s*(.*)=\s*'((''|[^'])*)'/, 'gm')
  const DOUBLE_QUOTE_RE = new RegExp(/^\s*(.*)=\s*"((""|[^"])*)"/, 'gm')
  const NO_QUOTE_RE = new RegExp(/^\s*(.*)=\s*([^'"].*)$/, 'gm')

  let result = {}
  let matches

  const str = fs.readFileSync(file, 'utf-8')

  while ((matches = SINGLE_QUOTE_RE.exec(str))) {
    result[matches[1]] = matches[2].replace(/''/g, "'")
  }

  while ((matches = DOUBLE_QUOTE_RE.exec(str))) {
    result[matches[1]] = matches[2].replace(/""/g, '"')
  }

  while ((matches = NO_QUOTE_RE.exec(str))) {
    result[matches[1]] = matches[2].replace(/ #.*$/, '').trim()
  }

  return result
}

/**
 * returns all keys in o1 that arent in o2
 *
 * @param {Object} o1
 * @param {Object} o2
 *
 * @return {Array} array of keys
 */
const diff = (o1, o2) => Object.keys(o1).filter(k => !(k in o2))

/**
 * hoists variables in the ./.env file to process.env
 *
 * @param {Function} debug optional function for debugging
 *
 */
module.exports = function() {
  const file = path.join(process.cwd(), '.env')

  if (global[status] !== file) {
    try {
      const envs = parse(file)
      const newKeys = diff(envs, process.env).sort()

      debug(`loading environment variables from ${file}`)

      if (newKeys.length > 0) {
        process.env = { ...envs, ...process.env }
        debug(`added environment variables: ${newKeys.join(', ')}`)
      }
    } catch (ex) {
      if (ex.code !== 'ENOENT') {
        debug(`cannot read environment variables from ${file}`)
        debug(` - ${ex}`)
        debug('skipping ...')
      }
    }
  }
  global[status] = file
}
