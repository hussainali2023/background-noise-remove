const express = require('express');
const bull = require('bull');
const redis = require('redis');
const mongodb = require('mongodb');
const ffmpeg = require('ffmpeg');

const client = redis.createClient();


const db = new mongodb.MongoClient('mongodb://localhost:27017/');


const app = express();


app.get('/', (req, res) => {

  res.render('index.html');
});
app.post('/noise-reduction', (req, res) => {
  const videoUrl = req.body.videoUrl;
  const job = {
    videoUrl,
    status: 'new'
  };

  client.lPush('jobs', JSON.stringify(job));


  res.status(200).send('Job submitted successfully.');
});


const worker = ('jobs', (job) => {

  const videoUrl = job?.videoUrl;


  const videoFile = ffmpeg.input(videoUrl).output('video.mp4');


  videoFile.run((err, output) => {
    if (err) {

      job.status = 'failed';


      db.collection('jobs').updateOne({ _id: job._id }, { $set: { status: job.status } });

    
      res.status(500).send(err.message);
    } else {

      job.status = 'processed';


      db.collection('jobs').updateOne({ _id: job._id }, { $set: { status: job.status } });


      const downloadUrl = `/download/${job._id}`;


      res.status(200).send({ downloadUrl });
    }
  });
});

worker.start();

app.listen(3000, () => {
  console.log('App listening on port 3000!');
});
