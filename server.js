const express = require('express')
const app = express()
const fs = require('fs')
const port = process.env.PORT || 3000

app.listen(port, function () {
    console.log("Express listening on port " + port)
})

app.get('/api/play/:key', function (req, res) {
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

app.get('/api/play/:userid/:key', function (req, res) {
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

app.get('/', function (req, res) {
    res.send("OK")
})
