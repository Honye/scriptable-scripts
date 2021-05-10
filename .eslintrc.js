module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: [
    'standard'
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    babelOptions: {
      configFile: './babel.config.js'
    }
  },
  ignorePatterns: ['dist/'],
  globals: {
    importModule: 'writable',
    log: 'writable',
    args: 'readonly',
    DateFormatter: 'readonly',
    Device: 'readonly',
    config: 'readonly',
    Font: 'readonly',
    Image: 'readonly',
    Keychain: 'readonly',
    Notification: 'readonly',
    Point: 'readonly',
    QuickLook: 'readonly',
    Rect: 'readonly',
    Request: 'readonly',
    Script: 'readonly',
    Size: 'readonly',
    Color: 'readonly',
    SFSymbol: 'readonly',
    FileManager: 'readonly',
    Photos: 'readonly',
    DrawContext: 'readonly',
    Alert: 'readonly',
    ListWidget: 'readonly',
    UITable: 'readonly',
    UITableRow: 'readonly'
  },
  rules: {
  }
}
