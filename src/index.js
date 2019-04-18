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

const Config = require('./Config')
const pipe = require('./pipe')
const dotenv = require('./dotenv')

module.exports = {
  load: (debugFn) => {
    return (() => {
      const config = new Config(debugFn)

      this.get = (key) => config.get(key)
      this.set = (key, value) => config.set(key, value) && this
      this.delete = (key) => config.set(key) && this
      this.reload = () => config.reload() && this
      return this
    })()
  },
  getPipedData: pipe,
  dotenv
}
