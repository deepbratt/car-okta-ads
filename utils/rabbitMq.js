const amqp = require('amqplib/callback_api');
const Car = require('../models/cars/carModel');

exports.send = (queueName, data) => {
  open
    .then(function (conn) {
      return conn.createChannel();
    })
    .then(function (ch) {
      return ch.assertQueue(queueName).then(function (ok) {
        return ch.sendToQueue(queueName, Buffer.from(data));
      });
    })
    .catch(console.warn);
};

exports.userbanReceiver = () => {
  amqp.connect(process.env.RABBITMQ_URL, function (error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }
      var queue = 'inactive_user';

      console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queue);

      channel.consume(
        queue,
        function (msg) {
          console.log(JSON.parse(msg.content));
          Car.updateMany(JSON.parse(msg.content), { active: false })
            .then((result) => {
              console.log(result);
            })
            .catch((err) => console.log(err));
        },
        {
          noAck: true,
        },
      );
    });
  });
};
