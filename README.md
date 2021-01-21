# Статический NodeJS сервер

[![Build Status](https://img.shields.io/github/checks-status/scottwalker87/node-static-server/main?style=for-the-badge)](https://github.com/scottwalker87/node-static-server)
[![NPM Package](https://img.shields.io/npm/v/@scottwalker/node-static-server?style=for-the-badge)](https://www.npmjs.com/package/@scottwalker/node-static-server)
[![Scottweb](https://img.shields.io/badge/Scottweb-Web%20Development-red?style=for-the-badge)](http://scottweb.ru/)

Простой статический сервер написанный на NodeJS без использования сторонних библиотек 

#### Пример использования
```js
const { StaticServer } = require("@scottwalker/node-static-server")

// Инициализировать сервер
const server = new StaticServer({
  protocol: "http",
  host: "localhost",
  port: 3030,
  rootDir: "./public",
  indexFile: "index.html",
  notFoundFile: "notFound.html",
  mimeTypes: {
    "custom": "text/custom"
  }
})

// Слушать событие запуска
server.on("start", ({ message }) => console.log(message))

// Запустить сервер
server.start()

```

#### Конфигурация
```
protocol - протокол соединения
host - хост соединения
port - порт соединения
rootDir - корневая директория для статических файлов
indexFile - индексный файл
notFoundFile - файл показываемый в случае ошибки 404
mimeTypes - карта расширений и их MIME-типов
```
