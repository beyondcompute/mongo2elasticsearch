var config = {
  batch_size: 20,
  batch_start_from: 0, // to continue previously interrupted process
  fields: {}, // '{}' means 'all'
  source_mongo: {
    host: 'localhost',
    port: 27017,
    db: 'db',
    user: 'user',
    password: 'yyyy',
    collection: 'things'
  },
  target_elasticsearch: {
    host: 'http://localhost',
    port: 9200,
    index: 'things',
    type: 'thing'
  }
};

module.exports = config;