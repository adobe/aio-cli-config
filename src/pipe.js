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

const yaml = require('js-yaml')
const status = Symbol.for(`aio-cli-config.pipe`)

/**
 * get piped data from stdin
 */
module.exports = () => new Promise((resolve) => {
  if (global[status] || process.stdin.isTTY) return resolve(global[status])

  let data = []

  process.stdin.on('data', line => data.push(line.toString()))

  process.stdin.once('end', () => {
    let result = data.join('')
    if (data.length > 0) {
      try {
        result = yaml.safeLoad(result)
      } catch (e) { }
    }
    global[status] = result
    resolve(result)
  })
})
