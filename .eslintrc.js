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
    Data: 'readonly',
    importModule: 'writable',
    log: 'writable',
    args: 'readonly',
    Calendar: 'readonly',
    CalendarEvent: 'readonly',
    DateFormatter: 'readonly',
    Device: 'readonly',
    config: 'readonly',
    Font: 'readonly',
    Image: 'readonly',
    Keychain: 'readonly',
    LinearGradient: 'readonly',
    Notification: 'readonly',
    Point: 'readonly',
    QuickLook: 'readonly',
    Rect: 'readonly',
    Safari: 'readonly',
    Request: 'readonly',
    Script: 'readonly',
    Size: 'readonly',
    Color: 'readonly',
    SFSymbol: 'readonly',
    Timer: 'readonly',
    FileManager: 'readonly',
    Photos: 'readonly',
    DrawContext: 'readonly',
    Alert: 'readonly',
    ListWidget: 'readonly',
    UITable: 'readonly',
    UITableRow: 'readonly',
    WebView: 'readonly',
    require: 'writable'
  },
  rules: {
  }
}
