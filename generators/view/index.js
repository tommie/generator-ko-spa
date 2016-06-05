'use strict'

const _ = require('lodash')
const co = require('co')
const ast = require('ast-query')
const { Base } = require('yeoman-generator')
const codegenOpts = require('../../utils/codegen-options')

const USE_REQUIRE_SYNTAX = 'USE_REQUIRE_SYNTAX'
const TEST_FRAMEWORK = 'TEST_FRAMEWORK'

class Generator extends Base {
  constructor() {
    super(...arguments)

    this.argument('name', { required: false })
    this.argument('route', { required: false })
    this.option('template-only')
  }

  prompting() {
    const done = this.async()

    co(function* () {
      if (!this.name) {
        this.name = yield this._p({
          type: 'input',
          name: 'name',
          message: 'name:'
        })
      }

      if (!this.route) {
        this.route = yield this._p({
          type: 'input',
          name: 'route',
          message: 'route:'
        })
      }
    }.bind(this)).then(done)
  }

  writing() {
    const dir = `web_modules/views/${this.name}`
    const name = this.name
    const capitalizedName = (() => name[0].toUpperCase() + name.substring(1))()
    const routesFile = this.destinationPath('routes.js')
    const routesFileAst = ast(this.fs.read(routesFile), codegenOpts)

    routesFileAst
      .assignment('module.exports').value()
        .key(`'${this.route}'`).value(`'${this.name}'`)
    this.fs.write(routesFile, routesFileAst.toString())

    this.fs.copyTpl(
      this.templatePath('index.js'),
      this.destinationPath(`${dir}/index.js`),
      {
        USE_REQUIRE_SYNTAX: this.config.get(USE_REQUIRE_SYNTAX),
        TEMPLATE_ONLY: this.options['template-only'],
        VIEW_NAME: name,
        _makeImport: this._makeImport.bind(this)
      }
    )

    this.fs.copyTpl(
      this.templatePath('view.html'),
      this.destinationPath(`${dir}/${name}.html`),
      {
        ROUTE: this.route
      }
    )

    if (this.options['template-only'] !== true) {
      this.fs.copyTpl(
        this.templatePath('view.js'),
        this.destinationPath(`${dir}/${name}.js`),
        {
          USE_REQUIRE_SYNTAX: this.config.get(USE_REQUIRE_SYNTAX),
          CAPITALIZED_VIEW_NAME: capitalizedName
        }
      )

      if (this.config.get(TEST_FRAMEWORK) !== 'none') {
        this.fs.copyTpl(
          this.templatePath('view.test.js'),
          this.destinationPath(`${dir}/${name}.test.js`),
          {
            USE_REQUIRE_SYNTAX: this.config.get(USE_REQUIRE_SYNTAX),
            TEST_FRAMEWORK: this.config.get(TEST_FRAMEWORK),
            VIEW_NAME: name,
            ROUTE: this.route,
            _getTestEnvImport: this._getTestEnvImport.bind(this),
            _makeImport: this._makeImport.bind(this)
          }
        )
      }
    }
  }

  _p(o) { return new Promise((r) => this.prompt(o, (a) => r(a[o.name]))) }

  _getTestEnvImport() {
    switch (this.config.get(TEST_FRAMEWORK)) {
      case 'mocha':
        return this._makeImport(['expect'], 'chai')
      case 'tape':
        return this._makeImport('test', 'tape')
    }
  }

  _makeImport(assignee, source) {
    const useRequire = this.config.get(USE_REQUIRE_SYNTAX)
    let importString = ''


    if (assignee) {
      importString += useRequire ? 'const ' : 'import '
      if (_.isArray(assignee)) {
        importString += '{ '
        importString += assignee.join(', ')
        importString += ' }'
      } else {
        importString += assignee
      }
      importString += useRequire ? ' = ' : ' from '
    }

    importString += useRequire ? `require('${source}')` : `'${source}'`

    return importString
  }
}

module.exports = Generator
