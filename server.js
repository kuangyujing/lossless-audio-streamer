const express = require('express')
const app = express()
const fs = require('fs')
const port = process.env.PORT || 3000

require('dotenv').config()
const MYSQLHOST = process.env.MYSQLHOST
const MYSQLPORT = process.env.MYSQLPORT
const MYSQLDATABASE = process.env.MYSQLDATABASE
const MYSQLUSER = process.env.MYSQLUSER
const MYSQLPASSWORD = process.env.MYSQLPASSWORD

const filestore = 'filestore'
const multer = require('multer')
const upload = multer({ dest: filestore })

app.listen(port, () => console.log("Express listening on port " + port))
app.use(express.static('public'))
app.use(express.json())

//const jsonParser = bodyParser.json()
//const bodyParser = require('body-parser')
//app.use(bodyParser.urlencoded({
//    extended: true
//}));
//app.use(bodyParser.json());

// for testing streaming plain mp3
app.get('/api/play/:key', (req, res) => {
    console.log("Received request to play " + req.params.key + ".mp3")
    const key = req.params.key

    // TODO switch file for paid/free users
    const music = 'samples/' + key + '.mp3'

    const stat = fs.statSync(music)
    range = req.headers.range

    // create buffer to store the streamed chunks
    let readStream

    if (range !== undefined) {
        const parts = range.replace(/bytes=/, "").split("-")

        const partial_start = parts[0]
        const partial_end = parts[1]

        if ((isNaN(partial_start) && partial_start.length > 1) || (isNaN(partial_end) && partial_end.length > 1)) {
            // ERR_INCOMPLETE_CHUNKED_ENCODING
            return res.sendStatus(500)
        }

        // calculate the start and end byte positions
        const start = parseInt(partial_start, 10)
        const end = partial_end ? parseInt(partial_end, 10) : stat.size - 1
        const content_length = (end - start) + 1

        res.status(206).header({
            'Content-Type': 'audio/mpeg',
            'Content-Length': content_length,
            'Content-Range': "bytes " + start + "-" + end + "/" + stat.size,
        })

        // create stream to partial content
        readStream = fs.createReadStream(music, { start: start, end: end })
    } else {
        res.header({
            'Content-Type': 'audio/mpeg',
            'Content-Length': stat.size
        })
        readStream = fs.createReadStream(music)
    }
    // send stream to browser
    readStream.pipe(res)
})

// for testing userid
app.get('/api/play/:userid/:key', (req, res) => {
    console.log("Received request to play " + req.params.key + ".mp3")
    const key = req.params.key

    const userid = req.params.userid
    const music = 'samples/' + key + '-' + userid + '.mp3'

    const stat = fs.statSync(music)
    range = req.headers.range

    // create buffer to store the streamed chunks
    let readStream

    if (range !== undefined) {
        const parts = range.replace(/bytes=/, "").split("-")

        const partial_start = parts[0]
        const partial_end = parts[1]

        if ((isNaN(partial_start) && partial_start.length > 1) || (isNaN(partial_end) && partial_end.length > 1)) {
            // ERR_INCOMPLETE_CHUNKED_ENCODING
            return res.sendStatus(500)
        }

        // calculate the start and end byte positions
        const start = parseInt(partial_start, 10)
        const end = partial_end ? parseInt(partial_end, 10) : stat.size - 1
        const content_length = (end - start) + 1

        res.status(206).header({
            'Content-Type': 'audio/mpeg',
            'Content-Length': content_length,
            'Content-Range': "bytes " + start + "-" + end + "/" + stat.size,
        })

        // create stream to partial content
        readStream = fs.createReadStream(music, { start: start, end: end })
    } else {
        res.header({
            'Content-Type': 'audio/mpeg',
            'Content-Length': stat.size
        })
        readStream = fs.createReadStream(music)
    }
    // send stream to browser
    readStream.pipe(res)
})

// incomplete: for testing start/end
app.get('/api/play/:key/:a/:b', (req, res) => {
    console.log("Received request to play " + req.params.key + ".mp3")
    const key = req.params.key

    // TODO switch file for paid/free users
    const music = 'samples/' + key + '.mp3'
    const a = req.params.a
    const b = req.params.b

    const stat = fs.statSync(music)
    range = req.headers.range

    // create buffer to store the streamed chunks
    let readStream

    if (range !== undefined) {
        const parts = range.replace(/bytes=/, "").split("-")

        const partial_start = parts[0]
        const partial_end = parts[1]

        if ((isNaN(partial_start) && partial_start.length > 1) || (isNaN(partial_end) && partial_end.length > 1)) {
            // ERR_INCOMPLETE_CHUNKED_ENCODING
            return res.sendStatus(500)
        }

        // calculate the start and end byte positions
        const start = parseInt(partial_start, 10)
        const end = partial_end ? parseInt(partial_end, 10) : stat.size - 1
        const content_length = (end - start) + 1

        res.status(206).header({
            'Content-Type': 'audio/mpeg',
            'Content-Length': content_length,
            'Content-Range': "bytes " + start + "-" + end + "/" + stat.size,
        })

        // create stream to partial content
        readStream = fs.createReadStream(music, { start: start, end: end })
    } else {
        res.header({
            'Content-Type': 'audio/mpeg',
            'Content-Length': stat.size
        })
        readStream = fs.createReadStream(music)
    }
    // send stream to browser
    readStream.pipe(res)
})

app.post('/upload', upload.single('file'), (req, res) => {
    console.log(`Received request to upload ${req.file.filename}`)
    // add .mp3 extension since simple upload does not have it
    fs.renameSync(req.file.path, req.file.path + '.mp3')
    res.send(req.file.filename + '.mp3')
})

app.post('/convert/:filename', (req, res) => {
    const filename = req.params.filename
    // get start and end time from request body
    const start = req.body.start
    const end = req.body.end
    console.log(`Received request to convert ${filename} from ${start} to ${end}`)

    if (!start || !end) {
        res.status(400).send('Bad request')
        return
    }

    // mute part of mp3 from `start` sec to `end` sec and save as `filename`-muted.mp3
    const batch = 'ffmpeg -i ' + filestore + '/' + filename + '.mp3' + ' -af "volume=enable=\'between(t,' + start + ',' + end + ')\':volume=0" ' + filestore + '/' + filename + '-muted.mp3'
    // execute command in bash
    const exec = require('child_process').exec
    exec(batch, (err, stdout, stderr) => {
        if (err) {
            console.log(err)
            return
        }
        console.log(stdout)
        console.log(stderr)
    })
    res.send('OK')
})

app.get('/', function (req, res) {
    res.send("OK")
})


// split mp3 file to 1s chunks
// ffmpeg -i input.mp3 -f segment -segment_time 1 -c copy out-%5d.mp3

// merge mp3 files
// ffmpeg -i out.list -f concat -acodec copy output.mp3

/* out.list file sample
 * --------------------
 * file 'out-00001.mp3'
 * file 'out-00002.mp3'
 * ...
 * --------------------
 */

/* for flac support
 * https://github.com/xiph/flac
 * https://github.com/melchor629/node-flac-bindings */

/* mute part of mp3
 * => do not need to replace 1s chunk if only mute part of mp3
 * ffmpeg -i video.mp4 -af "volume=enable='between(t,5,10)':volume=0 */
