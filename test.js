var execFile = require('child_process').execFile;
var filename = "./package.json";

execFile('file',['-b','--mime-type',filename],function(error, stdout, stderr) {
    console.log("STDOUT:",stdout.trim());
});

