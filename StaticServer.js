const http = require("http")
const https = require("https")
const fs = require("fs")
const path = require("path")
const EventEmitter = require("events")
const { URL } = require("url")
const mimeTypes = require("./mime-types")

/**
 * Статический сревер
 */
class StaticServer extends EventEmitter {  
  // Доступные протоколы
  static PROTOCOL_HTTP = "http"
  static PROTOCOL_HTTPS = "https"

  // Значения по умолчанию
  static DEFAULT_HOST = "127.0.0.1"
  static DEFAULT_PORT = 3030
  static DEFAULT_CONTENT_TYPE = "text/plain"
  static DEFAULT_INDEX_FILE = "index.html"
  static DEFAULT_NOT_FOUND_MESSAGE = "Page Not Found"

  // Разделить между имени файла и его расширением 
  static EXTENSION_SEPARATOR = "."

  // Коды статусов ответа от сервера
  static STATUS_CODE_OK = 200
  static STATUS_CODE_NOT_FOUND = 404

  /**
   * Инициализировать сервер
   * @param {Object} config конфигурация 
   */
  constructor(config) {
    super()

    // Проверить на корректность переданного протокола
    if (config.protocol && [PROTOCOL_HTTP, PROTOCOL_HTTPS].includes(config.protocol)) {
      throw "Необходимо указать поддерживаемый протокол HTTP или HTTPS"
    }
    // Проверить на доступность корневой директории
    if (!config.rootDir) {
      throw "Необходимо указать параметр конфигурации rootDir"
    }

    this.config = config || {}
    this.server = http.createServer(this.handler.bind(this))
  }

  /**
   * Протокол соединения
   * @return {String}
   */
  get protocol() {
    return this.config.protocol || StaticServer.PROTOCOL_HTTP
  }

  /**
   * Хост соединения
   * @return {String}
   */
  get host() {
    return this.config.host || StaticServer.DEFAULT_HOST
  }

  /**
   * Порт соединения
   * @return {Number}
   */
  get port() {
    return this.config.port || StaticServer.DEFAULT_PORT
  }

  /**
   * Базовый URL адрес сервера
   * @return {String}
   */
  get origin() {
    return `${this.protocol}://${this.host}:${this.port}`
  }

  /**
   * Индоксный файл
   * @return {String}
   */
  get indexFile() {
    return this.config.indexFile || StaticServer.DEFAULT_INDEX_FILE
  }
  
  /**
   * Файл показываемый в случае 404 ошибки
   * @return {String|null}
   */
  get notFoundFile() {
    return this.config.notFoundFile || null
  }

  /**
   * Корневая директория со статическими файлами
   * @return {String}
   */
  get rootDir() {
    return this.config.rootDir || ""
  }

  /**
   * MIME-типы разширений
   * @return {Object}
   */
  get mimeTypes() {
    const externalTypes = this.config.mimeTypes || {}

    return { ...mimeTypes, ...externalTypes }
  }

  /**
   * Драйвер для установки соединения
   * @return {Object}
   */
  get driver() {
    return this.protocol === StaticServer.PROTOCOL_HTTPS ? https : http
  }

  /**
   * Запустить сервер
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, error => {
        if (error) {
          reject(error)
        }

        console.log(`Сервер запущен на ${this.origin}`)
        resolve(this.origin)
      })
    })
  }

  /**
   * Остановить сервер
   */
  stop() {
    return new Promise((resolve, reject) => {
      this.server.close(error => {
        if (error) {
          reject(error)
        }

        console.log("Сервер остановлен")
        resolve()
      })
    })
  }
  
  /**
   * Обработчик запросов к серверу
   * @param {Object} request запрос
   * @param {Object} response ответ
   */
  handler(request, response) {
    /**
     * Заершить ответ от сервера
     * @param {Number} status статус ответа
     * @param {String} content содержимое тела ответа
     * @param {Object} headers заголовки
     */
    const end = (status, content, headers) => {
      response.writeHead(status, headers)
      response.write(content)
      response.end()
    }

    try {
      const url = new URL(request.url, this.origin)
      const file = url.pathname.substr(1) || this.indexFile
      const extension = this.getExtension(file)
      const content = fs.readFileSync(this.resolvePath(file))

      // Завершить ответ от сервера
      end(StaticServer.STATUS_CODE_OK, content, {
        "Content-Type": this.getContentType(extension)
      })
    } catch (error) {
      let content = ""
      let contentType = ""

      // Если файл доступен для чтения
      if (this.notFoundFile && fs.accessSync(this.resolvePath(this.notFoundFile), fs.R_OK)) {
        const extension = this.getExtension(this.notFoundFile)

        content = fs.readFileSync(this.resolvePath(this.notFoundFile))
        contentType = this.getContentType(extension)
      } else {
        content = StaticServer.DEFAULT_NOT_FOUND_MESSAGE
        contentType = StaticServer.DEFAULT_CONTENT_TYPE
      }

      // Завершить ответ от сервера с ошибкой 404
      end(StaticServer.STATUS_CODE_NOT_FOUND, content, {
        "Content-Type": contentType
      })
    }
  }

  /**
   * Получить расширение файла 
   * @param {String} file путь к файлу 
   * @return {String|null}
   */
  getExtension(file) {
    const separatorPosition = file.lastIndexOf(StaticServer.EXTENSION_SEPARATOR)

    if (separatorPosition !== -1) {
      return file.substr(separatorPosition + 1)
    }

    return null
  }

  /**
   * Получить MIME-тип конетента 
   * @param {String} extension 
   * @return {String}
   */
  getContentType(extension, charset = "utf-8") {
    const TYPE_TEXT = "text"
    const mimeType = this.mimeTypes[extension] || StaticServer.DEFAULT_CONTENT_TYPE

    // Если указана кодировка и это текстовый MIME-тип
    if (charset && mimeType.startsWith(TYPE_TEXT)) {
      // Отдать тип с кодировкой
      return `${mimeType}; charset=${charset}`
    }

    return mimeType
  }

  /**
   * Нормализовать путь к файлу (относительно корневой директории)
   * @param {String} file путь к файлу 
   * @return {String}
   */
  normalizePath(file) {
    if (file.startsWith(this.rootDir)) {
      return file
    }

    return path.resolve(this.rootDir, file)
  }

  /**
   * Проверить файл на доступ к чтению
   * @param {String} file путь к файлу 
   * @return {Boolean} файл доступен для чтения
   */
  checkAccess(file) {
    file = this.normalizePath(file)

    return fs.accessSync(file, fs.R_OK)
  }

  /**
   * Получить содержимое файла
   * @param {String} file путь к файлу 
   * @return {Object} содержимое и тип содержимого файла
   */
  getContent(file) {
    file = this.normalizePath(file)

    const extension = this.getExtension(file)
    const contentType = this.getContentType(extension)
    const content = fs.readFileSync(file, fs.R_OK)

    return { content, contentType }
  }
}

module.exports = StaticServer
