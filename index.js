const StaticServer = require("./StaticServer")

const server = new StaticServer({
  port: 3030,
  rootDir: "./public"
})

server.start()
