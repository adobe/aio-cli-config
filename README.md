<!--
Copyright 2018 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
-->

# DEPRECATED, go to [https://github.com/adobe/aio-cna-core-config](https://github.com/adobe/aio-cna-core-config)

aio-cli-config
=======================

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@adobe/aio-cli-config.svg)](https://npmjs.org/package/@adobe/aio-cli-config)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/aio-cli-config.svg)](https://npmjs.org/package/@adobe/aio-cli-config)
[![Build Status](https://travis-ci.com/adobe/aio-cli-config.svg?branch=master)](https://travis-ci.com/adobe/aio-cli-config)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) [![Greenkeeper badge](https://badges.greenkeeper.io/adobe/aio-cli-plugin-pgb.svg)](https://greenkeeper.io/)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/adobe/aio-cli-config/master.svg?style=flat-square)](https://codecov.io/gh/adobe/aio-cli-config/)

This is a nodejs module to allow management of persistant and environment variable configuration by aio-cli plugins.

The module can be added to your project with:

```javascript
> yarn add aio-cli-config

or

> npm install aio-cli-config --save
```

Here is a snippet:

```javascript
const config = require('aio-cli-config')

// set a key value
config.set('pgb.authtoken', 1234)

// reload data from files and environmental variables
config.reload()

// get all stored data
config.get()

// get data from a given key
config.get('pgb.authtoken')

// delete a key
config.delete('pgb.authtoken')
```

## Peristent File Locations

### User Configuration

The user default location is: 

1. **ENV['AIO_CONFIG_FILE']**
1. **ENV['XDG_CONFIG_HOME']/aio**
1. **\<HOME>/.config/aio**

depending on whether the specified environmental variables exist

### Project Configuration

Local configuration is loaded from **$PWD/.aio**

### Dot Env Configuration

A local .env file is also loaded.  This file can contain environmental variables

## Resolving Values

Resolving configuration is done in two steps:

1. .env file is read, parsed and hoisted to environment variables ( process.env )
2. user and local files are read

Inheritance is similar to NPMRC and can be set using user file, project file and matching environment variables. Values are read and merged in the following order in increasing priority:

1. user config eg. ~/.config/aio
2. project config eg. $PWD/.aio
3. environment variables matching AIO_\<PLUGIN>_\<KEY> 

```bash
$ AIO_PGB_AUTHTOKEN=1234 node
> config.get('pgb.authtoken')
1234

$ AIO_PGB_AUTH__TOKEN=1234 node # use double underscores to specify an underscore
> config.get('pgb.auth_token')
1234
```

## Contributing
Contributions are welcomed! Read the [Contributing Guide](CONTRIBUTING.md) for more information.
 
## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
