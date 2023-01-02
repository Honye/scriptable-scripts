// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: magic;
/**
 * @file API 链式调用无变量命名烦恼
 * @version 1.0.0
 * @author Honye
 */

/**
 * @example
 * ```
 * proxy.call(this)
 * ```
 */
function proxy () {
  this.ListWidget = new Proxy(ListWidget, {
    construct (Target, args) {
      const widget = new Target(...args)

      /**
       * @template {extends Record<string, any>} T
       * @param {T} target
       * @param {string[]} props
       */
      const makeSetter = (target, props) => {
        const properties = props.reduce((res, item) => {
          res[`set${item[0].toUpperCase()}${item.substring(1)}`] = {
            value (value) {
              this[item] = value
              return this
            }
          }
          return res
        }, {})
        Object.defineProperties(target, properties)
        Object.defineProperties(target, {
          next: {
            value (callback) {
              const context = this
              callback(context)
              return this
            }
          }
        })
      }

      /**
       * 使无返回的函数返回 this 以支持链式调用
       * @param {string[]} props 函数名列表
       */
      const proxyFn = (target, props) => {
        for (const name of props) {
          target[name] = new Proxy(target[name], {
            apply (target, self, args) {
              target.apply(self, args)
              return self
            }
          })
        }
      }

      makeSetter(widget, [
        'backgroundColor',
        'backgroundImage',
        'backgroundGradient',
        'spacing',
        'url',
        'refreshAfterDate'
      ])
      proxyFn(widget, [
        'setPadding',
        'useDefaultPadding'
      ])

      const addDateHandler = {
        apply (target, self, args) {
          const result = target.apply(self, args)
          makeSetter(result, [
            'date',
            'textColor',
            'font',
            'textOpacity',
            'lineLimit',
            'minimumScaleFactor',
            'shadowColor',
            'shadowRadius',
            'shadowOffset',
            'url'
          ])
          proxyFn(result, [
            'leftAlignText',
            'centerAlignText',
            'rightAlignText',
            'applyTimeStyle',
            'applyDateStyle',
            'applyRelativeStyle',
            'applyOffsetStyle',
            'applyTimerStyle'
          ])
          return result
        }
      }
      /** @type {ProxyHandler<Function>} */
      const addImageHandler = {
        apply (target, self, args) {
          const result = target.apply(self, args)
          makeSetter(result, [
            'image',
            'resizable',
            'imageSize',
            'imageOpacity',
            'cornerRadius',
            'borderWidth',
            'borderColor',
            'containerRelativeShape',
            'tintColor',
            'url'
          ])
          proxyFn(result, [
            'leftAlignImage',
            'centerAlignImage',
            'rightAlignImage',
            'applyFittingContentMode',
            'applyFillingContentMode'
          ])
          return result
        }
      }
      const addTextHandler = {
        apply (target, self, args) {
          const result = target.apply(self, args)
          makeSetter(result, [
            'text',
            'textColor',
            'font',
            'textOpacity',
            'lineLimit',
            'minimumScaleFactor',
            'shadowColor',
            'shadowRadius',
            'shadowOffset',
            'url'
          ])
          proxyFn(result, [
            'leftAlignText',
            'centerAlignText',
            'rightAlignText'
          ])
          return result
        }
      }
      const addStackHandler = {
        apply (target, self, args) {
          const stack = target.apply(self, args)
          makeSetter(stack, [
            'backgroundColor',
            'backgroundImage',
            'backgroundGradient',
            'spacing',
            'size',
            'cornerRadius',
            'borderWidth',
            'borderColor',
            'url'
          ])
          proxyFn(stack, [
            'setPadding',
            'useDefaultPadding',
            'topAlignContent',
            'centerAlignContent',
            'bottomAlignContent',
            'layoutHorizontally',
            'layoutVertically'
          ])
          stack.addDate = new Proxy(stack.addDate, addDateHandler)
          stack.addImage = new Proxy(stack.addImage, addImageHandler)
          stack.addStack = new Proxy(stack.addStack, addStackHandler)
          stack.addText = new Proxy(stack.addText, addTextHandler)
          return stack
        }
      }

      widget.addDate = new Proxy(widget.addDate, addDateHandler)
      widget.addImage = new Proxy(widget.addImage, addImageHandler)
      widget.addStack = new Proxy(widget.addStack, addStackHandler)
      widget.addText = new Proxy(widget.addText, addTextHandler)
      return widget
    }
  })
  return this
}

module.exports = {
  proxy
}
