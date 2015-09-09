var config = require('./config.js');
var MongoClient = require('mongodb').MongoClient;
var ElasticsearchClient = require('elasticsearch').Client;

var url = 'mongodb://'+
  config.source_mongo.user+':'+ config.source_mongo.password +'@'+
  config.source_mongo.host +':'+ config.source_mongo.port +'/'+
  config.source_mongo.db;

var elastic = new ElasticsearchClient({
  host: config.target_elasticsearch.host +':'+ config.target_elasticsearch.port
});

MongoClient.connect(url, function(err, mongo) {
  if (err) {
    console.log('ERROR connecting to source MongodDB:', err);
  } else {
    console.log('Connected to source MongoDB');

    elastic.ping({requestTimeout: 5000}, function(err) {
      if (err) {
        console.log('ERROR pinging target Elasticsearch:', err);
        process.exit();
      } else {
        console.log('Connected to target Solr');
        start(mongo, elastic);
      }
    });
    process.on('exit', function() {
      mongo.close();
    })
  }
});

function start(mongo, elastic) {
  console.log('Starting import');
  var collection = mongo.collection(config.source_mongo.collection);

  function doBatch(i) {
    console.log('========================== BATCH:', i, '(size: '+ config.batch_size +')');
    collection.find({}, config.fields).skip(i * config.batch_size).limit(config.batch_size).toArray(function(err, items) {
      if (err) {
        console.log('Error getting batch from Mongo:', err);
        process.exit();
      } else {
        console.log(items);
        var results = [];
        for (var n = 0, l = items.length; n < l; n++) {
          results.push({index: {_index: config.target_elasticsearch.index, _type: config.target_elasticsearch.type}});
          results.push(items[n]);
        }
        elastic.bulk({body: results}, function(err, resp) {
          if (err) {
            console.log('ERROR performing bulk insert:', err);
          }
          doBatch(i + 1);
        });
      }
    });
  }
  doBatch(config.batch_start_from);
}
