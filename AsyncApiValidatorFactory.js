const path = require('path')
const utils = require('./utils')
const asyncapi = require('asyncapi')

// Validator
const AsyncApiValidator = require('./AsyncApiValidator')

// Loaders
const HttpLoader = require('./loaders/HttpLoader')
const FsLoader = require('./loaders/FsLoader')

// Parsers
const jsonParser = require('./parsers/jsonParser')
const yamlParser = require('./parsers/yamlParser')
const byPassParser = require('./parsers/byPassParser')

// Resolver
const Resolver = require('./Resolver')

function AsyncApiValidatorFactory() {
  /**
   * @param {string} extension
   * @returns {jsonParser | yamlParser | byPassParser}
   */
  this._getParserFromExtension = (extension) => {
    if (utils.isJson(extension)) {
      return jsonParser
    }

    if (utils.isYaml(extension)) {
      return yamlParser
    }

    return byPassParser
  }

  /**
   * @param {string} source
   * @returns {HttpLoader | FsLoader}
   */
  this._getLoaderFromSource = (source) => {
    if (source.startsWith('http')) {
      return new HttpLoader(source)
    }

    return new FsLoader(source)
  }

  /**
   * @param {string | number} verion
   */
  this._getAsyncApiSchema = (verion) => {
    return asyncapi[verion]
  }

  /**
   * @param {any} refSchema
   * @returns {Resolver}
   */
  this._getResolver = (refSchema) => {
    return new Resolver(refSchema)
  }

  /**
   * @param {string} source
   * @returns {Promise<AsyncApiValidator>}
   */
  this.fromSource = async (source) => {
    const extension = path.extname(source)
    const parser = this._getParserFromExtension(extension)

    const loader = this._getLoaderFromSource(source)
    const rawSchema = await loader.load()

    const schema = parser.parse(rawSchema)

    const resolver = this._getResolver(schema)
    const resolvedSchema = await resolver.resolve()

    const asyncapi = this._getAsyncApiSchema(schema.asyncapi)

    return new AsyncApiValidator(schema, asyncapi, resolvedSchema)
  }
}

module.exports = AsyncApiValidatorFactory